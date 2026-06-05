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

    // Agregar columna tipo_competicion si no existe
    try {
      await connection.query(
        `ALTER TABLE TblDisciplina ADD COLUMN tipo_competicion ENUM('vs', 'puntos') DEFAULT 'vs'`
      );
    } catch (error: any) {
      if (!error.message.includes('Duplicate column')) {
        throw error;
      }
    }

    // Actualizar disciplinas de puntos
    const disciplinasConPuntos = ['Billar Bola 9', 'Cubilete', 'Tiro al Sapo', 'Natacion'];
    for (const disciplina of disciplinasConPuntos) {
      await connection.query(
        `UPDATE TblDisciplina SET tipo_competicion = 'puntos' WHERE nombre = ?`,
        [disciplina]
      );
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblDisciplina migrada correctamente con tipo_competicion',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  }
}
