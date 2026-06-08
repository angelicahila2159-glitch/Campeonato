import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function PUT(request: NextRequest) {
  let connection;
  try {
    const { partidoId, nuevoHorario } = await request.json();

    if (!partidoId || !nuevoHorario) {
      return NextResponse.json(
        { success: false, error: 'partidoId y nuevoHorario son requeridos' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener información del partido actual
    const [partidoActual] = await connection.query(
      `SELECT id, equipo1_id, equipo2_id, horario_inicio, disciplina_id, fecha_id
       FROM TblPartido WHERE id = ?`,
      [partidoId]
    );

    if (!Array.isArray(partidoActual) || partidoActual.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Partido no encontrado' },
        { status: 404 }
      );
    }

    const partido = partidoActual[0];

    // Validar que el nuevo horario no tenga conflicto con otros partidos del mismo equipo
    const [conflictosEq1] = await connection.query(
      `SELECT COUNT(*) as count FROM TblPartido
       WHERE fecha_id = ? 
         AND id != ?
         AND horario_inicio = ?
         AND (equipo1_id = ? OR equipo2_id = ?)`,
      [partido.fecha_id, partidoId, nuevoHorario, partido.equipo1_id, partido.equipo1_id]
    );

    const [conflictosEq2] = await connection.query(
      `SELECT COUNT(*) as count FROM TblPartido
       WHERE fecha_id = ? 
         AND id != ?
         AND horario_inicio = ?
         AND (equipo1_id = ? OR equipo2_id = ?)`,
      [partido.fecha_id, partidoId, nuevoHorario, partido.equipo2_id, partido.equipo2_id]
    );

    const hasConflictoEq1 = Array.isArray(conflictosEq1) && conflictosEq1[0].count > 0;
    const hasConflictoEq2 = Array.isArray(conflictosEq2) && conflictosEq2[0].count > 0;

    if (hasConflictoEq1 || hasConflictoEq2) {
      return NextResponse.json(
        {
          success: false,
          error: 'El nuevo horario tiene conflicto con otro partido del mismo equipo',
        },
        { status: 400 }
      );
    }

    // Actualizar el horario
    await connection.query(
      `UPDATE TblPartido SET horario_inicio = ? WHERE id = ?`,
      [nuevoHorario, partidoId]
    );

    return NextResponse.json({
      success: true,
      data: {
        partidoId,
        horarioAnterior: partido.horario_inicio,
        horarioNuevo: nuevoHorario,
        mensaje: 'Horario actualizado correctamente',
      },
    });
  } catch (error) {
    console.error('Error cambiando horario:', error);
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
