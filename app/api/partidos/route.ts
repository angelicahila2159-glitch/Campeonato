import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// GET - Obtener todos los partidos o filtrados por fecha
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const fechaId = searchParams.get('fechaId');

    connection = await mysql.createConnection(dbConfig);

    let query = `
      SELECT 
        p.id,
        p.fecha_id,
        f.nombre as fecha_nombre,
        f.fecha,
        p.disciplina_id,
        d.nombre as disciplina_nombre,
        p.serie_id,
        s.nombre as serie_nombre,
        p.equipo1_id,
        e1.nombre as equipo1_nombre,
        p.equipo2_id,
        e2.nombre as equipo2_nombre,
        p.goles_equipo1,
        p.goles_equipo2,
        0 as puntos_individuales,
        p.estado,
        p.sitio_id,
        COALESCE(sit.nombre, 'Sin asignar') as sitio_nombre,
        TIME_FORMAT(p.horario_inicio, '%H:%i') as horario_inicio,
        d.tipo_competicion,
        p.fecha_creacion
      FROM TblPartido p
      JOIN TblFecha f ON p.fecha_id = f.id
      JOIN TblDisciplina d ON p.disciplina_id = d.id
      JOIN TblSeries s ON p.serie_id = s.id
      JOIN TblEquipo e1 ON p.equipo1_id = e1.id
      LEFT JOIN TblEquipo e2 ON p.equipo2_id = e2.id
      LEFT JOIN TblSitio sit ON p.sitio_id = sit.id
    `;

    const params: any[] = [];

    if (fechaId) {
      query += ' WHERE p.fecha_id = ?';
      params.push(fechaId);
    }

    query += ' ORDER BY f.fecha ASC, s.nombre ASC, p.id ASC';

    const [results] = await connection.query(query, params);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error obteniendo partidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener partidos' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// PUT - Actualizar resultado de un partido
export async function PUT(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { goles_equipo1, goles_equipo2, puntos_individuales, estado } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID del partido es requerido' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const updateQuery = `
      UPDATE TblPartido 
      SET goles_equipo1 = ?, goles_equipo2 = ?, puntos_individuales = ?, estado = ?
      WHERE id = ?
    `;

    const result = await connection.query(updateQuery, [
      goles_equipo1 || 0,
      goles_equipo2 || 0,
      puntos_individuales || null,
      estado || 'Programado',
      id,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Partido actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando partido:', error);
    return NextResponse.json(
      { error: 'Error al actualizar partido' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// DELETE - Eliminar un partido
export async function DELETE(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del partido es requerido' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    await connection.query('DELETE FROM TblPartido WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Partido eliminado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando partido:', error);
    return NextResponse.json(
      { error: 'Error al eliminar partido' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
