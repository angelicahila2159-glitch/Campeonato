import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

interface Equipo {
  id: number;
  nombre: string;
}

interface EquipoSerie {
  equipo_id: number;
  equipo_nombre: string;
  serie_id: number;
  serie_nombre: string;
  disciplina_id: number;
  disciplina_nombre: string;
  tipo_competicion: string;
}

interface Sitio {
  id: number;
  nombre: string;
  horario_inicio: string;
  horario_fin: string;
}

interface Partido {
  equipo1_id: number;
  equipo1_nombre: string;
  equipo2_id?: number;
  equipo2_nombre?: string;
  serie_id: number;
  serie_nombre: string;
  fecha_id: string;
  sitio_id?: number;
  sitio_nombre?: string;
  horario?: string;
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { fechaId, disciplinaId, sitioId, seriesIds } = await request.json();

    if (!fechaId || !disciplinaId || !sitioId || !seriesIds || seriesIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'fechaId, disciplinaId, sitioId y al menos una serieId son requeridos',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener información de la fecha actual para saber si es Apertura o Clausura
    const [fechaResult] = await connection.query(
      `SELECT tipo FROM TblFecha WHERE id = ?`,
      [fechaId]
    );
    const fechaData = Array.isArray(fechaResult) ? fechaResult[0] : null;
    const tipoFecha = fechaData?.tipo || 'Apertura'; // Apertura o Clausura

    // Si es Clausura, obtener todos los vs que se jugaron en Apertura
    const vsAperturaProhibidos = new Set<string>();
    
    if (tipoFecha === 'Clausura') {
      const [vsAperturaResult] = await connection.query(`
        SELECT DISTINCT 
          LEAST(p.equipo1_id, p.equipo2_id) as equipo_menor,
          GREATEST(p.equipo1_id, p.equipo2_id) as equipo_mayor
        FROM TblPartido p
        JOIN TblFecha f ON p.fecha_id = f.id
        WHERE f.tipo = 'Apertura'
        AND p.disciplina_id = ?
        AND p.equipo1_id != p.equipo2_id
      `, [disciplinaId]);

      if (Array.isArray(vsAperturaResult)) {
        vsAperturaResult.forEach((row: any) => {
          // Guardar como "equipoMenor-equipoMayor" para comparación fácil
          vsAperturaProhibidos.add(`${row.equipo_menor}-${row.equipo_mayor}`);
        });
      }
      
      console.log(`VS prohibidos en Clausura (ya jugaron en Apertura): ${vsAperturaProhibidos.size}`);
    }

    // Primero, eliminar SOLO los partidos de las series seleccionadas en esta disciplina y fecha
    const seriesPlaceholders = seriesIds.map(() => '?').join(',');
    await connection.query(
      `DELETE FROM TblPartido WHERE fecha_id = ? AND disciplina_id = ? AND serie_id IN (${seriesPlaceholders})`,
      [fechaId, disciplinaId, ...seriesIds]
    );

    // Obtener información de la disciplina
    const [disciplinaResult] = await connection.query(
      `SELECT tipo_competicion, nombre FROM TblDisciplina WHERE id = ?`,
      [disciplinaId]
    );
    const disciplinaData = Array.isArray(disciplinaResult) ? disciplinaResult[0] : null;
    const tipoCompeticion = disciplinaData?.tipo_competicion || 'vs';
    const disciplinaNombre = disciplinaData?.nombre || 'Unknown';

    // Obtener todos los equipos en esta disciplina agrupados por serie (SOLO LAS SELECCIONADAS)
    const placeholders = seriesIds.map(() => '?').join(',');
    const [equiposResult] = await connection.query(
      `SELECT 
        ed.equipo_id,
        e.nombre as equipo_nombre,
        ed.serie_id,
        s.nombre as serie_nombre,
        ed.disciplina_id,
        d.nombre as disciplina_nombre,
        d.tipo_competicion
      FROM TblEquipoDisciplina ed
      JOIN TblEquipo e ON ed.equipo_id = e.id
      JOIN TblSeries s ON ed.serie_id = s.id
      JOIN TblDisciplina d ON ed.disciplina_id = d.id
      WHERE ed.disciplina_id = ? AND e.activa = TRUE AND ed.serie_id IN (${placeholders})
      ORDER BY ed.serie_id, e.nombre`,
      [disciplinaId, ...seriesIds]
    );

    const equipos = Array.isArray(equiposResult) ? (equiposResult as EquipoSerie[]) : [];

    if (equipos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay equipos en esta disciplina',
        },
        { status: 400 }
      );
    }

    // Obtener sitios para esta disciplina
    let sitiosParaUsar: Sitio[] = [];
    
    if (sitioId) {
      // Si se especificó un sitio, usar solo ese
      const [sitioResult] = await connection.query(
        `SELECT id, nombre, TIME_FORMAT(horario_inicio, '%H:%i') as horario_inicio, TIME_FORMAT(horario_fin, '%H:%i') as horario_fin
         FROM TblSitio WHERE id = ? AND activa = TRUE`,
        [sitioId]
      );
      sitiosParaUsar = Array.isArray(sitioResult) ? (sitioResult as Sitio[]) : [];
    } else {
      // Obtener todos los sitios para distribuir
      const [sitiosResult] = await connection.query(
        `SELECT id, nombre, TIME_FORMAT(horario_inicio, '%H:%i') as horario_inicio, TIME_FORMAT(horario_fin, '%H:%i') as horario_fin
         FROM TblSitio WHERE disciplina_id = ? AND activa = TRUE`,
        [disciplinaId]
      );
      sitiosParaUsar = Array.isArray(sitiosResult) ? (sitiosResult as Sitio[]) : [];
    }

    // Agrupar equipos por serie
    const seriesMap = new Map<number, Equipo[]>();
    const serieNamesMap = new Map<number, string>();
    
    equipos.forEach((eq) => {
      if (!seriesMap.has(eq.serie_id)) {
        seriesMap.set(eq.serie_id, []);
        serieNamesMap.set(eq.serie_id, eq.serie_nombre);
      }
      seriesMap.get(eq.serie_id)!.push({
        id: eq.equipo_id,
        nombre: eq.equipo_nombre,
      });
    });

    // Helper function to add minutes to a time string
    const addMinutesToTime = (timeStr: string, minutes: number): string => {
      const [hours, mins] = timeStr.split(':').map(Number);
      let totalMinutes = hours * 60 + mins + minutes;
      
      // Handle day overflow (max 24 hours = 1440 minutes)
      totalMinutes = totalMinutes % 1440;
      
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      
      return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    };

    // Generar partidos (Chocolate) para cada serie con horarios escalonados
    const partidos: Partido[] = [];
    const matchCountPerSitio = new Map<number, number>();
    const equiposPorHorario = new Map<string, Set<number>>(); // Track equipo_id por horario
    let vsSkipped = 0;
    let equiposDuplicadosSkipped = 0;

    seriesMap.forEach((equiposEnSerie, serieId) => {
      const serieName = serieNamesMap.get(serieId) || '';
      
      // Mezclar equipos aleatoriamente
      const shuffle = (arr: Equipo[]) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const equiposMezclados = shuffle(equiposEnSerie);

      if (tipoCompeticion === 'puntos') {
        // Para puntos, cada equipo es un "turno" individual
        for (let i = 0; i < equiposMezclados.length; i++) {
          const sitioIndex = i % (sitiosParaUsar.length > 0 ? sitiosParaUsar.length : 1);
          const sitio = sitiosParaUsar[sitioIndex];
          const horarioInicio = sitio ? sitio.horario_inicio : '08:00';
          
          const horarioKey = `${horarioInicio}`;
          if (!equiposPorHorario.has(horarioKey)) {
            equiposPorHorario.set(horarioKey, new Set());
          }
          equiposPorHorario.get(horarioKey)!.add(equiposMezclados[i].id);

          partidos.push({
            equipo1_id: equiposMezclados[i].id,
            equipo1_nombre: equiposMezclados[i].nombre,
            equipo2_id: equiposMezclados[i].id,
            equipo2_nombre: equiposMezclados[i].nombre,
            serie_id: serieId,
            serie_nombre: serieName,
            fecha_id: fechaId,
            sitio_id: sitio?.id,
            sitio_nombre: sitio?.nombre,
            horario: horarioInicio,
          });
        }
      } else {
        // Para disciplinas vs
        const matchCount = Math.floor(equiposMezclados.length / 2);
        
        for (let i = 0; i < matchCount; i++) {
          const sitioIndex = i % (sitiosParaUsar.length > 0 ? sitiosParaUsar.length : 1);
          const sitio = sitiosParaUsar[sitioIndex];
          
          if (!sitio) {
            partidos.push({
              equipo1_id: equiposMezclados[i * 2].id,
              equipo1_nombre: equiposMezclados[i * 2].nombre,
              equipo2_id: equiposMezclados[i * 2 + 1].id,
              equipo2_nombre: equiposMezclados[i * 2 + 1].nombre,
              serie_id: serieId,
              serie_nombre: serieName,
              fecha_id: fechaId,
              sitio_id: undefined,
              sitio_nombre: undefined,
              horario: '08:00',
            });
            continue;
          }

          // VALIDACIÓN: Verificar que no sea un vs prohibido
          const eq1 = equiposMezclados[i * 2].id;
          const eq2 = equiposMezclados[i * 2 + 1].id;
          const vsKey = `${Math.min(eq1, eq2)}-${Math.max(eq1, eq2)}`;
          
          if (tipoFecha === 'Clausura' && vsAperturaProhibidos.has(vsKey)) {
            console.log(`⚠ Saltando vs ${equiposMezclados[i * 2].nombre} vs ${equiposMezclados[i * 2 + 1].nombre} (ya jugaron en Apertura)`);
            vsSkipped++;
            continue;
          }

          const currentMatchCount = matchCountPerSitio.get(sitio.id) || 0;
          let currentHorario = addMinutesToTime(sitio.horario_inicio, currentMatchCount * 45);

          // VALIDACIÓN: Verificar que ninguno de los dos equipos ya esté jugando en este horario
          const horarioKey = `${currentHorario}`;
          const equiposEnHorario = equiposPorHorario.get(horarioKey) || new Set();
          
          if (equiposEnHorario.has(eq1) || equiposEnHorario.has(eq2)) {
            console.log(`⚠ Saltando partido ${equiposMezclados[i * 2].nombre} vs ${equiposMezclados[i * 2 + 1].nombre} en horario ${currentHorario} (equipo ya tiene partido simultáneo)`);
            equiposDuplicadosSkipped++;
            continue;
          }

          // Registrar equipos en este horario
          if (!equiposPorHorario.has(horarioKey)) {
            equiposPorHorario.set(horarioKey, new Set());
          }
          equiposPorHorario.get(horarioKey)!.add(eq1);
          equiposPorHorario.get(horarioKey)!.add(eq2);

          matchCountPerSitio.set(sitio.id, currentMatchCount + 1);

          partidos.push({
            equipo1_id: equiposMezclados[i * 2].id,
            equipo1_nombre: equiposMezclados[i * 2].nombre,
            equipo2_id: equiposMezclados[i * 2 + 1].id,
            equipo2_nombre: equiposMezclados[i * 2 + 1].nombre,
            serie_id: serieId,
            serie_nombre: serieName,
            fecha_id: fechaId,
            sitio_id: sitio.id,
            sitio_nombre: sitio.nombre,
            horario: currentHorario,
          });
        }
      }
    });

    // Guardar los partidos en la base de datos
    for (const partido of partidos) {
      const horaPartido = partido.horario ? `${partido.horario}:00` : null;
      
      await connection.query(
        `INSERT INTO TblPartido (fecha_id, disciplina_id, serie_id, equipo1_id, equipo2_id, sitio_id, horario_inicio, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Programado')`,
        [fechaId, disciplinaId, partido.serie_id, partido.equipo1_id, partido.equipo2_id, partido.sitio_id, horaPartido]
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        partidos,
        total: partidos.length,
        vsSkipped,
        equiposDuplicadosSkipped,
        tipo_competicion: tipoCompeticion,
        tipo_fecha: tipoFecha,
        message: `${partidos.length} partidos generados. ${vsSkipped > 0 ? `${vsSkipped} vs saltados (ya jugados en ${tipoFecha === 'Clausura' ? 'Apertura' : 'Clausura'})` : ''} ${equiposDuplicadosSkipped > 0 ? `${equiposDuplicadosSkipped} partidos saltados (equipos con conflicto de horario)` : ''}`,
      },
    });
  } catch (error) {
    console.error('Error generando partidos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
