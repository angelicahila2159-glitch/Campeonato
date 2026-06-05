import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Verificar que la tabla existe
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'TblDisciplina'",
      [process.env.DB_NAME]
    );

    // Verificar que los SPs existen
    const [procedures] = await connection.query(
      "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'",
      [process.env.DB_NAME]
    );

    // Contar disciplinas
    const [disciplinas] = await connection.query('SELECT COUNT(*) as count FROM TblDisciplina');

    return NextResponse.json({
      success: true,
      database: process.env.DB_NAME,
      tableExists: Array.isArray(tables) && tables.length > 0,
      procedures: Array.isArray(procedures) ? procedures.map((p: any) => p.ROUTINE_NAME) : [],
      disciplinasCount: Array.isArray(disciplinas) ? disciplinas[0].count : 0,
    });
  } catch (error) {
    console.error('Error verificando BD:', error);
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
