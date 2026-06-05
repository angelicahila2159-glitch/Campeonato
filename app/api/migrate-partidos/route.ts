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

    // Agregar columna sitio_id si no existe
    try {
      await connection.query(
        `ALTER TABLE TblPartido ADD COLUMN sitio_id INT REFERENCES TblSitio(id) ON DELETE SET NULL`
      );
    } catch (error: any) {
      if (!error.message.includes('Duplicate column')) {
        throw error;
      }
    }

    // Agregar columna horario_inicio si no existe
    try {
      await connection.query(
        `ALTER TABLE TblPartido ADD COLUMN horario_inicio TIME DEFAULT NULL`
      );
    } catch (error: any) {
      if (!error.message.includes('Duplicate column')) {
        throw error;
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblPartido migrada correctamente con sitio_id y horario_inicio',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  }
}
