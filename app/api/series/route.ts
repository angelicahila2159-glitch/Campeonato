import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// GET - Obtener todas las series
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

    const [results] = await connection.query('CALL sp_ObtenerSeries()');

    // El resultado de CALL es un array con dos elementos: [datos, metadata]
    const series = Array.isArray(results) && results.length > 0 ? results[0] : [];

    return NextResponse.json({
      success: true,
      data: series,
    });
  } catch (error) {
    console.error('Error obteniendo series:', error);
    return NextResponse.json(
      { error: 'Error al obtener series' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST - Crear nueva serie
export async function POST(request: NextRequest) {
  let connection;
  try {
    const { nombre } = await request.json();

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la serie es requerido' },
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
      'CALL sp_InsertarSerie(?, @p_id, @p_mensaje)',
      [nombre.trim()]
    );

    // Obtener los valores de salida
    const [outputParams] = await connection.query(
      'SELECT @p_id as id, @p_mensaje as mensaje'
    );

    const output = Array.isArray(outputParams) ? outputParams[0] : outputParams;

    if (output.id === 0) {
      return NextResponse.json(
        { error: output.mensaje || 'Error al crear la serie' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: output.mensaje,
      id: output.id,
    });
  } catch (error) {
    console.error('Error creando serie:', error);
    
    // Verificar si es error de duplicado
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { error: 'Esta serie ya existe' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear serie' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
