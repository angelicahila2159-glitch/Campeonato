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

    // Dropear SPs antiguos
    try {
      await connection.query('DROP PROCEDURE IF EXISTS sp_InsertarSerie');
      await connection.query('DROP PROCEDURE IF EXISTS sp_ObtenerSeries');
      await connection.query('DROP PROCEDURE IF EXISTS sp_ObtenerSeriesPorDisciplina');
    } catch (e) {
      console.log('SPs ya eliminados o no existen');
    }

    // Dropear tabla antigua
    try {
      await connection.query('DROP TABLE IF EXISTS TblSeries');
    } catch (e) {
      console.log('Tabla ya eliminada o no existe');
    }

    // Crear tabla nueva sin disciplina_id
    await connection.query(`
      CREATE TABLE TblSeries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear SP para insertar serie
    await connection.query(`
      CREATE PROCEDURE sp_InsertarSerie(
        IN p_nombre VARCHAR(100),
        OUT p_id INT,
        OUT p_mensaje VARCHAR(255)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_mensaje = 'Error al insertar la serie';
          SET p_id = 0;
        END;

        IF p_nombre IS NULL OR p_nombre = '' THEN
          SET p_mensaje = 'El nombre de la serie es requerido';
          SET p_id = 0;
        ELSE
          INSERT INTO TblSeries (nombre) VALUES (p_nombre);
          SET p_id = LAST_INSERT_ID();
          SET p_mensaje = 'Serie creada correctamente';
        END IF;
      END
    `);

    // Crear SP para obtener todas las series
    await connection.query(`
      CREATE PROCEDURE sp_ObtenerSeries()
      BEGIN
        SELECT id, nombre, activa, fecha_creacion, fecha_actualizacion
        FROM TblSeries
        WHERE activa = TRUE
        ORDER BY nombre ASC;
      END
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla y SPs de Series recreados correctamente',
    });
  } catch (error) {
    console.error('Error reseteando series:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

