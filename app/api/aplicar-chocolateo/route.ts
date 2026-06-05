import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

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

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { fechaId } = await request.json();

    if (!fechaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'fechaId es requerido',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener todos los partidos VS de esta fecha agrupados por matchup
    const [partidosResult] = await connection.query(
      `SELECT 
        p.id,
        p.disciplina_id,
        d.nombre as disciplina_nombre,
        LEAST(p.equipo1_id, p.equipo2_id) as equipo_menor,
        GREATEST(p.equipo1_id, p.equipo2_id) as equipo_mayor,
        p.equipo1_id,
        p.equipo2_id,
        e1.nombre as eq1_nombre,
        e2.nombre as eq2_nombre,
        TIME_FORMAT(p.horario_inicio, '%H:%i') as horario_actual
      FROM TblPartido p
      JOIN TblDisciplina d ON p.disciplina_id = d.id
      JOIN TblEquipo e1 ON p.equipo1_id = e1.id
      JOIN TblEquipo e2 ON p.equipo2_id = e2.id
      WHERE p.fecha_id = ? AND d.tipo_competicion = 'vs' AND p.equipo1_id != p.equipo2_id
      ORDER BY p.disciplina_id, p.horario_inicio`,
      [fechaId]
    );

    if (!Array.isArray(partidosResult) || partidosResult.length === 0) {
      return NextResponse.json({
        success: true,
        data: { mensaje: 'No hay partidos VS en esta fecha' },
      });
    }

    // Agrupar por matchup (eq_menor-eq_mayor)
    const matchupsByDisciplina = new Map<string, any[]>(); // "eq1-eq2" -> [{disciplina_id, partido_id, ...}]

    partidosResult.forEach((row: any) => {
      const matchupKey = `${row.equipo_menor}-${row.equipo_mayor}`;
      if (!matchupsByDisciplina.has(matchupKey)) {
        matchupsByDisciplina.set(matchupKey, []);
      }
      matchupsByDisciplina.get(matchupKey)!.push(row);
    });

    // Para cada matchup, si existe en múltiples disciplinas, escalonar horarios
    let actualizacionesRealizadas = 0;
    const detallesActualizacion = [];

    matchupsByDisciplina.forEach((partidos, matchupKey) => {
      if (partidos.length > 1) {
        // Ordenar por horario actual
        partidos.sort((a, b) => {
          const [ha, ma] = a.horario_actual.split(':').map(Number);
          const [hb, mb] = b.horario_actual.split(':').map(Number);
          return (ha * 60 + ma) - (hb * 60 + mb);
        });

        // El primero mantiene su horario, los demás se escalonan +60 minutos cada uno
        for (let i = 1; i < partidos.length; i++) {
          const partido = partidos[i];
          const horarioAnterior = partidos[i - 1].horario_actual;
          const nuevoHorario = addMinutesToTime(horarioAnterior, 60);

          detallesActualizacion.push({
            matchup: matchupKey,
            disciplina: partido.disciplina_nombre,
            equipos: `${partido.eq1_nombre} vs ${partido.eq2_nombre}`,
            horario_anterior: partido.horario_actual,
            horario_nuevo: nuevoHorario,
          });

          // Actualizar en BD
          connection.query(
            `UPDATE TblPartido SET horario_inicio = ? WHERE id = ?`,
            [`${nuevoHorario}:00`, partido.id]
          );

          actualizacionesRealizadas++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        actualizacionesRealizadas,
        detallesActualizacion,
        mensaje: `Se aplicó chocolateo a ${actualizacionesRealizadas} partidos`,
      },
    });
  } catch (error) {
    console.error('Error aplicando chocolateo:', error);
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
