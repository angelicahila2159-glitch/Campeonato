import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// GET - Obtener todas las disciplinas usando SP
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

    const [results] = await connection.query('CALL sp_ObtenerDisciplinas()');

    // El resultado de CALL es un array con dos elementos: [datos, metadata]
    // Extraemos solo el primer elemento que contiene las disciplinas
    const disciplinas = Array.isArray(results) && results.length > 0 ? results[0] : [];

    return NextResponse.json({
      success: true,
      data: disciplinas,
    });
  } catch (error) {
    console.error('Error obteniendo disciplinas:', error);
    return NextResponse.json(
      { error: 'Error al obtener disciplinas' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST - Crear nueva disciplina usando SP
export async function POST(request: NextRequest) {
  let connection;
  try {
    const { nombre } = await request.json();

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la disciplina es requerido' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Llamar al SP con parámetros de salida
    const [results] = await connection.query(
      'CALL sp_InsertarDisciplina(?, @p_id, @p_mensaje)',
      [nombre.trim()]
    );

    // Obtener los valores de salida
    const [outputParams] = await connection.query(
      'SELECT @p_id as id, @p_mensaje as mensaje'
    );

    const output = Array.isArray(outputParams) ? outputParams[0] : outputParams;

    if (output.id === 0) {
      return NextResponse.json(
        { error: output.mensaje || 'Error al crear la disciplina' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: output.mensaje,
      id: output.id,
    });
  } catch (error) {
    console.error('Error creando disciplina:', error);
    
    // Verificar si es error de duplicado
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { error: 'Esta disciplina ya existe' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear disciplina' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
