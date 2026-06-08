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

// Helper function to calculate minutes between two times
const calcularMinutosEntre = (hora1: string, hora2: string): number => {
  const [h1, m1] = hora1.split(':').map(Number);
  const [h2, m2] = hora2.split(':').map(Number);
  return Math.abs((h2 * 60 + m2) - (h1 * 60 + m1));
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { fechaId } = await request.json();

    if (!fechaId) {
      return NextResponse.json(
        { success: false, error: 'fechaId es requerido' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener todos los partidos VS de esta fecha (SOLO Fútbol y Básquetbol)
    const [partidosResult] = await connection.query(
      `SELECT 
        p.id,
        p.disciplina_id,
        d.nombre as disciplina_nombre,
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
      WHERE p.fecha_id = ? 
        AND d.tipo_competicion = 'vs' 
        AND p.equipo1_id != p.equipo2_id
        AND d.nombre IN ('Futbito', 'Basquetbol')
      ORDER BY p.equipo1_id, p.horario_inicio`,
      [fechaId]
    );

    if (!Array.isArray(partidosResult) || partidosResult.length === 0) {
      return NextResponse.json({
        success: true,
        data: { mensaje: 'No hay partidos en esta fecha' },
      });
    }

    // Agrupar partidos por equipo
    const partidosPorEquipo = new Map<number, any[]>();
    
    partidosResult.forEach((partido: any) => {
      // Agregar equipo1
      if (!partidosPorEquipo.has(partido.equipo1_id)) {
        partidosPorEquipo.set(partido.equipo1_id, []);
      }
      partidosPorEquipo.get(partido.equipo1_id)!.push(partido);
      
      // Agregar equipo2
      if (!partidosPorEquipo.has(partido.equipo2_id)) {
        partidosPorEquipo.set(partido.equipo2_id, []);
      }
      partidosPorEquipo.get(partido.equipo2_id)!.push(partido);
    });

    let conflictosEncontrados = 0;
    let conflictosResueltos = 0;
    const detallesConflictos = [];

    // Para cada equipo, buscar conflictos de horario
    for (const [equipoId, partidos] of partidosPorEquipo.entries()) {
      if (partidos.length < 2) continue; // Necesita al menos 2 partidos

      // Eliminar duplicados (si un equipo aparece 2 veces en el mismo partido)
      const partidosUnicos = Array.from(
        new Map(partidos.map(p => [p.id, p])).values()
      );

      // Ordenar por horario
      partidosUnicos.sort((a, b) => {
        const [ha, ma] = a.horario_actual.split(':').map(Number);
        const [hb, mb] = b.horario_actual.split(':').map(Number);
        return (ha * 60 + ma) - (hb * 60 + mb);
      });

      // Buscar conflictos (menos de 90 minutos entre partidos)
      for (let i = 0; i < partidosUnicos.length - 1; i++) {
        const p1 = partidosUnicos[i];
        const p2 = partidosUnicos[i + 1];
        
        const minutos = calcularMinutosEntre(p1.horario_actual, p2.horario_actual);
        
        if (minutos < 90) {
          conflictosEncontrados++;
          
          // Calcular nuevo horario para p2
          let nuevoHorario = addMinutesToTime(p1.horario_actual, 90);
          
          // Verificar que no choque con otros partidos
          let intentos = 0;
          while (intentos < 10) {
            const choque = partidosUnicos.some(p => 
              p.id !== p2.id && 
              calcularMinutosEntre(nuevoHorario, p.horario_actual) < 45
            );
            
            if (!choque) break;
            nuevoHorario = addMinutesToTime(nuevoHorario, 45);
            intentos++;
          }
          
          detallesConflictos.push({
            equipo_id: equipoId,
            equipo_nombre: p1.equipo1_id === equipoId ? p1.eq1_nombre : p1.eq2_nombre,
            partido1: `${p1.eq1_nombre} vs ${p1.eq2_nombre} (${p1.disciplina_nombre})`,
            partido2: `${p2.eq1_nombre} vs ${p2.eq2_nombre} (${p2.disciplina_nombre})`,
            horario_anterior: p2.horario_actual,
            horario_nuevo: nuevoHorario,
            minutos_entre_original: minutos,
            minutos_entre_nuevo: 90,
          });
          
          // Actualizar en BD
          await connection.query(
            `UPDATE TblPartido SET horario_inicio = ? WHERE id = ?`,
            [`${nuevoHorario}:00`, p2.id]
          );
          
          conflictosResueltos++;
          
          console.log(`✓ Conflicto resuelto: Equipo ${equipoId} - ${p2.disciplina_nombre} movido a ${nuevoHorario}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        conflictosEncontrados,
        conflictosResueltos,
        detallesConflictos,
        mensaje: `Se encontraron ${conflictosEncontrados} conflictos. Se resolvieron ${conflictosResueltos}.`,
      },
    });
  } catch (error) {
    console.error('Error resolviendo conflictos:', error);
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
