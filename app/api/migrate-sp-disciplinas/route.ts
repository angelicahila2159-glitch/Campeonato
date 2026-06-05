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

    // Drop existing procedure
    try {
      await connection.query('DROP PROCEDURE IF EXISTS sp_ObtenerDisciplinas');
    } catch (error) {
      console.log('Procedure did not exist, creating new one');
    }

    // Recreate procedure with tipo_competicion
    await connection.query(`
      CREATE PROCEDURE sp_ObtenerDisciplinas()
      BEGIN
        SELECT id, nombre, activa, tipo_competicion, fecha_creacion, fecha_actualizacion
        FROM TblDisciplina
        WHERE activa = TRUE
        ORDER BY nombre ASC;
      END
    `);

    return NextResponse.json({
      success: true,
      message: 'Stored procedure sp_ObtenerDisciplinas actualizado correctamente',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al migrar' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
