import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

interface Sitio {
  id: number;
  nombre: string;
  disciplina_id: number;
  disciplina_nombre: string;
  ciudad: string;
  capacidad: number;
  direccion: string;
  horario_inicio: string;
  horario_fin: string;
  activa: boolean;
}

// GET: Obtener todos los sitios o filtrados por disciplina
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get('disciplinaId');

    connection = await mysql.createConnection(dbConfig);

    let query = `
      SELECT 
        s.id, 
        s.nombre, 
        s.disciplina_id,
        d.nombre as disciplina_nombre,
        s.ciudad, 
        s.capacidad, 
        s.direccion,
        TIME_FORMAT(s.horario_inicio, '%H:%i') as horario_inicio,
        TIME_FORMAT(s.horario_fin, '%H:%i') as horario_fin,
        s.activa
      FROM TblSitio s
      JOIN TblDisciplina d ON s.disciplina_id = d.id
      WHERE s.activa = TRUE
    `;

    const params: any[] = [];

    if (disciplinaId) {
      query += ' AND s.disciplina_id = ?';
      params.push(disciplinaId);
    }

    query += ' ORDER BY d.nombre, s.nombre ASC';

    const [results] = await connection.query(query, params);

    await connection.end();

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error obteniendo sitios:', error);
    return NextResponse.json(
      { error: 'Error al obtener sitios' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo sitio
export async function POST(request: NextRequest) {
  let connection;
  try {
    const { nombre, disciplina_id, ciudad, capacidad, direccion, horario_inicio, horario_fin } = await request.json();

    if (!nombre || !disciplina_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre y disciplina son requeridos',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    await connection.query(
      'INSERT INTO TblSitio (nombre, disciplina_id, ciudad, capacidad, direccion, horario_inicio, horario_fin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, disciplina_id, ciudad || null, capacidad || 0, direccion || null, horario_inicio || '08:00:00', horario_fin || '22:00:00']
    );

    const [lastInsert] = await connection.query('SELECT LAST_INSERT_ID() as id');
    const id = Array.isArray(lastInsert) ? lastInsert[0].id : 0;

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        id,
        nombre,
        disciplina_id,
        ciudad,
        capacidad,
        direccion,
        horario_inicio: horario_inicio || '08:00:00',
        horario_fin: horario_fin || '22:00:00',
      },
    });
  } catch (error) {
    console.error('Error creando sitio:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar sitio
export async function PUT(request: NextRequest) {
  let connection;
  try {
    const { id, nombre, disciplina_id, ciudad, capacidad, direccion, horario_inicio, horario_fin } = await request.json();

    if (!id || !nombre || !disciplina_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID, nombre y disciplina son requeridos',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    await connection.query(
      'UPDATE TblSitio SET nombre = ?, disciplina_id = ?, ciudad = ?, capacidad = ?, direccion = ?, horario_inicio = ?, horario_fin = ? WHERE id = ?',
      [nombre, disciplina_id, ciudad || null, capacidad || 0, direccion || null, horario_inicio || '08:00:00', horario_fin || '22:00:00', id]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        id,
        nombre,
        disciplina_id,
        ciudad,
        capacidad,
        direccion,
        horario_inicio: horario_inicio || '08:00:00',
        horario_fin: horario_fin || '22:00:00',
      },
    });
  } catch (error) {
    console.error('Error actualizando sitio:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar sitio (soft delete)
export async function DELETE(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de sitio es requerido',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    await connection.query('UPDATE TblSitio SET activa = FALSE WHERE id = ?', [id]);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Sitio eliminado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando sitio:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
