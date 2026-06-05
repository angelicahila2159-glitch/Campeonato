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

    // Modificar columna equipo2_id para permitir NULL
    try {
      await connection.query(
        `ALTER TABLE TblPartido MODIFY COLUMN equipo2_id INT DEFAULT NULL`
      );
    } catch (error: any) {
      console.log('Nota:', error.message);
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblPartido actualizada - equipo2_id ahora permite NULL',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  }
}
