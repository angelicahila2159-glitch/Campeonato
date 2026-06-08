import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const fechaId = searchParams.get('fechaId');
    const disciplinaId = searchParams.get('disciplinaId');
    const seriesIds = searchParams.get('seriesIds'); // Nuevo: recibir las series chocolateadas

    if (!fechaId || !disciplinaId) {
      return NextResponse.json(
        { success: false, error: 'fechaId y disciplinaId son requeridos' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    let query = `
      SELECT DISTINCT 
        CASE 
          WHEN equipo1_id = equipo2_id THEN equipo1_id
          ELSE NULL
        END as equipo_id
      FROM TblPartido
      WHERE fecha_id = ? AND disciplina_id = ?
      UNION ALL
      SELECT DISTINCT equipo1_id as equipo_id
      FROM TblPartido
      WHERE fecha_id = ? AND disciplina_id = ? AND equipo1_id != equipo2_id
      UNION ALL
      SELECT DISTINCT equipo2_id as equipo_id
      FROM TblPartido
      WHERE fecha_id = ? AND disciplina_id = ? AND equipo1_id != equipo2_id
    `;

    const params: any[] = [fechaId, disciplinaId, fechaId, disciplinaId, fechaId, disciplinaId];

    // Obtener equipos que jugaron en esta fecha
    const [equiposQueJugaron] = await connection.query(query, params);

    // Obtener SOLO los equipos de las SERIES CHOCOLATEADAS
    let todosEquipos;
    if (seriesIds) {
      // Si se especificaron series, obtener equipos solo de esas series
      const seriesArray = seriesIds.split(',').map((id: string) => parseInt(id));
      const placeholders = seriesArray.map(() => '?').join(',');
      
      const [result] = await connection.query(
        `SELECT DISTINCT e.id, e.nombre
        FROM TblEquipo e
        JOIN TblEquipoDisciplina ed ON e.id = ed.equipo_id
        WHERE ed.disciplina_id = ? AND e.activa = TRUE AND ed.serie_id IN (${placeholders})
        ORDER BY e.nombre`,
        [disciplinaId, ...seriesArray]
      );
      todosEquipos = result;
    } else {
      // Si no se especificaron series, obtener todos (compatibilidad hacia atrás)
      const [result] = await connection.query(
        `SELECT DISTINCT e.id, e.nombre
        FROM TblEquipo e
        JOIN TblEquipoDisciplina ed ON e.id = ed.equipo_id
        WHERE ed.disciplina_id = ? AND e.activa = TRUE
        ORDER BY e.nombre`,
        [disciplinaId]
      );
      todosEquipos = result;
    }

    // Equipos que NO jugaron = equipos sin pareja
    const equiposQueJugaronIds = new Set();
    if (Array.isArray(equiposQueJugaron)) {
      equiposQueJugaron.forEach((row: any) => {
        if (row.equipo_id) {
          equiposQueJugaronIds.add(row.equipo_id);
        }
      });
    }

    const equiposSueltos = Array.isArray(todosEquipos)
      ? todosEquipos.filter((eq: any) => !equiposQueJugaronIds.has(eq.id))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        equiposSueltos,
        total: equiposSueltos.length,
      },
    });
  } catch (error) {
    console.error('Error obteniendo equipos pendientes:', error);
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
