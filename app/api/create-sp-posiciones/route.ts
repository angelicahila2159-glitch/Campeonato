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

    // Crear el Stored Procedure para obtener posiciones
    await connection.query(`
      DROP PROCEDURE IF EXISTS sp_ObtenerPosiciones
    `);

    await connection.query(`
      CREATE PROCEDURE sp_ObtenerPosiciones(IN p_disciplina_id INT)
      BEGIN
        SELECT 
          ed.equipo_id,
          e.nombre as equipo_nombre,
          ed.serie_id,
          s.nombre as serie_nombre,
          ed.disciplina_id,
          d.nombre as disciplina_nombre,
          d.tipo_competicion,
          COUNT(DISTINCT CASE WHEN p.estado = 'Finalizado' THEN p.id END) as partidos_jugados,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND d.tipo_competicion = 'vs' AND (
              (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 > p.goles_equipo2) OR
              (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 > p.goles_equipo1)
            ) THEN 1 
            ELSE 0 
          END), 0) as victorias,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND d.tipo_competicion = 'vs' AND (
              (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 = p.goles_equipo2) OR
              (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 = p.goles_equipo1)
            ) THEN 1 
            ELSE 0 
          END), 0) as empates,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND d.tipo_competicion = 'vs' AND (
              (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 < p.goles_equipo2) OR
              (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 < p.goles_equipo1)
            ) THEN 1 
            ELSE 0 
          END), 0) as derrotas,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND p.equipo1_id = ed.equipo_id THEN p.goles_equipo1
            WHEN p.estado = 'Finalizado' AND p.equipo2_id = ed.equipo_id THEN p.goles_equipo2
            ELSE 0 
          END), 0) as goles_favor,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND p.equipo1_id = ed.equipo_id THEN p.goles_equipo2
            WHEN p.estado = 'Finalizado' AND p.equipo2_id = ed.equipo_id THEN p.goles_equipo1
            ELSE 0 
          END), 0) as goles_contra,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND f.tipo = 'Apertura' AND d.tipo_competicion = 'vs' THEN
              CASE 
                WHEN (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 > p.goles_equipo2) THEN 3
                WHEN (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 > p.goles_equipo1) THEN 3
                WHEN (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 = p.goles_equipo2) THEN 1
                WHEN (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 = p.goles_equipo1) THEN 1
                ELSE 0
              END
            WHEN p.estado = 'Finalizado' AND f.tipo = 'Apertura' AND d.tipo_competicion = 'puntos' AND p.equipo1_id = ed.equipo_id THEN COALESCE(p.puntos_individuales, 0)
            ELSE 0
          END), 0) as puntos_apertura,
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND f.tipo = 'Clausura' AND d.tipo_competicion = 'vs' THEN
              CASE 
                WHEN (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 > p.goles_equipo2) THEN 3
                WHEN (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 > p.goles_equipo1) THEN 3
                WHEN (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 = p.goles_equipo2) THEN 1
                WHEN (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 = p.goles_equipo1) THEN 1
                ELSE 0
              END
            WHEN p.estado = 'Finalizado' AND f.tipo = 'Clausura' AND d.tipo_competicion = 'puntos' AND p.equipo1_id = ed.equipo_id THEN COALESCE(p.puntos_individuales, 0)
            ELSE 0
          END), 0) as puntos_clausura
        FROM TblEquipoDisciplina ed
        JOIN TblEquipo e ON ed.equipo_id = e.id
        JOIN TblSeries s ON ed.serie_id = s.id
        JOIN TblDisciplina d ON ed.disciplina_id = d.id
        LEFT JOIN TblPartido p ON (
          (p.equipo1_id = ed.equipo_id OR p.equipo2_id = ed.equipo_id) AND
          p.disciplina_id = ed.disciplina_id AND
          p.serie_id = ed.serie_id
        )
        LEFT JOIN TblFecha f ON p.fecha_id = f.id
        WHERE e.activa = TRUE AND (p_disciplina_id IS NULL OR ed.disciplina_id = p_disciplina_id)
        GROUP BY ed.equipo_id, ed.serie_id, ed.disciplina_id
        ORDER BY ed.disciplina_id, ed.serie_id, 
          COALESCE(SUM(CASE 
            WHEN p.estado = 'Finalizado' AND d.tipo_competicion = 'vs' THEN
              CASE 
                WHEN (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 > p.goles_equipo2) THEN 3
                WHEN (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 > p.goles_equipo1) THEN 3
                WHEN (p.equipo1_id = ed.equipo_id AND p.goles_equipo1 = p.goles_equipo2) THEN 1
                WHEN (p.equipo2_id = ed.equipo_id AND p.goles_equipo2 = p.goles_equipo1) THEN 1
                ELSE 0
              END
            WHEN p.estado = 'Finalizado' AND d.tipo_competicion = 'puntos' AND p.equipo1_id = ed.equipo_id THEN COALESCE(p.puntos_individuales, 0)
            ELSE 0
          END), 0) DESC;
      END
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Stored Procedure sp_ObtenerPosiciones creado exitosamente',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear SP' },
      { status: 500 }
    );
  }
}
