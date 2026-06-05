import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// GET - Obtener todos los equipos con sus disciplinas
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get('disciplinaId');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Si se especifica disciplinaId, retornar solo equipos-disciplina de esa disciplina
    if (disciplinaId) {
      const [results] = await connection.query(
        `SELECT 
          ed.equipo_id,
          e.nombre as equipo_nombre,
          ed.disciplina_id,
          d.nombre as disciplina_nombre,
          ed.serie_id,
          s.nombre as serie_nombre,
          e.activa
        FROM TblEquipoDisciplina ed
        JOIN TblEquipo e ON ed.equipo_id = e.id
        JOIN TblDisciplina d ON ed.disciplina_id = d.id
        JOIN TblSeries s ON ed.serie_id = s.id
        WHERE ed.disciplina_id = ? AND e.activa = TRUE
        ORDER BY ed.serie_id, e.nombre`,
        [disciplinaId]
      );
      
      return NextResponse.json({ success: true, data: results });
    }

    // Si no hay filtro, retornar todos los equipos con sus disciplinas
    const [results] = await connection.query('CALL sp_ObtenerEquipos()');
    const equipos = Array.isArray(results) && results.length > 0 ? results[0] : [];

    const equiposProcesados = equipos.map((e: any) => {
      try {
        const participaciones = e.participaciones 
          ? (typeof e.participaciones === 'string' 
              ? JSON.parse(e.participaciones) 
              : e.participaciones)
          : [];
        
        const filtradas = Array.isArray(participaciones) 
          ? participaciones.filter((p: any) => p && p.disciplina_id)
          : [];
          
        return { ...e, participaciones: filtradas };
      } catch (err) {
        return { ...e, participaciones: [] };
      }
    });

    return NextResponse.json({ success: true, data: equiposProcesados });
  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    return NextResponse.json({ error: 'Error al obtener equipos' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST - Crear nuevo equipo con disciplinas
export async function POST(request: NextRequest) {
  let connection;
  try {
    const { nombre, disciplinas } = await request.json();

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({ error: 'El nombre del equipo es requerido' }, { status: 400 });
    }

    if (!Array.isArray(disciplinas) || disciplinas.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos una disciplina' }, { status: 400 });
    }

    for (const disc of disciplinas) {
      if (!disc.disciplina_id || !disc.serie_id) {
        return NextResponse.json({ error: 'Cada disciplina debe tener una serie asignada' }, { status: 400 });
      }
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [insertResults] = await connection.query(
      'CALL sp_InsertarEquipo(?, @p_id, @p_mensaje)',
      [nombre.trim()]
    );

    const [outputParams] = await connection.query('SELECT @p_id as id, @p_mensaje as mensaje');
    const output = Array.isArray(outputParams) ? outputParams[0] : outputParams;

    if (output.id === 0) {
      return NextResponse.json({ error: output.mensaje || 'Error al crear el equipo' }, { status: 400 });
    }

    const equipoId = output.id;

    for (const disc of disciplinas) {
      try {
        await connection.query(
          'CALL sp_InsertarEquipoDisciplina(?, ?, ?, @p_id, @p_mensaje)',
          [equipoId, disc.disciplina_id, disc.serie_id]
        );
      } catch (error) {
        console.error('Error asignando disciplina:', error);
      }
    }

    return NextResponse.json({ success: true, message: 'Equipo creado correctamente', id: equipoId });
  } catch (error) {
    console.error('Error creando equipo:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Este equipo ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PUT - Actualizar disciplinas del equipo
export async function PUT(request: NextRequest) {
  let connection;
  try {
    const { equipoId, disciplinas } = await request.json();

    if (!equipoId) {
      return NextResponse.json({ error: 'ID del equipo es requerido' }, { status: 400 });
    }

    if (!Array.isArray(disciplinas) || disciplinas.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos una disciplina' }, { status: 400 });
    }

    for (const disc of disciplinas) {
      if (!disc.disciplina_id || !disc.serie_id) {
        return NextResponse.json({ error: 'Cada disciplina debe tener una serie asignada' }, { status: 400 });
      }
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await connection.query('DELETE FROM TblEquipoDisciplina WHERE equipo_id = ?', [equipoId]);

    for (const disc of disciplinas) {
      try {
        await connection.query(
          'CALL sp_InsertarEquipoDisciplina(?, ?, ?, @p_id, @p_mensaje)',
          [equipoId, disc.disciplina_id, disc.serie_id]
        );
      } catch (error) {
        console.error('Error asignando disciplina:', error);
      }
    }

    return NextResponse.json({ success: true, message: 'Disciplinas actualizadas correctamente' });
  } catch (error) {
    console.error('Error actualizando equipo:', error);
    return NextResponse.json({ error: 'Error al actualizar equipo' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE - Eliminar equipo
export async function DELETE(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const equipoId = searchParams.get('id');

    if (!equipoId) {
      return NextResponse.json({ error: 'ID del equipo es requerido' }, { status: 400 });
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await connection.query('DELETE FROM TblEquipoDisciplina WHERE equipo_id = ?', [parseInt(equipoId)]);
    await connection.query('DELETE FROM TblEquipo WHERE id = ?', [parseInt(equipoId)]);

    return NextResponse.json({ success: true, message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando equipo:', error);
    return NextResponse.json({ error: 'Error al eliminar equipo' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
