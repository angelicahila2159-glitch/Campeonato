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
    const { fechaId } = await request.json();

    if (!fechaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'fechaId es requerido',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener todos los partidos VS de esta fecha agrupados por matchup Y disciplina
    const [partidosResult] = await connection.query(
      `SELECT 
        p.id,
        p.disciplina_id,
        d.nombre as disciplina_nombre,
        LEAST(p.equipo1_id, p.equipo2_id) as equipo_menor,
        GREATEST(p.equipo1_id, p.equipo2_id) as equipo_mayor,
        p.equipo1_id,
        p.equipo2_id,
        e1.nombre as eq1_nombre,
        e2.nombre as eq2_nombre,
        TIME_FORMAT(p.horario_inicio, '%H:%i') as horario_actual,
        p.sitio_id
      FROM TblPartido p
      JOIN TblDisciplina d ON p.disciplina_id = d.id
      JOIN TblEquipo e1 ON p.equipo1_id = e1.id
      JOIN TblEquipo e2 ON p.equipo2_id = e2.id
      WHERE p.fecha_id = ? AND d.tipo_competicion = 'vs' AND p.equipo1_id != p.equipo2_id
      ORDER BY p.disciplina_id, p.horario_inicio`,
      [fechaId]
    );

    if (!Array.isArray(partidosResult) || partidosResult.length === 0) {
      return NextResponse.json({
        success: true,
        data: { mensaje: 'No hay partidos VS en esta fecha' },
      });
    }

    // Agrupar por matchup (eq_menor-eq_mayor) INCLUYENDO disciplina y sitio
    const matchupsByKey = new Map<string, any[]>(); // "eq1-eq2" -> [{disciplina_id, partido_id, horario, ...}]

    partidosResult.forEach((row: any) => {
      const matchupKey = `${row.equipo_menor}-${row.equipo_mayor}`;
      if (!matchupsByKey.has(matchupKey)) {
        matchupsByKey.set(matchupKey, []);
      }
      matchupsByKey.get(matchupKey)!.push(row);
    });

    // Para cada matchup que aparece en FÚTBOL Y BÁSQUETBOL
    let actualizacionesRealizadas = 0;
    const detallesActualizacion = [];

    for (const [matchupKey, partidos] of matchupsByKey.entries()) {
      // Solo procesar si hay exactamente 2 partidos (Fútbol + Básquetbol)
      if (partidos.length === 2) {
        // Verificar que sean Fútbol y Básquetbol
        const disciplinas = partidos.map(p => p.disciplina_nombre);
        const esFootballYBasket = 
          (disciplinas.includes('Futbito') && disciplinas.includes('Basquetbol')) ||
          (disciplinas.includes('Futbito') && disciplinas.includes('Basquetbol'));
        
        if (esFootballYBasket) {
          // Ordenar: primero Fútbol, luego Básquetbol (así Fútbol es la referencia)
          partidos.sort((a, b) => {
            const orderMap: { [key: string]: number } = { 'Futbito': 0, 'Basquetbol': 1 };
            return (orderMap[a.disciplina_nombre] || 99) - (orderMap[b.disciplina_nombre] || 99);
          });

          const futbol = partidos[0]; // Referencia (Fútbol)
          const basquet = partidos[1]; // A escalonar (Básquetbol)

          // Escalonar 90 minutos respecto al Fútbol
          const nuevoHorario = addMinutesToTime(futbol.horario_actual, 90);

          detallesActualizacion.push({
            matchup: matchupKey,
            equipos: `${futbol.eq1_nombre} vs ${futbol.eq2_nombre}`,
            futbol_horario: futbol.horario_actual,
            basquet_horario_anterior: basquet.horario_actual,
            basquet_horario_nuevo: nuevoHorario,
            razon: `Mismo matchup en ambas disciplinas: Basquetbol escalonado 90 min después de Fútbol`,
          });

          // Actualizar Básquetbol en BD
          await connection.query(
            `UPDATE TblPartido SET horario_inicio = ? WHERE id = ?`,
            [`${nuevoHorario}:00`, basquet.id]
          );

          console.log(`✓ Chocolateo: ${futbol.eq1_nombre} vs ${futbol.eq2_nombre} | Futbito(${futbol.horario_actual}) → Basquetbol(${nuevoHorario})`);

          actualizacionesRealizadas++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        actualizacionesRealizadas,
        detallesActualizacion,
        mensaje: `Se aplicó chocolateo a ${actualizacionesRealizadas} partidos`,
      },
    });
  } catch (error) {
    console.error('Error aplicando chocolateo:', error);
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
