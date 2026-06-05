import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Eliminar tabla de fechas si existe
    await connection.query('DROP TABLE IF EXISTS TblFecha');

    // Recrear tabla de fechas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS TblFecha (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        fecha DATE NOT NULL UNIQUE,
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre),
        INDEX idx_fecha (fecha)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Recrear stored procedures
    await connection.query(`
      DROP PROCEDURE IF EXISTS sp_InsertarFecha
    `);

    await connection.query(`
      CREATE PROCEDURE sp_InsertarFecha(
        IN p_nombre VARCHAR(100),
        IN p_fecha DATE,
        OUT p_id INT,
        OUT p_mensaje VARCHAR(255)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_mensaje = 'Error al insertar la fecha';
          SET p_id = 0;
        END;

        IF p_nombre IS NULL OR p_nombre = '' THEN
          SET p_mensaje = 'El nombre de la fecha es requerido';
          SET p_id = 0;
        ELSEIF p_fecha IS NULL THEN
          SET p_mensaje = 'La fecha es requerida';
          SET p_id = 0;
        ELSE
          INSERT INTO TblFecha (nombre, fecha) 
          VALUES (p_nombre, p_fecha);
          SET p_id = LAST_INSERT_ID();
          SET p_mensaje = 'Fecha creada correctamente';
        END IF;
      END
    `);

    await connection.query(`
      DROP PROCEDURE IF EXISTS sp_ObtenerFechas
    `);

    await connection.query(`
      CREATE PROCEDURE sp_ObtenerFechas()
      BEGIN
        SELECT id, nombre, fecha, activa, fecha_creacion
        FROM TblFecha
        WHERE activa = TRUE
        ORDER BY fecha ASC;
      END
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla de fechas reiniciada correctamente',
    });
  } catch (error) {
    console.error('Error reseteando fechas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
