import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
  let connection;
  try {
    console.log('Iniciando migración de corrección de tablas...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // 1. Agregar tipo_competicion a TblDisciplina si no existe
    console.log('Verificando TblDisciplina...');
    try {
      await connection.query(`
        ALTER TABLE TblDisciplina 
        ADD COLUMN tipo_competicion ENUM('vs', 'puntos') DEFAULT 'vs' AFTER nombre
      `);
      console.log('✓ Agregado campo tipo_competicion a TblDisciplina');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Campo tipo_competicion ya existe en TblDisciplina');
      } else {
        throw error;
      }
    }

    // 2. Agregar puntos_individuales a TblPartido si no existe
    console.log('Verificando TblPartido...');
    try {
      await connection.query(`
        ALTER TABLE TblPartido 
        ADD COLUMN puntos_individuales INT DEFAULT 0 AFTER goles_equipo2
      `);
      console.log('✓ Agregado campo puntos_individuales a TblPartido');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Campo puntos_individuales ya existe en TblPartido');
      } else {
        throw error;
      }
    }

    // 3. Agregar sitio_id a TblPartido si no existe
    try {
      await connection.query(`
        ALTER TABLE TblPartido 
        ADD COLUMN sitio_id INT DEFAULT NULL AFTER puntos_individuales
      `);
      console.log('✓ Agregado campo sitio_id a TblPartido');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Campo sitio_id ya existe en TblPartido');
      } else {
        throw error;
      }
    }

    // 4. Agregar horario_inicio a TblPartido si no existe
    try {
      await connection.query(`
        ALTER TABLE TblPartido 
        ADD COLUMN horario_inicio TIME DEFAULT NULL AFTER sitio_id
      `);
      console.log('✓ Agregado campo horario_inicio a TblPartido');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Campo horario_inicio ya existe en TblPartido');
      } else {
        throw error;
      }
    }

    // 5. Crear tabla TblSitio si no existe
    console.log('Verificando TblSitio...');
    try {
      await connection.query(`
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
      console.log('✓ Tabla TblSitio creada o ya existe');
    } catch (error: any) {
      throw error;
    }

    // 6. Verificar si hay datos de prueba y agregarlos si es necesario
    const [disciplinasCheck] = await connection.query('SELECT COUNT(*) as count FROM TblDisciplina');
    const disciplinasCount = Array.isArray(disciplinasCheck) ? disciplinasCheck[0].count : 0;

    if (disciplinasCount === 0) {
      console.log('Insertando datos de prueba...');

      // Disciplinas con tipo_competicion
      await connection.query(`
        INSERT INTO TblDisciplina (nombre, tipo_competicion) VALUES 
        ('Futbol', 'vs'),
        ('Basquetbol', 'vs'),
        ('Voleibol', 'vs'),
        ('Atletismo', 'vs'),
        ('Tiro al Sapo', 'puntos'),
        ('Billar Bola 9', 'puntos'),
        ('Cubilete', 'puntos'),
        ('Natación', 'puntos')
      `);
      console.log('✓ Disciplinas de prueba insertadas');

      // Series
      await connection.query(`
        INSERT INTO TblSeries (nombre) VALUES 
        ('SERIE A'), ('SERIE B'), ('SERIE C'), ('SERIE D'), ('SERIE E'),
        ('SERIE F'), ('SERIE G'), ('SERIE H'), ('SERIE I'), ('SERIE J')
      `);
      console.log('✓ Series de prueba insertadas');

      // Equipos
      await connection.query(`
        INSERT INTO TblEquipo (nombre) VALUES 
        ('Deportivo Unidos'), 
        ('FC Clásico'), 
        ('Liga Azul'), 
        ('Voley Elite'),
        ('Team Rojo'),
        ('Equipo Verde')
      `);
      console.log('✓ Equipos de prueba insertados');

      // Asignar equipos a disciplinas con series
      await connection.query(`
        INSERT INTO TblEquipoDisciplina (equipo_id, disciplina_id, serie_id) VALUES 
        (1, 1, 1), (1, 2, 1), (1, 5, 1),
        (2, 1, 2), (2, 3, 2), (2, 6, 1),
        (3, 2, 3), (3, 4, 1), (3, 7, 2),
        (4, 3, 4), (4, 5, 3), (4, 8, 1),
        (5, 1, 3), (5, 2, 4),
        (6, 3, 1), (6, 4, 2)
      `);
      console.log('✓ Equipos asignados a disciplinas');

      // Insertar fechas de prueba
      await connection.query(`
        INSERT INTO TblFecha (nombre, fecha, tipo) VALUES 
        ('Fecha 1', '2024-06-01', 'Apertura'),
        ('Fecha 2', '2024-06-08', 'Apertura'),
        ('Fecha 3', '2024-06-15', 'Apertura'),
        ('Fecha 4', '2024-07-01', 'Clausura'),
        ('Fecha 5', '2024-07-08', 'Clausura')
      `);
      console.log('✓ Fechas de prueba insertadas');

      // Insertar sitios de prueba
      await connection.query(`
        INSERT INTO TblSitio (nombre, disciplina_id, ciudad, capacidad, direccion, horario_inicio, horario_fin) VALUES 
        ('Estadio Central', 1, 'Ciudad A', 5000, 'Calle Principal 123', '08:00', '20:00'),
        ('Cancha Azul', 2, 'Ciudad A', 3000, 'Avenida Secundaria 456', '09:00', '21:00'),
        ('Gimnasio Mayor', 3, 'Ciudad B', 2000, 'Calle Deportiva 789', '07:00', '22:00'),
        ('Pista de Atletismo', 4, 'Ciudad C', 1000, 'Zona de Entrenamiento', '06:00', '18:00'),
        ('Salon El Sapo', 5, 'Ciudad A', 500, 'Barrio Antiguo 321', '10:00', '23:00'),
        ('Club de Billar', 6, 'Ciudad B', 300, 'Centro Comercial 654', '11:00', '23:00'),
        ('Bar Juegos', 7, 'Ciudad C', 200, 'Zona Recreativa 987', '12:00', '02:00'),
        ('Piscina Pública', 8, 'Ciudad A', 2000, 'Parque Acuático 111', '07:00', '19:00')
      `);
      console.log('✓ Sitios de prueba insertados');
    } else {
      // Si ya hay disciplinas, actualizar tipo_competicion a las existentes si es necesario
      console.log('Base de datos ya tiene datos, verificando tipos de disciplinas...');
      const [disciplinas] = await connection.query('SELECT id, nombre FROM TblDisciplina WHERE tipo_competicion IS NULL OR tipo_competicion = ""');
      
      if (Array.isArray(disciplinas) && disciplinas.length > 0) {
        console.log(`Actualizando ${disciplinas.length} disciplinas sin tipo_competicion...`);
        // Asignar tipos basados en nombres conocidos
        for (const disc of disciplinas) {
          let tipo = 'vs';
          if (['Tiro al Sapo', 'Billar Bola 9', 'Cubilete', 'Natación'].includes(disc.nombre)) {
            tipo = 'puntos';
          }
          await connection.query(
            'UPDATE TblDisciplina SET tipo_competicion = ? WHERE id = ?',
            [tipo, disc.id]
          );
        }
        console.log('✓ Tipos de disciplinas actualizados');
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Migración completada exitosamente. Todos los campos han sido agregados o ya existían.',
    });
  } catch (error) {
    console.error('Error en migración:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
