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

    // Agregar columnas de horario si no existen
    try {
      await connection.query(
        `ALTER TABLE TblSitio ADD COLUMN horario_inicio TIME DEFAULT '08:00:00'`
      );
    } catch (error: any) {
      if (!error.message.includes('Duplicate column')) {
        throw error;
      }
    }

    try {
      await connection.query(
        `ALTER TABLE TblSitio ADD COLUMN horario_fin TIME DEFAULT '22:00:00'`
      );
    } catch (error: any) {
      if (!error.message.includes('Duplicate column')) {
        throw error;
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblSitio migrada correctamente con campos de horario',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  }
}
