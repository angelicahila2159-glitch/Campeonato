import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
    console.log('DB_NAME:', process.env.DB_NAME);

    // Conectar sin especificar base de datos para crearla
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Crear base de datos
    await connection.query('CREATE DATABASE IF NOT EXISTS campeonato_bd');

    // Conectar a la base de datos específica
    await connection.end();
    
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Crear tabla de usuarios
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        contraseña VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        nombre_completo VARCHAR(100),
        rol VARCHAR(50) DEFAULT 'usuario',
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_usuario (usuario),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de sesiones
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS sesiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_expiracion DATETIME,
        activa BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de disciplinas
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS TblDisciplina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        tipo_competicion ENUM('vs', 'puntos') DEFAULT 'vs',
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear Stored Procedure para insertar disciplina
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_InsertarDisciplina(
        IN p_nombre VARCHAR(100),
        OUT p_id INT,
        OUT p_mensaje VARCHAR(255)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_mensaje = 'Error al insertar la disciplina';
          SET p_id = 0;
        END;

        IF p_nombre IS NULL OR p_nombre = '' THEN
          SET p_mensaje = 'El nombre de la disciplina es requerido';
          SET p_id = 0;
        ELSE
          INSERT INTO TblDisciplina (nombre) VALUES (p_nombre);
          SET p_id = LAST_INSERT_ID();
          SET p_mensaje = 'Disciplina creada correctamente';
        END IF;
      END
    `);

    // Crear Stored Procedure para obtener disciplinas
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_ObtenerDisciplinas()
      BEGIN
        SELECT id, nombre, activa, tipo_competicion, fecha_creacion, fecha_actualizacion
        FROM TblDisciplina
        WHERE activa = TRUE
        ORDER BY nombre ASC;
      END
    `);

    // Crear tabla de series
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS TblSeries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear Stored Procedure para insertar serie
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_InsertarSerie(
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

    // Crear Stored Procedure para obtener series
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_ObtenerSeries()
      BEGIN
        SELECT id, nombre, activa, fecha_creacion, fecha_actualizacion
        FROM TblSeries
        WHERE activa = TRUE
        ORDER BY nombre ASC;
      END
    `);

    // Crear tabla de equipos (sin disciplina_id)
    await dbConnection.query(`
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
    await dbConnection.query(`
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
    await dbConnection.query(`
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
    await dbConnection.query(`
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
    await dbConnection.query(`
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

    // Crear tabla de fechas
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS TblFecha (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        fecha DATE NOT NULL UNIQUE,
        tipo ENUM('Apertura', 'Clausura') DEFAULT 'Apertura',
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre),
        INDEX idx_fecha (fecha),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de sitios
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS TblSitio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        disciplina_id INT NOT NULL,
        ciudad VARCHAR(100),
        capacidad INT,
        direccion VARCHAR(255),
        horario_inicio TIME,
        horario_fin TIME,
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (disciplina_id) REFERENCES TblDisciplina(id) ON DELETE CASCADE,
        UNIQUE KEY unique_nombre_disciplina (nombre, disciplina_id),
        INDEX idx_nombre (nombre),
        INDEX idx_disciplina (disciplina_id),
        INDEX idx_ciudad (ciudad)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de partidos
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS TblPartido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha_id INT NOT NULL,
        disciplina_id INT NOT NULL,
        serie_id INT NOT NULL,
        equipo1_id INT NOT NULL,
        equipo2_id INT NOT NULL,
        goles_equipo1 INT DEFAULT 0,
        goles_equipo2 INT DEFAULT 0,
        puntos_individuales INT DEFAULT 0,
        sitio_id INT,
        horario_inicio TIME,
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

    // Agregar campos a TblPartido si no existen
    try {
      await dbConnection.query(`ALTER TABLE TblPartido ADD COLUMN puntos_individuales INT DEFAULT 0`);
    } catch (error) { /* Campo ya existe */ }
    try {
      await dbConnection.query(`ALTER TABLE TblPartido ADD COLUMN sitio_id INT`);
    } catch (error) { /* Campo ya existe */ }
    try {
      await dbConnection.query(`ALTER TABLE TblPartido ADD COLUMN horario_inicio TIME`);
    } catch (error) { /* Campo ya existe */ };

    // Crear SP para insertar fecha
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_InsertarFecha(
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

    // Crear SP para obtener fechas
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_ObtenerFechas()
      BEGIN
        SELECT id, nombre, fecha, tipo, activa, fecha_creacion
        FROM TblFecha
        WHERE activa = TRUE
        ORDER BY fecha ASC;
      END
    `);

    // Crear Stored Procedure para obtener posiciones
    await dbConnection.query(`
      CREATE PROCEDURE IF NOT EXISTS sp_ObtenerPosiciones(IN p_disciplina_id INT)
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

    // Insertar datos de prueba
    const [disciplinasCheck] = await dbConnection.query(
      'SELECT COUNT(*) as count FROM TblDisciplina'
    );

    const disciplinasCount = Array.isArray(disciplinasCheck) ? disciplinasCheck[0].count : 0;

    if (disciplinasCount === 0) {
      // Insertar disciplinas de prueba
      await dbConnection.query(
        'INSERT INTO TblDisciplina (nombre) VALUES ("Futbol"), ("Basquetbol"), ("Voleibol")'
      );

      // Insertar series de prueba
      await dbConnection.query(
        'INSERT INTO TblSeries (nombre) VALUES ("SERIE A"), ("SERIE B"), ("SERIE C"), ("SERIE D"), ("SERIE E")'
      );

      // Insertar equipos de prueba
      await dbConnection.query(
        'INSERT INTO TblEquipo (nombre) VALUES ("Deportivo Unidos"), ("FC Clásico"), ("Liga Azul"), ("Voley Elite")'
      );

      // Asignar equipos a disciplinas
      await dbConnection.query(
        `INSERT INTO TblEquipoDisciplina (equipo_id, disciplina_id, serie_id) VALUES 
         (1, 1, 1), (1, 2, 1),
         (2, 1, 2),
         (3, 2, 3),
         (4, 3, 4)`
      );
    }

    const [users] = await dbConnection.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      ['admin']
    );

    if (Array.isArray(users) && users.length === 0) {
      // Insertar usuario admin de prueba
      // Contraseña: admin123 (sin hashear por ahora)
      await dbConnection.query(
        'INSERT INTO usuarios (usuario, contraseña, email, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin123', 'admin@campeonato.com', 'Administrador', 'admin']
      );
    }

    await dbConnection.end();

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente',
    });
  } catch (error) {
    console.error('Error inicializando BD:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
