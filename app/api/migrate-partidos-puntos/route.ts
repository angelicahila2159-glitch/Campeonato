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

    // Agregar columna puntos_individuales si no existe
    try {
      await connection.query(
        `ALTER TABLE TblPartido ADD COLUMN puntos_individuales INT DEFAULT NULL`
      );
      console.log('Columna puntos_individuales agregada exitosamente');
    } catch (error: any) {
      if (error.message.includes('Duplicate column')) {
        console.log('La columna puntos_individuales ya existe');
      } else {
        throw error;
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblPartido actualizada - columna puntos_individuales agregada',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  }
}
