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

    // Eliminar tablas (en orden inverso de dependencias)
    await connection.query('DROP TABLE IF EXISTS TblEquipoDisciplina');
    await connection.query('DROP TABLE IF EXISTS TblEquipo');
    await connection.query('DROP PROCEDURE IF EXISTS sp_ObtenerEquipos');
    await connection.query('DROP PROCEDURE IF EXISTS sp_InsertarEquipoDisciplina');
    await connection.query('DROP PROCEDURE IF EXISTS sp_InsertarEquipo');

    // Crear tabla de equipos (sin disciplina_id)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS TblEquipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla relacional: Equipo-Disciplina-Serie
    await connection.query(`
      CREATE TABLE IF NOT EXISTS TblEquipoDisciplina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        equipo_id INT NOT NULL,
        disciplina_id INT NOT NULL,
        serie_id INT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipo_id) REFERENCES TblEquipo(id) ON DELETE CASCADE,
        FOREIGN KEY (disciplina_id) REFERENCES TblDisciplina(id) ON DELETE CASCADE,
        FOREIGN KEY (serie_id) REFERENCES TblSeries(id) ON DELETE CASCADE,
        UNIQUE KEY unique_equipo_disciplina_serie (equipo_id, disciplina_id, serie_id),
        INDEX idx_equipo (equipo_id),
        INDEX idx_disciplina (disciplina_id),
        INDEX idx_serie (serie_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear SP para insertar equipo
    await connection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_InsertarEquipo(
        IN p_nombre VARCHAR(100),
        OUT p_id INT,
        OUT p_mensaje VARCHAR(255)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_mensaje = 'Error al insertar el equipo';
          SET p_id = 0;
        END;

        IF p_nombre IS NULL OR p_nombre = '' THEN
          SET p_mensaje = 'El nombre del equipo es requerido';
          SET p_id = 0;
        ELSE
          INSERT INTO TblEquipo (nombre) VALUES (p_nombre);
          SET p_id = LAST_INSERT_ID();
          SET p_mensaje = 'Equipo creado correctamente';
        END IF;
      END
    `);

    // Crear SP para insertar equipo en disciplina-serie
    await connection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_InsertarEquipoDisciplina(
        IN p_equipo_id INT,
        IN p_disciplina_id INT,
        IN p_serie_id INT,
        OUT p_id INT,
        OUT p_mensaje VARCHAR(255)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_mensaje = 'Error al asignar disciplina al equipo';
          SET p_id = 0;
        END;

        IF p_equipo_id IS NULL OR p_disciplina_id IS NULL OR p_serie_id IS NULL THEN
          SET p_mensaje = 'Parámetros incompletos';
          SET p_id = 0;
        ELSE
          INSERT INTO TblEquipoDisciplina (equipo_id, disciplina_id, serie_id) 
          VALUES (p_equipo_id, p_disciplina_id, p_serie_id);
          SET p_id = LAST_INSERT_ID();
          SET p_mensaje = 'Disciplina asignada correctamente';
        END IF;
      END
    `);

    // Crear SP para obtener equipos con sus disciplinas
    await connection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_ObtenerEquipos()
      BEGIN
        SELECT 
          e.id,
          e.nombre,
          JSON_ARRAYAGG(JSON_OBJECT(
            'disciplina_id', ed.disciplina_id,
            'disciplina_nombre', d.nombre,
            'serie_id', ed.serie_id,
            'serie_nombre', s.nombre
          )) as participaciones
        FROM TblEquipo e
        LEFT JOIN TblEquipoDisciplina ed ON e.id = ed.equipo_id
        LEFT JOIN TblDisciplina d ON ed.disciplina_id = d.id
        LEFT JOIN TblSeries s ON ed.serie_id = s.id
        WHERE e.activa = TRUE
        GROUP BY e.id, e.nombre
        ORDER BY e.nombre ASC;
      END
    `);

    // Insertar equipos de prueba
    await connection.query(
      'INSERT INTO TblEquipo (nombre) VALUES ("Deportivo Unidos"), ("FC Clásico"), ("Liga Azul"), ("Voley Elite")'
    );

    // Asignar equipos a múltiples disciplinas
    await connection.query(
      `INSERT INTO TblEquipoDisciplina (equipo_id, disciplina_id, serie_id) VALUES 
       (1, 1, 1), (1, 2, 1),
       (2, 1, 2),
       (3, 2, 3),
       (4, 3, 4)`
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Base de datos de equipos reiniciada correctamente',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al reiniciar' },
      { status: 500 }
    );
  }
}
