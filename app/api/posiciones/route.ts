import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

interface Posicion {
  equipo_id: number;
  equipo_nombre: string;
  serie_id: number;
  serie_nombre: string;
  disciplina_id: number;
  disciplina_nombre: string;
  tipo_competicion: string;
  partidos_jugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  puntos: number;
  puntos_apertura: number;
  puntos_clausura: number;
  es_ganador: boolean;
}

// GET - Obtener tabla de posiciones
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get('disciplinaId');

    connection = await mysql.createConnection(dbConfig);

    // Obtener todos los equipos
    let query = `
      SELECT DISTINCT
        ed.equipo_id,
        e.nombre as equipo_nombre,
        ed.serie_id,
        s.nombre as serie_nombre,
        ed.disciplina_id,
        d.nombre as disciplina_nombre,
        COALESCE(d.tipo_competicion, 'vs') as tipo_competicion
      FROM TblEquipoDisciplina ed
      JOIN TblEquipo e ON ed.equipo_id = e.id
      JOIN TblSeries s ON ed.serie_id = s.id
      JOIN TblDisciplina d ON ed.disciplina_id = d.id
      WHERE e.activa = TRUE
    `;

    const params: any[] = [];

    if (disciplinaId) {
      query += ' AND ed.disciplina_id = ?';
      params.push(parseInt(disciplinaId));
    }

    query += ' ORDER BY ed.disciplina_id, ed.serie_id, ed.equipo_id ASC';

    const [equipoResults] = await connection.query(query, params);
    const equipos = Array.isArray(equipoResults) ? equipoResults : [];

    console.log(`Equipos encontrados: ${equipos.length}`);

    if (equipos.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Obtener TODOS los partidos finalizados de una sola vez
    const [todosLosPartidosResults] = await connection.query(`
      SELECT 
        p.id, 
        p.goles_equipo1, 
        p.goles_equipo2, 
        p.equipo1_id, 
        p.equipo2_id, 
        COALESCE(p.puntos_individuales, 0) as puntos_individuales, 
        p.estado, 
        COALESCE(f.tipo, 'Apertura') as fecha_tipo, 
        COALESCE(d.tipo_competicion, 'vs') as tipo_competicion,
        p.disciplina_id,
        p.serie_id
      FROM TblPartido p
      LEFT JOIN TblFecha f ON p.fecha_id = f.id
      LEFT JOIN TblDisciplina d ON p.disciplina_id = d.id
      WHERE p.estado = 'Finalizado'
      LIMIT 10000
    `);

    const todosLosPartidos = Array.isArray(todosLosPartidosResults) ? todosLosPartidosResults : [];
    console.log(`Partidos totales encontrados: ${todosLosPartidos.length}`);

    // Procesar cada equipo
    const posiciones: Posicion[] = [];

    for (const equipo of equipos) {
      try {
        // Filtrar partidos relevantes para este equipo
        const equipoPartidos = todosLosPartidos.filter((p: any) => {
          return p.disciplina_id === equipo.disciplina_id && 
                 p.serie_id === equipo.serie_id && 
                 (p.equipo1_id === equipo.equipo_id || p.equipo2_id === equipo.equipo_id);
        });

        let victorias = 0;
        let empates = 0;
        let derrotas = 0;
        let goles_favor = 0;
        let goles_contra = 0;
        let puntos_apertura = 0;
        let puntos_clausura = 0;

        for (const partido of equipoPartidos) {
          try {
            if (equipo.tipo_competicion === 'puntos') {
              // Disciplinas individuales
              const puntosIndividuales = partido.puntos_individuales || 0;
              goles_favor += puntosIndividuales;

              if (partido.fecha_tipo === 'Apertura') {
                puntos_apertura += puntosIndividuales;
              } else if (partido.fecha_tipo === 'Clausura') {
                puntos_clausura += puntosIndividuales;
              }
            } else {
              // Disciplinas VS
              const esLocal = partido.equipo1_id === equipo.equipo_id;
              const golesEquipo = esLocal ? partido.goles_equipo1 : partido.goles_equipo2;
              const golesContrario = esLocal ? partido.goles_equipo2 : partido.goles_equipo1;

              goles_favor += golesEquipo;
              goles_contra += golesContrario;

              let puntosPartido = 0;
              if (golesEquipo > golesContrario) {
                victorias++;
                puntosPartido = 3;
              } else if (golesEquipo === golesContrario) {
                empates++;
                puntosPartido = 1;
              } else {
                derrotas++;
                puntosPartido = 0;
              }

              if (partido.fecha_tipo === 'Apertura') {
                puntos_apertura += puntosPartido;
              } else if (partido.fecha_tipo === 'Clausura') {
                puntos_clausura += puntosPartido;
              }
            }
          } catch (e) {
            console.error('Error procesando partido:', e);
          }
        }

        const puntos = puntos_apertura + puntos_clausura;
        const diferencia_goles = goles_favor - goles_contra;

        posiciones.push({
          equipo_id: equipo.equipo_id,
          equipo_nombre: equipo.equipo_nombre,
          serie_id: equipo.serie_id,
          serie_nombre: equipo.serie_nombre,
          disciplina_id: equipo.disciplina_id,
          disciplina_nombre: equipo.disciplina_nombre,
          tipo_competicion: equipo.tipo_competicion,
          partidos_jugados: equipoPartidos.length,
          victorias,
          empates,
          derrotas,
          goles_favor,
          goles_contra,
          diferencia_goles,
          puntos,
          puntos_apertura,
          puntos_clausura,
          es_ganador: false,
        });
      } catch (e) {
        console.error(`Error procesando equipo ${equipo.equipo_id}:`, e);
      }
    }

    // Calcular ganadores
    const posicionesPorSerieDisciplina: { [key: string]: Posicion[] } = {};
    posiciones.forEach((pos) => {
      const key = `${pos.disciplina_id}_${pos.serie_id}`;
      if (!posicionesPorSerieDisciplina[key]) {
        posicionesPorSerieDisciplina[key] = [];
      }
      posicionesPorSerieDisciplina[key].push(pos);
    });

    Object.values(posicionesPorSerieDisciplina).forEach((equiposSerie) => {
      equiposSerie.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.diferencia_goles !== a.diferencia_goles) return b.diferencia_goles - a.diferencia_goles;
        return b.goles_favor - a.goles_favor;
      });
      if (equiposSerie.length > 0) {
        equiposSerie[0].es_ganador = true;
      }
    });
    
    posiciones.sort((a, b) => {
      if (a.disciplina_id !== b.disciplina_id) return a.disciplina_id - b.disciplina_id;
      if (a.serie_id !== b.serie_id) return a.serie_id - b.serie_id;
      return b.puntos - a.puntos;
    });

    console.log(`Retornando ${posiciones.length} posiciones`);

    return NextResponse.json({
      success: true,
      data: posiciones,
    });
  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener posiciones', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

