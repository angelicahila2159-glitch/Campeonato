import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { addMinutesToTime } from '@/lib/time-utils';

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
    const { fechaId, disciplinaId, sitioId, serieId } = await request.json();

    if (!fechaId || !disciplinaId || !sitioId || !serieId) {
      return NextResponse.json(
        {
          success: false,
          error: 'fechaId, disciplinaId, sitioId y serieId son requeridos',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener información del sitio
    const [sitioResult] = await connection.query(
      `SELECT id, nombre, TIME_FORMAT(horario_inicio, '%H:%i') as horario_inicio 
       FROM TblSitio WHERE id = ? AND activa = TRUE`,
      [sitioId]
    );

    if (!Array.isArray(sitioResult) || sitioResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sitio no encontrado' },
        { status: 404 }
      );
    }

    const sitio = sitioResult[0];

    // Obtener equipos que jugaron en esta fecha y serie
    const [equiposQueJugaron] = await connection.query(
      `SELECT DISTINCT equipo1_id as equipo_id
      FROM TblPartido
      WHERE fecha_id = ? AND disciplina_id = ? AND serie_id = ?
      UNION
      SELECT DISTINCT equipo2_id as equipo_id
      FROM TblPartido
      WHERE fecha_id = ? AND disciplina_id = ? AND serie_id = ? AND equipo1_id != equipo2_id`,
      [fechaId, disciplinaId, serieId, fechaId, disciplinaId, serieId]
    );

    // Obtener TODOS los equipos en esta serie y disciplina
    const [todosEquipos] = await connection.query(
      `SELECT e.id, e.nombre
      FROM TblEquipo e
      JOIN TblEquipoDisciplina ed ON e.id = ed.equipo_id
      WHERE ed.disciplina_id = ? AND ed.serie_id = ? AND e.activa = TRUE
      ORDER BY RAND()`,
      [disciplinaId, serieId]
    );

    // Encontrar equipos sin pareja
    const equiposQueJugaronIds = new Set();
    if (Array.isArray(equiposQueJugaron)) {
      equiposQueJugaron.forEach((row: any) => {
        equiposQueJugaronIds.add(row.equipo_id);
      });
    }

    const equiposSueltos = Array.isArray(todosEquipos)
      ? todosEquipos.filter((eq: any) => !equiposQueJugaronIds.has(eq.id))
      : [];

    if (equiposSueltos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          equiposSueltos: [],
          partidosGenerados: 0,
          mensaje: 'No hay equipos sueltos en esta serie',
        },
      });
    }

    // Si hay número impar de equipos sueltos, uno quedará sin pareja
    const matchCount = Math.floor(equiposSueltos.length / 2);
    let partidosGenerados = 0;

    // Obtener el último horario ocupado en este sitio
    const [ultimoPartido] = await connection.query(
      `SELECT TIME_FORMAT(horario_inicio, '%H:%i') as horario_inicio
      FROM TblPartido
      WHERE fecha_id = ? AND disciplina_id = ? AND sitio_id = ?
      ORDER BY horario_inicio DESC
      LIMIT 1`,
      [fechaId, disciplinaId, sitioId]
    );

    let nuevoHorario = sitio.horario_inicio;
    if (Array.isArray(ultimoPartido) && ultimoPartido.length > 0) {
      // Sumar 45 minutos al último horario
      nuevoHorario = addMinutesToTime(ultimoPartido[0].horario_inicio, 45);
    }

    // Crear partidos para los equipos sueltos (emparejándolos entre sí)
    for (let i = 0; i < matchCount; i++) {
      const eq1 = equiposSueltos[i * 2];
      const eq2 = equiposSueltos[i * 2 + 1];

      await connection.query(
        `INSERT INTO TblPartido (fecha_id, disciplina_id, serie_id, equipo1_id, equipo2_id, sitio_id, horario_inicio, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Programado')`,
        [fechaId, disciplinaId, serieId, eq1.id, eq2.id, sitioId, `${nuevoHorario}:00`]
      );

      partidosGenerados++;

      // Sumar 45 minutos para el siguiente partido
      nuevoHorario = addMinutesToTime(nuevoHorario, 45);
    }

    return NextResponse.json({
      success: true,
      data: {
        equiposSueltos: equiposSueltos.slice(0, matchCount * 2), // Solo los que jugaron
        equipoSinPareja: equiposSueltos.length % 2 === 1 ? equiposSueltos[equiposSueltos.length - 1] : null,
        partidosGenerados,
        mensaje: `Se generaron ${partidosGenerados} partidos para equipos sueltos. ${equiposSueltos.length % 2 === 1 ? `${equiposSueltos[equiposSueltos.length - 1].nombre} quedó sin pareja.` : ''}`,
      },
    });
  } catch (error) {
    console.error('Error forzando equipos sueltos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
