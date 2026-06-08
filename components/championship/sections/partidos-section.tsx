'use client';

import { useState, useEffect } from 'react';
import { Partido, useChampionship } from '@/lib/championship-context';
import { PartidoForm } from '../forms/partido-form';
import { PartidoList } from '../lists/partido-list';
import { ResultadoModal } from '../modals/resultado-modal';
import { CambiarHorarioModal } from '../modals/cambiar-horario-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Fecha {
  id: number;
  nombre: string;
  fecha: string;
  activa: boolean;
}

interface PartidoDB {
  id: number;
  fecha_id: number;
  fecha_nombre: string;
  fecha: string;
  disciplina_id: number;
  disciplina_nombre: string;
  serie_id: number;
  serie_nombre: string;
  equipo1_id: number;
  equipo1_nombre: string;
  equipo2_id: number;
  equipo2_nombre: string;
  goles_equipo1: number;
  goles_equipo2: number;
  puntos_individuales?: number | null;
  estado: string;
  tipo_competicion: string;
  sitio_nombre?: string;
  horario_inicio?: string;
}

export function PartidosSection() {
  const { partidos, fechas, disciplinas } = useChampionship();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterFechaId, setFilterFechaId] = useState<string>('todos');
  const [filterDisciplinaId, setFilterDisciplinaId] = useState<string>('todas');
  const [searchEquipo, setSearchEquipo] = useState<string>('');
  const [resultadoModal, setResultadoModal] = useState<{ isOpen: boolean; partido: Partido | null }>({
    isOpen: false,
    partido: null,
  });

  // Estado para generar partidos
  const [showChocolateModal, setShowChocolateModal] = useState(false);
  const [fechasReales, setFechasReales] = useState<Fecha[]>([]);
  const [selectedFechaId, setSelectedFechaId] = useState<string>('');
  const [selectedDisciplinaIds, setSelectedDisciplinaIds] = useState<Set<number>>(new Set());
  const [selectedSitioId, setSelectedSitioId] = useState<string>('');
  const [sitios, setSitios] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<Set<number>>(new Set());
  const [generatedPartidos, setGeneratedPartidos] = useState<any[]>([]);
  const [chocolateLoading, setChocolateLoading] = useState(false);
  const [chocolateError, setChocolateError] = useState('');
  const [sitiosLoading, setSitiosLoading] = useState(false);
  const [fechasLoading, setFechasLoading] = useState(false);

  // Estado para partidos de la BD
  const [partidosDB, setPartidosDB] = useState<PartidoDB[]>([]);
  const [partidosLoading, setPartidosLoading] = useState(false);

  // Estado para equipos sueltos
  const [equiposSueltos, setEquiposSueltos] = useState<any[]>([]);
  const [showEquiposSueltosModal, setShowEquiposSueltosModal] = useState(false);
  const [generandoEquiposSueltos, setGenerandoEquiposSueltos] = useState(false);

  // Estado para modal de resultado
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [editingPartido, setEditingPartido] = useState<PartidoDB | null>(null);
  const [resultadoLocal, setResultadoLocal] = useState<number>(0);
  const [resultadoVisitante, setResultadoVisitante] = useState<number>(0);
  const [resultadoEstado, setResultadoEstado] = useState<string>('Programado');

  // Estado para cambiar horario
  const [showCambiarHorarioModal, setShowCambiarHorarioModal] = useState(false);
  const [partidoParaCambiarHorario, setPartidoParaCambiarHorario] = useState<PartidoDB | null>(null);
  const [cambiandoHorario, setCambiandoHorario] = useState(false);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);

  // Cargar fechas reales de la API
  useEffect(() => {
    const fetchFechas = async () => {
      setFechasLoading(true);
      try {
        const response = await fetch('/api/fechas');
        const data = await response.json();
        if (data.success) {
          setFechasReales(data.data || []);
        }
      } catch (error) {
        console.error('Error cargando fechas:', error);
      } finally {
        setFechasLoading(false);
      }
    };

    fetchFechas();
  }, []);

  // Cargar partidos desde la BD
  useEffect(() => {
    const fetchPartidos = async () => {
      setPartidosLoading(true);
      try {
        const response = await fetch('/api/partidos');
        const data = await response.json();
        if (data.success) {
          setPartidosDB(data.data || []);
        }
      } catch (error) {
        console.error('Error cargando partidos:', error);
      } finally {
        setPartidosLoading(false);
      }
    };

    fetchPartidos();
  }, []);

  const filteredPartidosDB = 
    filterFechaId === 'todos' && filterDisciplinaId === 'todas' && searchEquipo === ''
      ? partidosDB 
      : partidosDB.filter(p => {
          const matchFecha = filterFechaId === 'todos' || p.fecha_id === parseInt(filterFechaId);
          const matchDisciplina = filterDisciplinaId === 'todas' || p.disciplina_id === parseInt(filterDisciplinaId);
          const matchEquipo = searchEquipo === '' || 
            p.equipo1_nombre.toLowerCase().includes(searchEquipo.toLowerCase()) ||
            p.equipo2_nombre.toLowerCase().includes(searchEquipo.toLowerCase());
          
          return matchFecha && matchDisciplina && matchEquipo;
        });

  const handleGenerateChocolate = async () => {
    if (!selectedFechaId || selectedDisciplinaIds.size === 0 || !selectedSitioId || selectedSeriesIds.size === 0) {
      setChocolateError('Selecciona fecha, al menos una disciplina, sitio y al menos una serie');
      return;
    }

    setChocolateLoading(true);
    setChocolateError('');
    setGeneratedPartidos([]);

    try {
      // Generar partidos para TODAS las disciplinas seleccionadas
      let todosLosPartidos: any[] = [];

      for (const disciplinaId of Array.from(selectedDisciplinaIds)) {
        const response = await fetch('/api/generar-partidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fechaId: selectedFechaId,
            disciplinaId: disciplinaId,
            sitioId: selectedSitioId,
            seriesIds: Array.from(selectedSeriesIds),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          todosLosPartidos = todosLosPartidos.concat(data.data.partidos);
        } else {
          setChocolateError(`Error generando disciplina ${disciplinaId}: ${data.error}`);
          setChocolateLoading(false);
          return;
        }
      }

      // MEZCLAR los partidos aleatoriamente
      const shuffle = (arr: any[]) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const partidosMezclados = shuffle(todosLosPartidos);
      setGeneratedPartidos(partidosMezclados);

      // Aplicar chocolateo (escalonar horarios entre disciplinas)
      try {
        const chocolateoResponse = await fetch('/api/aplicar-chocolateo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fechaId: selectedFechaId }),
        });

        const chocolateoData = await chocolateoResponse.json();
        if (chocolateoData.success) {
          console.log('✓ Chocolateo aplicado:', chocolateoData.data.actualizacionesRealizadas, 'partidos escalonados');
        }
      } catch (error) {
        console.error('Error aplicando chocolateo:', error);
      }

      // Detectar equipos sueltos SOLO en las series chocolateadas
      const sueltosDetectados = [];
      const seriesIdsParam = Array.from(selectedSeriesIds).join(',');
      
      // Necesitamos detectar por cada disciplina
      for (const disciplinaId of Array.from(selectedDisciplinaIds)) {
        try {
          const sueltosResponse = await fetch(`/api/equipos-pendientes?fechaId=${selectedFechaId}&disciplinaId=${disciplinaId}&seriesIds=${seriesIdsParam}`);
          const sueltosData = await sueltosResponse.json();
          if (sueltosData.success && sueltosData.data.equiposSueltos.length > 0) {
            sueltosDetectados.push(...sueltosData.data.equiposSueltos);
          }
        } catch (error) {
          console.error('Error detectando equipos sueltos:', error);
        }
      }

      if (sueltosDetectados.length > 0) {
        setEquiposSueltos(sueltosDetectados);
        setShowEquiposSueltosModal(true);
      }

      // Recargar la tabla de partidos
      const refreshResponse = await fetch('/api/partidos');
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        setPartidosDB(refreshData.data || []);
      }

      // Cerrar el modal automáticamente después de generar exitosamente
      setTimeout(() => {
        setShowChocolateModal(false);
        setSelectedFechaId('');
        setSelectedDisciplinaIds(new Set());
        setSelectedSitioId('');
        setSitios([]);
        setSeries([]);
        setSelectedSeriesIds(new Set());
        setGeneratedPartidos([]);
        setChocolateError('');
      }, 800);
    } catch (error) {
      console.error('Error:', error);
      setChocolateError(error instanceof Error ? error.message : 'Error al generar partidos');
    } finally {
      setChocolateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeletePartido = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este partido?')) {
      try {
        const response = await fetch(`/api/partidos?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setPartidosDB(partidosDB.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error('Error eliminando partido:', error);
      }
    }
  };

  const handleEditResultado = (partido: PartidoDB) => {
    setEditingPartido(partido);
    setShowResultadoModal(true);
  };

  const handleSaveResultado = async () => {
    if (!editingPartido) return;

    try {
      const body: any = {
        estado: resultadoEstado,
      };

      // Diferente lógica según tipo de competencia
      if (editingPartido.tipo_competicion === 'puntos') {
        // Para disciplinas individuales: usar puntos_individuales
        body.puntos_individuales = resultadoLocal;
        body.goles_equipo1 = 0;
        body.goles_equipo2 = 0;
      } else {
        // Para disciplinas VS: usar goles
        body.goles_equipo1 = resultadoLocal;
        body.goles_equipo2 = resultadoVisitante;
        body.puntos_individuales = null;
      }

      const response = await fetch(`/api/partidos?id=${editingPartido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Actualizar la tabla de partidos
        setPartidosDB(
          partidosDB.map(p =>
            p.id === editingPartido.id
              ? {
                  ...p,
                  goles_equipo1: body.goles_equipo1,
                  goles_equipo2: body.goles_equipo2,
                  puntos_individuales: body.puntos_individuales,
                  estado: resultadoEstado,
                }
              : p
          )
        );
        
        // Disparar evento global para actualizar posiciones
        window.dispatchEvent(new Event('resultadoGuardado'));
        
        setShowResultadoModal(false);
        setEditingPartido(null);
        setResultadoLocal(0);
        setResultadoVisitante(0);
        setResultadoEstado('Programado');
      }
    } catch (error) {
      console.error('Error guardando resultado:', error);
    }
  };

  const handleAbrirCambiarHorario = (partido: PartidoDB) => {
    setPartidoParaCambiarHorario(partido);
    
    // Generar horarios disponibles (cada 45 minutos desde 08:00 hasta 18:00)
    const horarios: string[] = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 45) {
        horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    setHorariosDisponibles(horarios);
    setShowCambiarHorarioModal(true);
  };

  const handleCambiarHorario = async (nuevoHorario: string) => {
    if (!partidoParaCambiarHorario) return;

    setCambiandoHorario(true);
    try {
      // Formatear horario a HH:MM:SS
      const horarioFormato = `${nuevoHorario}:00`;

      const response = await fetch('/api/cambiar-horario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partidoId: partidoParaCambiarHorario.id,
          nuevoHorario: horarioFormato,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar la tabla de partidos
        setPartidosDB(
          partidosDB.map(p =>
            p.id === partidoParaCambiarHorario.id
              ? { ...p, horario_inicio: horarioFormato }
              : p
          )
        );

        setShowCambiarHorarioModal(false);
        setPartidoParaCambiarHorario(null);
        alert('Horario actualizado correctamente');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error cambiando horario:', error);
      alert('Error al cambiar el horario');
    } finally {
      setCambiandoHorario(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Partidos</h2>
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterFechaId}
            onChange={(e) => setFilterFechaId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
          >
            <option value="todos">Todas las fechas</option>
            {fechasReales.map(fecha => (
              <option key={fecha.id} value={fecha.id}>
                {fecha.nombre} - {formatDate(fecha.fecha)}
              </option>
            ))}
          </select>
          <select
            value={filterDisciplinaId}
            onChange={(e) => setFilterDisciplinaId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
          >
            <option value="todas">Todas las disciplinas</option>
            {disciplinas.map(disciplina => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.nombre}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              console.log('🍫 Chocolate button clicked, opening modal');
              setShowChocolateModal(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            🍫 Chocolate
          </Button>
        </div>
      </div>

      {/* Modal Chocolate */}
      {showChocolateModal && (
        <>
          {console.log('🍫 Modal rendering. showChocolateModal:', showChocolateModal)}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">🍫 Generador de Partidos - Chocolate</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Selecciona una fecha y disciplina para generar partidos mezclando automáticamente los equipos de cada serie.
                </p>
              </div>

              {chocolateError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {chocolateError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Selecciona una Fecha
                </label>
                <select
                  value={selectedFechaId}
                  onChange={(e) => setSelectedFechaId(e.target.value)}
                  disabled={fechasLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                >
                  <option value="">
                    {fechasLoading ? 'Cargando fechas...' : '-- Selecciona una fecha --'}
                  </option>
                  {fechasReales.map(fecha => (
                    <option key={fecha.id} value={String(fecha.id)}>
                      {fecha.nombre} - {formatDate(fecha.fecha)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Selecciona Disciplinas
                </label>
                <div className="space-y-2 p-3 border border-slate-300 rounded-lg bg-slate-50">
                  {disciplinas.map(disciplina => (
                    <label key={disciplina.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDisciplinaIds.has(disciplina.id)}
                        onChange={async (e) => {
                          const newIds = new Set(selectedDisciplinaIds);
                          if (e.target.checked) {
                            newIds.add(disciplina.id);
                          } else {
                            newIds.delete(disciplina.id);
                          }
                          setSelectedDisciplinaIds(newIds);
                          setSelectedSitioId('');
                          setSelectedSeriesIds(new Set());
                          
                          // Cargar sitios disponibles para las disciplinas seleccionadas
                          if (newIds.size > 0) {
                            try {
                              setSitiosLoading(true);
                              const allSitios = new Set<number>();
                              
                              // Obtener sitios de todas las disciplinas seleccionadas
                              for (const discId of Array.from(newIds)) {
                                const response = await fetch(`/api/sitios?disciplinaId=${discId}`);
                                const data = await response.json();
                                if (data.success && Array.isArray(data.data)) {
                                  data.data.forEach((sitio: any) => {
                                    allSitios.add(sitio.id);
                                  });
                                }
                              }
                              
                              // Obtener detalles de todos los sitios únicos
                              const sitiosResponse = await fetch('/api/sitios');
                              const sitiosData = await sitiosResponse.json();
                              if (sitiosData.success && Array.isArray(sitiosData.data)) {
                                const filteredSitios = sitiosData.data.filter((s: any) => allSitios.has(s.id));
                                setSitios(filteredSitios);
                              }
                            } catch (error) {
                              console.error('Error cargando sitios:', error);
                              setSitios([]);
                            } finally {
                              setSitiosLoading(false);
                            }
                          } else {
                            setSitios([]);
                            setSeries([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-700">{disciplina.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedDisciplinaIds.size > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Selecciona el Sitio
                  </label>
                  <select
                    value={selectedSitioId}
                    onChange={async (e) => {
                      setSelectedSitioId(e.target.value);
                      setSelectedSeriesIds(new Set());
                      
                      // Cargar series disponibles que tengan equipos en las disciplinas seleccionadas
                      if (e.target.value && selectedDisciplinaIds.size > 0) {
                        try {
                          // Obtener equipos para todas las disciplinas seleccionadas
                          const allSeries = new Set<number>();
                          for (const disciplinaId of Array.from(selectedDisciplinaIds)) {
                            const response = await fetch(`/api/equipos?disciplinaId=${disciplinaId}`);
                            const data = await response.json();
                            if (data.success && data.data) {
                              // Extraer series únicas de los equipos
                              data.data.forEach((ed: any) => {
                                if (ed.serie_id) {
                                  allSeries.add(ed.serie_id);
                                }
                              });
                            }
                          }
                          
                          // Obtener todas las series
                          const seriesResponse = await fetch('/api/series');
                          const seriesData = await seriesResponse.json();
                          if (seriesData.success && seriesData.data) {
                            // Filtrar solo las series que tienen equipos en alguna disciplina
                            const filteredSeries = seriesData.data.filter((s: any) => 
                              allSeries.has(s.id)
                            );
                            setSeries(filteredSeries);
                          }
                        } catch (error) {
                          console.error('Error cargando series:', error);
                        }
                      }
                    }}
                    disabled={sitiosLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  >
                    <option value="">-- Selecciona un sitio --</option>
                    {sitios.map(sitio => (
                      <option key={sitio.id} value={String(sitio.id)}>
                        {sitio.nombre} ({sitio.horario_inicio} - {sitio.horario_fin})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSitioId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Selecciona las Series a Chocolatear
                  </label>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                    {series.length > 0 ? (
                      series.map(serie => (
                        <div key={serie.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`serie-${serie.id}`}
                            checked={selectedSeriesIds.has(serie.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedSeriesIds);
                              if (e.target.checked) {
                                newSet.add(serie.id);
                              } else {
                                newSet.delete(serie.id);
                              }
                              setSelectedSeriesIds(newSet);
                            }}
                            className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                          />
                          <label htmlFor={`serie-${serie.id}`} className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
                            {serie.nombre}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600">Cargando series...</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Los partidos de cada serie se escalonarán automáticamente en el sitio sin solapamientos.
                  </p>
                  {selectedSeriesIds.size > 0 && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      ✓ {selectedSeriesIds.size} serie(s) seleccionada(s)
                    </p>
                  )}
                </div>
              )}

              {generatedPartidos.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-green-900">
                    ✓ {generatedPartidos.length} partidos generados:
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {generatedPartidos.map((partido, idx) => (
                      <div key={idx} className="text-sm text-green-800">
                        <span className="font-medium">{partido.equipo1_nombre}</span>
                        {partido.equipo2_nombre && (
                          <>
                            <span className="text-green-600"> vs </span>
                            <span className="font-medium">{partido.equipo2_nombre}</span>
                          </>
                        )}
                        <span className="text-xs text-green-600"> ({partido.serie_nombre})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateChocolate}
                  disabled={chocolateLoading || !selectedFechaId || selectedDisciplinaIds.size === 0 || !selectedSitioId || selectedSeriesIds.size === 0}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {chocolateLoading ? 'Generando...' : '🍫 Generar Partidos'}
                </Button>
                <Button
                  onClick={() => {
                    setShowChocolateModal(false);
                    setSelectedFechaId('');
                    setSelectedDisciplinaIds(new Set());
                    setSelectedSitioId('');
                    setSitios([]);
                    setSeries([]);
                    setSelectedSeriesIds(new Set());
                    setGeneratedPartidos([]);
                    setChocolateError('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      {/* Modal Resultado */}
      {showResultadoModal && editingPartido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Registrar Resultado</h2>
              </div>

              {/* Equipos y Puntos/Goles */}
              <div className="space-y-4">
                {editingPartido.tipo_competicion === 'puntos' ? (
                  // Competencia individual
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-slate-600 mb-2">Competencia Individual</p>
                    <p className="text-2xl font-bold text-slate-900">{editingPartido.equipo1_nombre}</p>
                    <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                      <label className="block text-xs text-slate-600 mb-1">Puntos</label>
                      <input
                        type="number"
                        min="0"
                        value={resultadoLocal}
                        onChange={(e) => setResultadoLocal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center text-3xl font-bold bg-white border-2 border-blue-300 rounded-lg px-2 py-2"
                      />
                    </div>
                  </div>
                ) : (
                  // Competencia vs
                  <>
                    {/* Equipo Local */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm text-slate-600">Local</p>
                        <p className="font-bold text-slate-900">{editingPartido.equipo1_nombre}</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={resultadoLocal}
                        onChange={(e) => setResultadoLocal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 text-center text-3xl font-bold bg-white border-2 border-blue-300 rounded-lg px-2 py-1"
                      />
                    </div>

                    {/* VS */}
                    <div className="text-center text-slate-500 font-semibold">VS</div>

                    {/* Equipo Visitante */}
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <input
                        type="number"
                        min="0"
                        value={resultadoVisitante}
                        onChange={(e) => setResultadoVisitante(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 text-center text-3xl font-bold bg-white border-2 border-orange-300 rounded-lg px-2 py-1"
                      />
                      <div>
                        <p className="text-sm text-slate-600">Visitante</p>
                        <p className="font-bold text-slate-900">{editingPartido.equipo2_nombre}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Estado del Partido */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Estado del Partido
                </label>
                <select
                  value={resultadoEstado}
                  onChange={(e) => setResultadoEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value="Programado">Programado</option>
                  <option value="En juego">En juego</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              {/* Información Adicional */}
              <div className="bg-slate-100 p-3 rounded-lg text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Disciplina:</strong> {editingPartido.disciplina_nombre}
                </p>
                <p>
                  <strong>Serie:</strong> {editingPartido.serie_nombre}
                </p>
                <p>
                  <strong>Fecha:</strong> {formatDate(editingPartido.fecha)}
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveResultado}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Guardar Resultado
                </Button>
                <Button
                  onClick={() => {
                    setShowResultadoModal(false);
                    setEditingPartido(null);
                    setResultadoLocal(0);
                    setResultadoVisitante(0);
                    setResultadoEstado('Programado');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Equipos Sueltos */}
      {showEquiposSueltosModal && equiposSueltos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">⚠️ Equipos Sueltos Detectados</h2>
                <p className="text-sm text-slate-600">
                  Se detectaron equipos sin pareja en esta fecha. Estos equipos DEBEN jugar en la siguiente fecha.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-yellow-900">
                  🏠 {equiposSueltos.length} equipo(s) sin pareja:
                </p>
                <div className="space-y-1">
                  {equiposSueltos.map((equipo, idx) => (
                    <div key={idx} className="text-sm text-yellow-800 flex items-center gap-2">
                      <span className="font-medium">{equipo.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-semibold mb-2">📋 Próximos pasos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Genera los partidos de la siguiente fecha</li>
                  <li>Este sistema automáticamente te notificará si hay equipos sin pareja</li>
                  <li>Usa el botón "🎯 Generar Partido Obligatorio" para crear su partido</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowEquiposSueltosModal(false);
                    setEquiposSueltos([]);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  ✓ Entendido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Partidos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <h3 className="text-xl font-bold text-slate-900">Tabla de Partidos</h3>
            <input
              type="text"
              placeholder="Buscar por equipo..."
              value={searchEquipo}
              onChange={(e) => setSearchEquipo(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          
          {partidosLoading ? (
            <div className="text-center text-slate-600">Cargando partidos...</div>
          ) : filteredPartidosDB.length === 0 ? (
            <div className="text-center text-slate-600 py-8">
              No hay partidos generados aún. Usa el botón 🍫 Chocolate para generar partidos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Disciplina</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Serie</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Partido</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Sitio</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Horario</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Resultado</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Estado</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartidosDB.map((partido) => (
                    <tr key={partido.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900 font-medium">{formatDate(partido.fecha)}</td>
                      <td className="px-4 py-3 text-slate-900">{partido.disciplina_nombre}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium text-xs">
                          {partido.serie_nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {partido.tipo_competicion === 'puntos' ? (
                          <div className="font-medium text-center text-blue-600">
                            {partido.equipo1_nombre}
                            <div className="text-xs text-slate-600 mt-1">Individual</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{partido.equipo1_nombre}</div>
                            <div className="text-slate-500">vs</div>
                            <div className="font-medium">{partido.equipo2_nombre}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        <span className="text-sm">{partido.sitio_nombre}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        <span className="text-sm font-medium">{partido.horario_inicio || '--'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-lg">
                          {partido.tipo_competicion === 'puntos' 
                            ? partido.puntos_individuales ?? 0
                            : `${partido.goles_equipo1} - ${partido.goles_equipo2}`
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          partido.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                          partido.estado === 'En juego' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {partido.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => handleEditResultado(partido)}
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                        >
                          Colocar Resultado
                        </button>
                        <button
                          onClick={() => handleEditResultado(partido)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Actualizar
                        </button>
                        <button
                          onClick={() => handleAbrirCambiarHorario(partido)}
                          className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                          title="Cambiar el horario del partido"
                        >
                          ⏰ Cambiar Horario
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para cambiar horario */}
      {showCambiarHorarioModal && partidoParaCambiarHorario && (
        <CambiarHorarioModal
          isOpen={showCambiarHorarioModal}
          onClose={() => {
            setShowCambiarHorarioModal(false);
            setPartidoParaCambiarHorario(null);
          }}
          onConfirm={handleCambiarHorario}
          partido={{
            id: partidoParaCambiarHorario.id,
            equipo1_nombre: partidoParaCambiarHorario.equipo1_nombre,
            equipo2_nombre: partidoParaCambiarHorario.equipo2_nombre,
            horario_actual: partidoParaCambiarHorario.horario_inicio || '-- : --',
          }}
          horariosDisponibles={horariosDisponibles}
          loading={cambiandoHorario}
        />
      )}
    </div>
  );
}
