'use client';

import { useState, useEffect } from 'react';
import { useChampionship } from '@/lib/championship-context';
import { Card, CardContent } from '@/components/ui/card';

interface Posicion {
  equipo_id: number;
  equipo_nombre: string;
  serie_id: number;
  serie_nombre: string;
  disciplina_id: number;
  disciplina_nombre: string;
  tipo_competicion: string;
  partidos_jugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  puntos: number;
  puntos_apertura: number;
  puntos_clausura: number;
  es_ganador: boolean;
}

export function PosicionesSection() {
  const { disciplinas } = useChampionship();
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDisciplinaId, setFilterDisciplinaId] = useState<string>('todas');

  // Cargar posiciones desde la API
  useEffect(() => {
    const fetchPosiciones = async () => {
      setLoading(true);
      try {
        let url = '/api/posiciones';
        if (filterDisciplinaId !== 'todas') {
          url += `?disciplinaId=${filterDisciplinaId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          setPosiciones(data.data || []);
        }
      } catch (error) {
        console.error('Error cargando posiciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosiciones();
    
    // Escuchar evento global cuando se guarda un resultado
    window.addEventListener('resultadoGuardado', fetchPosiciones);
    
    return () => {
      window.removeEventListener('resultadoGuardado', fetchPosiciones);
    };
  }, [filterDisciplinaId]);

  // Agrupar posiciones por disciplina y serie
  const agruparPosiciones = () => {
    const agrupado: {
      [key: string]: {
        disciplina_nombre: string;
        disciplina_id: number;
        series: {
          [key: string]: {
            serie_nombre: string;
            serie_id: number;
            equipos: Posicion[];
          };
        };
      };
    } = {};

    posiciones.forEach((pos) => {
      const disciplinaKey = `${pos.disciplina_id}`;
      const serieKey = `${pos.serie_id}`;

      if (!agrupado[disciplinaKey]) {
        agrupado[disciplinaKey] = {
          disciplina_nombre: pos.disciplina_nombre,
          disciplina_id: pos.disciplina_id,
          series: {},
        };
      }

      if (!agrupado[disciplinaKey].series[serieKey]) {
        agrupado[disciplinaKey].series[serieKey] = {
          serie_nombre: pos.serie_nombre,
          serie_id: pos.serie_id,
          equipos: [],
        };
      }

      agrupado[disciplinaKey].series[serieKey].equipos.push(pos);
    });

    // Ordenar equipos por puntos dentro de cada serie
    Object.values(agrupado).forEach((disciplina) => {
      Object.values(disciplina.series).forEach((serie) => {
        serie.equipos.sort((a, b) => {
          if (b.puntos !== a.puntos) {
            return b.puntos - a.puntos;
          }
          if (b.diferencia_goles !== a.diferencia_goles) {
            return b.diferencia_goles - a.diferencia_goles;
          }
          return b.goles_favor - a.goles_favor;
        });
      });
    });

    return agrupado;
  };

  const agrupado = agruparPosiciones();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Tabla de Posiciones</h2>
        <select
          value={filterDisciplinaId}
          onChange={(e) => setFilterDisciplinaId(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
        >
          <option value="todas">Todas las disciplinas</option>
          {disciplinas.map((disciplina) => (
            <option key={disciplina.id} value={disciplina.id}>
              {disciplina.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-slate-600 py-8">Cargando posiciones...</div>
      ) : Object.keys(agrupado).length === 0 ? (
        <div className="text-center text-slate-600 py-8">
          No hay datos de posiciones disponibles.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(agrupado).map((disciplina) => (
            <div key={disciplina.disciplina_id} className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {disciplina.disciplina_nombre}
              </h3>

              {Object.values(disciplina.series).map((serie) => (
                <Card key={serie.serie_id}>
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-300">
                      {serie.serie_nombre}
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-300 bg-slate-50">
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Pos</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Equipo</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">PJ</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">G</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">E</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">P</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">GF</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">GC</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">DG</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">Pts Apertura</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">Pts Clausura</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">Pts Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serie.equipos.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                                Sin equipos en esta serie
                              </td>
                            </tr>
                          ) : (
                            serie.equipos.map((equipo, index) => (
                              <tr
                                key={equipo.equipo_id}
                                className={`border-b border-slate-200 hover:bg-slate-50 ${
                                  equipo.es_ganador
                                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500'
                                    : index === 0
                                    ? 'bg-yellow-50'
                                    : index === 1
                                    ? 'bg-slate-200 bg-opacity-30'
                                    : index === 2
                                    ? 'bg-orange-50'
                                    : ''
                                }`}
                              >
                                <td className="px-4 py-3 font-bold text-slate-900 text-center">
                                  {equipo.es_ganador ? '🏆' : index + 1}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {equipo.equipo_nombre}
                                  {equipo.es_ganador && (
                                    <div className="text-xs text-amber-600 font-semibold mt-1">
                                      ✓ Ganador
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700">
                                  {equipo.partidos_jugados}
                                </td>
                                <td className="px-4 py-3 text-center text-green-700 font-medium">
                                  {equipo.victorias}
                                </td>
                                <td className="px-4 py-3 text-center text-yellow-700 font-medium">
                                  {equipo.empates}
                                </td>
                                <td className="px-4 py-3 text-center text-red-700 font-medium">
                                  {equipo.derrotas}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700">
                                  {equipo.goles_favor}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700">
                                  {equipo.goles_contra}
                                </td>
                                <td className="px-4 py-3 text-center font-medium text-slate-900">
                                  {equipo.diferencia_goles > 0
                                    ? `+${equipo.diferencia_goles}`
                                    : equipo.diferencia_goles}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-lg text-slate-900 bg-blue-100 rounded">
                                  {equipo.puntos_apertura}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-lg text-slate-900 bg-orange-100 rounded">
                                  {equipo.puntos_clausura}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-lg text-slate-900 bg-slate-100 rounded">
                                  {equipo.puntos}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
