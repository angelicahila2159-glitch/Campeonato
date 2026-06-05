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
  disciplina_id?: number;
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
    const matchupsByHorario = new Map<string, Set<string>>(); // Track matchups (eq1-eq2) por horario para chocolateo escalonado
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
            disciplina_id: disciplinaId,
            sitio_id: sitio?.id,
            sitio_nombre: sitio?.nombre,
            horario: horarioInicio,
          });
        }
      } else {
        // Para disciplinas vs
        let matchCount = Math.floor(equiposMezclados.length / 2);
        let equipoSuelto: Equipo | null = null;
        
        // Detectar si hay equipo suelto (número impar de equipos)
        if (equiposMezclados.length % 2 === 1) {
          equipoSuelto = equiposMezclados[equiposMezclados.length - 1];
          console.log(`📌 Equipo suelto detectado: ${equipoSuelto.nombre} en serie ${serieName}`);
          // El equipo suelto NO juega en esta fecha, solo se registra para la siguiente
        }
        
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
              disciplina_id: disciplinaId,
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

          // Registrar el matchup
          if (!matchupsByHorario.has(horarioKey)) {
            matchupsByHorario.set(horarioKey, new Set());
          }
          matchupsByHorario.get(horarioKey)!.add(vsKey);

          matchCountPerSitio.set(sitio.id, currentMatchCount + 1);

          partidos.push({
            equipo1_id: equiposMezclados[i * 2].id,
            equipo1_nombre: equiposMezclados[i * 2].nombre,
            equipo2_id: equiposMezclados[i * 2 + 1].id,
            equipo2_nombre: equiposMezclados[i * 2 + 1].nombre,
            serie_id: serieId,
            serie_nombre: serieName,
            fecha_id: fechaId,
            disciplina_id: disciplinaId,
            sitio_id: sitio.id,
            sitio_nombre: sitio.nombre,
            horario: currentHorario,
          });
        }
      }
    });

    // NUEVO: Aplicar horarios escalonados para otros disciplinas (chocolateo)
    // Si en Fútbol hay 2002 vs 1995 a las 08:00, en Básquetbol debe ser 2002 vs 1995 a las 09:00
    // Obtener todos los partidos de la fecha para saber qué matchups ya existen
    const [partidosEnFechaResult] = await connection.query(
      `SELECT 
        p.disciplina_id,
        LEAST(p.equipo1_id, p.equipo2_id) as equipo_menor,
        GREATEST(p.equipo1_id, p.equipo2_id) as equipo_mayor,
        TIME_FORMAT(p.horario_inicio, '%H:%i') as horario,
        d.nombre as disciplina_nombre,
        e1.nombre as eq1_nombre,
        e2.nombre as eq2_nombre
      FROM TblPartido p
      JOIN TblDisciplina d ON p.disciplina_id = d.id
      JOIN TblEquipo e1 ON p.equipo1_id = e1.id
      JOIN TblEquipo e2 ON p.equipo2_id = e2.id
      WHERE p.fecha_id = ? AND d.tipo_competicion = 'vs' AND p.equipo1_id != p.equipo2_id
      ORDER BY p.disciplina_id, horario`,
      [fechaId]
    );

    const matchupsPorDisciplina = new Map<number, Set<string>>(); // disciplina_id -> Set de "eq1-eq2" (ordenados)
    
    if (Array.isArray(partidosEnFechaResult)) {
      partidosEnFechaResult.forEach((row: any) => {
        if (!matchupsPorDisciplina.has(row.disciplina_id)) {
          matchupsPorDisciplina.set(row.disciplina_id, new Set());
        }
        const matchupKey = `${row.equipo_menor}-${row.equipo_mayor}`;
        matchupsPorDisciplina.get(row.disciplina_id)!.add(matchupKey);
      });
    }

    // Para cada matchup en esta disciplina, buscar si existe en otras disciplinas
    // Si existe, ajustar su horario 1 hora después
    matchupsByHorario.forEach((matchups, horarioKey) => {
      matchups.forEach((matchup) => {
        // Buscar en otros partidos de la fecha si existe este mismo matchup en otra disciplina
        if (Array.isArray(partidosEnFechaResult)) {
          const partidosConMismoMatchup = partidosEnFechaResult.filter((row: any) => {
            const dbMatchup = `${row.equipo_menor}-${row.equipo_mayor}`;
            return dbMatchup === matchup && row.disciplina_id !== disciplinaId;
          });

          // Actualizar el horario de estos partidos a +1 hora
          partidosConMismoMatchup.forEach((row: any) => {
            const nuevoHorario = addMinutesToTime(horarioKey, 60);
            console.log(`📍 Escalonando ${row.eq1_nombre} vs ${row.eq2_nombre} en ${row.disciplina_nombre}: ${horarioKey} → ${nuevoHorario}`);
            
            // Aquí actualizaríamos en la BD, pero como se genera disciplina por disciplina,
            // esto se manejará cuando se genere esa disciplina
          });
        }
      });
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
        next_step: 'Llamar a /api/aplicar-chocolateo con { fechaId } para escalonar horarios entre disciplinas',
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
