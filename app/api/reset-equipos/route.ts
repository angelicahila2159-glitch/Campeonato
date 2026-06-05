import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Vaciar tablas
    await connection.query('DELETE FROM TblEquipoDisciplina');
    await connection.query('DELETE FROM TblEquipo');

    // Re-insertar datos de prueba
    await connection.query(
      'INSERT INTO TblEquipo (nombre) VALUES (?, ?, ?, ?)',
      ['Deportivo Unidos', 'FC Clásico', 'Liga Azul', 'Voley Elite']
    );

    // Asignar equipos a disciplinas
    await connection.query(
      `INSERT INTO TblEquipoDisciplina (equipo_id, disciplina_id, serie_id) VALUES 
       (1, 1, 1), (1, 2, 1),
       (2, 1, 2),
       (3, 2, 3),
       (4, 3, 4)`
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Datos de equipos reiniciados correctamente',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al reiniciar datos' },
      { status: 500 }
    );
  }
}
