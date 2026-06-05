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

    // Eliminar tabla de partidos
    await connection.query('DROP TABLE IF EXISTS TblPartido');
    await connection.query('DROP PROCEDURE IF EXISTS sp_InsertarPartidos');
    await connection.query('DROP PROCEDURE IF EXISTS sp_ObtenerPartidos');

    // Crear tabla de partidos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS TblPartido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha_id INT NOT NULL,
        disciplina_id INT NOT NULL,
        serie_id INT NOT NULL,
        equipo1_id INT NOT NULL,
        equipo2_id INT NOT NULL,
        goles_equipo1 INT DEFAULT 0,
        goles_equipo2 INT DEFAULT 0,
        estado ENUM('Programado', 'En juego', 'Finalizado') DEFAULT 'Programado',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (fecha_id) REFERENCES TblFecha(id) ON DELETE CASCADE,
        FOREIGN KEY (disciplina_id) REFERENCES TblDisciplina(id) ON DELETE CASCADE,
        FOREIGN KEY (serie_id) REFERENCES TblSeries(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo1_id) REFERENCES TblEquipo(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo2_id) REFERENCES TblEquipo(id) ON DELETE CASCADE,
        INDEX idx_fecha (fecha_id),
        INDEX idx_disciplina (disciplina_id),
        INDEX idx_serie (serie_id),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear SP para insertar partidos (bulk insert)
    await connection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_InsertarPartidos(
        IN p_fecha_id INT,
        IN p_disciplina_id INT,
        IN p_partidos JSON,
        OUT p_mensaje VARCHAR(255)
      )
      BEGIN
        DECLARE v_index INT DEFAULT 0;
        DECLARE v_count INT;
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_mensaje = CONCAT('Error al insertar los partidos: ', IFNULL(@error_msg, 'Error desconocido'));
        END;

        SET v_count = JSON_LENGTH(p_partidos);
        
        WHILE v_index < v_count DO
          INSERT INTO TblPartido (
            fecha_id, 
            disciplina_id, 
            serie_id, 
            equipo1_id, 
            equipo2_id, 
            estado
          ) VALUES (
            p_fecha_id,
            p_disciplina_id,
            JSON_EXTRACT(p_partidos, CONCAT('$[', v_index, '].serie_id')),
            JSON_EXTRACT(p_partidos, CONCAT('$[', v_index, '].equipo1_id')),
            JSON_EXTRACT(p_partidos, CONCAT('$[', v_index, '].equipo2_id')),
            'Programado'
          );
          
          SET v_index = v_index + 1;
        END WHILE;
        
        SET p_mensaje = CONCAT('Se insertaron ', v_count, ' partidos correctamente');
      END
    `);

    // Crear SP para obtener partidos
    await connection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_ObtenerPartidos(IN p_fecha_id INT DEFAULT NULL)
      BEGIN
        SELECT 
          p.id,
          p.fecha_id,
          f.nombre as fecha_nombre,
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
          p.estado,
          p.fecha_creacion
        FROM TblPartido p
        JOIN TblFecha f ON p.fecha_id = f.id
        JOIN TblDisciplina d ON p.disciplina_id = d.id
        JOIN TblSeries s ON p.serie_id = s.id
        JOIN TblEquipo e1 ON p.equipo1_id = e1.id
        JOIN TblEquipo e2 ON p.equipo2_id = e2.id
        WHERE (p_fecha_id IS NULL OR p.fecha_id = p_fecha_id)
        ORDER BY f.fecha ASC, s.nombre ASC, p.id ASC;
      END
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla de partidos reiniciada correctamente',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al reiniciar' },
      { status: 500 }
    );
  }
}
