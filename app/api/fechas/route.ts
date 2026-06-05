import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

interface Fecha {
  id: number;
  nombre: string;
  tipo: string;
  fecha: string;
  activa: boolean;
}

// GET: Obtener todas las fechas
export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.query('CALL sp_ObtenerFechas()');

    await connection.end();

    // MySQL retorna los resultados del SP en un array anidado
    let fechas: Fecha[] = [];
    
    if (Array.isArray(rows)) {
      // Si es un array, tomar el primer elemento si es array, si no usarlo directo
      if (Array.isArray(rows[0])) {
        fechas = rows[0] as Fecha[];
      } else {
        fechas = rows as Fecha[];
      }
    }

    console.log('Fechas fetched:', fechas);

    return NextResponse.json({
      success: true,
      data: fechas,
    });
  } catch (error) {
    console.error('Error obteniendo fechas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// POST: Crear nueva fecha
export async function POST(request: NextRequest) {
  try {
    const { nombre, fecha, tipo } = await request.json();

    if (!nombre || !fecha) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan parámetros requeridos',
        },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    const tipoFecha = tipo || 'Apertura';

    await connection.query(
      'INSERT INTO TblFecha (nombre, fecha, tipo) VALUES (?, ?, ?)',
      [nombre, fecha, tipoFecha]
    );

    const [lastInsert] = await connection.query(
      'SELECT LAST_INSERT_ID() as id'
    );

    await connection.end();

    const id = Array.isArray(lastInsert) ? lastInsert[0].id : 0;

    return NextResponse.json({
      success: true,
      data: {
        id,
        nombre,
        fecha,
        tipo: tipoFecha,
      },
    });
  } catch (error) {
    console.error('Error creando fecha:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar fecha
export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, fecha, tipo } = await request.json();

    if (!id || !nombre || !fecha) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan parámetros requeridos',
        },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    const tipoFecha = tipo || 'Apertura';

    await connection.query(
      'UPDATE TblFecha SET nombre = ?, fecha = ?, tipo = ? WHERE id = ?',
      [nombre, fecha, tipoFecha, id]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        id,
        nombre,
        fecha,
        tipo: tipoFecha,
      },
    });
  } catch (error) {
    console.error('Error actualizando fecha:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar fecha
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de fecha es requerido',
        },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // Soft delete (marcar como inactiva)
    await connection.query('UPDATE TblFecha SET activa = FALSE WHERE id = ?', [id]);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Fecha eliminada correctamente',
    });
  } catch (error) {
    console.error('Error eliminando fecha:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
