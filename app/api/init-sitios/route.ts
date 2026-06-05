import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Crear tabla TblSitio
    await connection.query(`
      CREATE TABLE IF NOT EXISTS TblSitio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        disciplina_id INT NOT NULL,
        ciudad VARCHAR(100),
        capacidad INT,
        direccion VARCHAR(255),
        horario_inicio TIME DEFAULT '08:00:00',
        horario_fin TIME DEFAULT '22:00:00',
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (disciplina_id) REFERENCES TblDisciplina(id) ON DELETE CASCADE,
        UNIQUE KEY unique_sitio_disciplina (nombre, disciplina_id)
      )
    `);

    // Crear procedimiento almacenado para obtener sitios
    try {
      await connection.query('DROP PROCEDURE IF EXISTS sp_ObtenerSitios');
    } catch (e) {
      // Ignorar si no existe
    }

    // Necesitamos usar delimitador diferente para procedures
    await connection.query(`
      CREATE PROCEDURE sp_ObtenerSitios()
      READS SQL DATA
      BEGIN
        SELECT 
          s.id, 
          s.nombre, 
          s.disciplina_id,
          d.nombre as disciplina_nombre,
          s.ciudad, 
          s.capacidad, 
          s.direccion, 
          s.activa,
          s.fecha_creacion
        FROM TblSitio s
        JOIN TblDisciplina d ON s.disciplina_id = d.id
        WHERE s.activa = TRUE
        ORDER BY d.nombre, s.nombre ASC;
      END
    `);

    // Insertar sitios de prueba
    const [disciplinas] = await connection.query('SELECT id, nombre FROM TblDisciplina LIMIT 8');
    const disciplinasList = Array.isArray(disciplinas) ? disciplinas : [];

    if (disciplinasList.length > 0) {
      const sitios = [
        // Atletismo
        { nombre: 'Estadio Olímpico', ciudad: 'Buenos Aires', capacidad: 50000, disciplina_index: 0 },
        { nombre: 'Cancha de Atletismo', ciudad: 'La Plata', capacidad: 5000, disciplina_index: 0 },
        // Basquetbol
        { nombre: 'Arena Monumental', ciudad: 'Buenos Aires', capacidad: 15000, disciplina_index: 1 },
        { nombre: 'Polideportivo Provincial', ciudad: 'La Plata', capacidad: 3000, disciplina_index: 1 },
        // Billar Bola 9
        { nombre: 'Salón de Billar Centro', ciudad: 'Buenos Aires', capacidad: 100, disciplina_index: 2 },
        // Fulbito
        { nombre: 'Cancha A', ciudad: 'Buenos Aires', capacidad: 200, disciplina_index: 4 },
        { nombre: 'Cancha B', ciudad: 'La Plata', capacidad: 150, disciplina_index: 4 },
        // Natación
        { nombre: 'Complejo de Natación', ciudad: 'Buenos Aires', capacidad: 2000, disciplina_index: 6 },
        { nombre: 'Piscina Olímpica', ciudad: 'La Plata', capacidad: 1500, disciplina_index: 6 },
      ];

      for (const sitio of sitios) {
        const disciplinaId = disciplinasList[sitio.disciplina_index]?.id;
        if (disciplinaId) {
          await connection.query(
            'INSERT INTO TblSitio (nombre, disciplina_id, ciudad, capacidad, direccion) VALUES (?, ?, ?, ?, ?)',
            [sitio.nombre, disciplinaId, sitio.ciudad, sitio.capacidad, `${sitio.ciudad} - ${sitio.nombre}`]
          );
        }
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Tabla TblSitio creada correctamente con sitios de prueba',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
