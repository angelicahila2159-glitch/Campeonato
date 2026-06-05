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

    // Agregar columna tipo si no existe
    try {
      await connection.query(
        `ALTER TABLE TblFecha ADD COLUMN tipo ENUM('Apertura', 'Clausura') DEFAULT 'Apertura'`
      );
    } catch (error: any) {
      // Si la columna ya existe, ignorar el error
      if (!error.message.includes('Duplicate column')) {
        throw error;
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblFecha migrada correctamente con campo tipo',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  }
}
