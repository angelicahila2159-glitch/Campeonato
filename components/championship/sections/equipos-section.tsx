'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Disciplina {
  id: number;
  nombre: string;
}

interface Serie {
  id: number;
  nombre: string;
}

interface DisciplinaEquipo {
  disciplina_id: number;
  disciplina_nombre: string;
  serie_id: number;
  serie_nombre: string;
}

interface Equipo {
  id: number;
  nombre: string;
  participaciones: DisciplinaEquipo[];
}

interface DisciplinaSeleccionada {
  disciplina_id: number;
  serie_id: number;
}

export function EquiposSection() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [nombre, setNombre] = useState('');
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState<DisciplinaSeleccionada[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para edición
  const [editingEquipoId, setEditingEquipoId] = useState<number | null>(null);
  const [editingDisciplinas, setEditingDisciplinas] = useState<DisciplinaSeleccionada[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Estado para eliminación
  const [deleteConfirmEquipoId, setDeleteConfirmEquipoId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDisciplinas = async () => {
    try {
      const response = await fetch('/api/disciplinas');
      const data = await response.json();
      if (data.success) {
        setDisciplinas(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar disciplinas');
    }
  };

  const fetchSeries = async () => {
    try {
      const response = await fetch('/api/series');
      const data = await response.json();
      if (data.success) {
        setSeries(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar series');
    }
  };

  const fetchEquipos = async () => {
    try {
      const response = await fetch('/api/equipos');
      const data = await response.json();
      if (data.success) {
        setEquipos(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar equipos');
    }
  };

  useEffect(() => {
    fetchDisciplinas();
    fetchSeries();
    fetchEquipos();
  }, []);

  const handleToggleDisciplina = (disciplinaId: number) => {
    const existe = disciplinasSeleccionadas.find(d => d.disciplina_id === disciplinaId);
    
    if (existe) {
      setDisciplinasSeleccionadas(
        disciplinasSeleccionadas.filter(d => d.disciplina_id !== disciplinaId)
      );
    } else {
      setDisciplinasSeleccionadas([
        ...disciplinasSeleccionadas,
        { disciplina_id: disciplinaId, serie_id: 0 }
      ]);
    }
  };

  const handleChangeSerieForDisciplina = (disciplinaId: number, serieId: number) => {
    setDisciplinasSeleccionadas(
      disciplinasSeleccionadas.map(d =>
        d.disciplina_id === disciplinaId
          ? { ...d, serie_id: serieId }
          : d
      )
    );
  };

  const handleEditEquipo = (equipo: Equipo) => {
    setEditingEquipoId(equipo.id);
    setEditingDisciplinas(
      equipo.participaciones.map(p => ({
        disciplina_id: p.disciplina_id,
        serie_id: p.serie_id,
      }))
    );
    setShowEditModal(true);
  };

  const handleToggleEditDisciplina = (disciplinaId: number) => {
    const existe = editingDisciplinas.find(d => d.disciplina_id === disciplinaId);
    
    if (existe) {
      setEditingDisciplinas(
        editingDisciplinas.filter(d => d.disciplina_id !== disciplinaId)
      );
    } else {
      setEditingDisciplinas([
        ...editingDisciplinas,
        { disciplina_id: disciplinaId, serie_id: 0 }
      ]);
    }
  };

  const handleChangeEditSerieForDisciplina = (disciplinaId: number, serieId: number) => {
    setEditingDisciplinas(
      editingDisciplinas.map(d =>
        d.disciplina_id === disciplinaId
          ? { ...d, serie_id: serieId }
          : d
      )
    );
  };

  const handleSaveEditEquipo = async () => {
    const disciplinasIncompletas = editingDisciplinas.filter(d => d.serie_id === 0);
    if (disciplinasIncompletas.length > 0) {
      setError('Todas las disciplinas deben tener una serie asignada');
      return;
    }

    if (editingDisciplinas.length === 0) {
      setError('Debes seleccionar al menos una disciplina');
      return;
    }

    setEditLoading(true);
    setError('');
    try {
      const response = await fetch('/api/equipos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipoId: editingEquipoId,
          disciplinas: editingDisciplinas,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        setEditingEquipoId(null);
        setEditingDisciplinas([]);
        fetchEquipos();
      } else {
        setError(data.error || 'Error al actualizar el equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar el equipo');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEquipo = async (equipoId: number) => {
    setDeleteLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/equipos?id=${equipoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteConfirmEquipoId(null);
        fetchEquipos();
      } else {
        setError(data.error || 'Error al eliminar el equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar el equipo');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddEquipo = async () => {
    if (!nombre.trim()) {
      setError('El nombre del equipo es requerido');
      return;
    }

    const disciplinasIncompletas = disciplinasSeleccionadas.filter(d => d.serie_id === 0);
    if (disciplinasIncompletas.length > 0) {
      setError('Todas las disciplinas deben tener una serie asignada');
      return;
    }

    if (disciplinasSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos una disciplina');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          disciplinas: disciplinasSeleccionadas,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNombre('');
        setDisciplinasSeleccionadas([]);
        setShowForm(false);
        fetchEquipos();
      } else {
        setError(data.error || 'Error al crear el equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear el equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Equipos</h2>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          + Nuevo Equipo
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre del Equipo
              </label>
              <input
                type="text"
                placeholder="Ej: Deportivo Unidos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Selecciona Disciplinas de Participación
              </label>
              <div className="space-y-4">
                {disciplinas.map((disciplina) => {
                  const seleccionada = disciplinasSeleccionadas.find(
                    d => d.disciplina_id === disciplina.id
                  );

                  return (
                    <div key={disciplina.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`disciplina-${disciplina.id}`}
                          checked={!!seleccionada}
                          onChange={() => handleToggleDisciplina(disciplina.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label
                          htmlFor={`disciplina-${disciplina.id}`}
                          className="text-sm font-medium text-slate-700 cursor-pointer flex-1"
                        >
                          {disciplina.nombre}
                        </label>
                      </div>

                      {seleccionada && (
                        <div className="ml-6">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Serie para {disciplina.nombre}
                          </label>
                          <select
                            value={seleccionada.serie_id}
                            onChange={(e) =>
                              handleChangeSerieForDisciplina(disciplina.id, parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          >
                            <option value={0}>Selecciona una serie</option>
                            {series.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {disciplinasSeleccionadas.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">Disciplinas seleccionadas:</p>
                <ul className="space-y-1">
                  {disciplinasSeleccionadas.map((d) => {
                    const disciplina = disciplinas.find(disc => disc.id === d.disciplina_id);
                    const serie = series.find(s => s.id === d.serie_id);
                    return (
                      <li key={d.disciplina_id} className="text-sm text-blue-800">
                        • {disciplina?.nombre} - {serie?.nombre || 'Sin serie'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAddEquipo}
                disabled={loading || disciplinasSeleccionadas.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creando...' : 'Crear'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setNombre('');
                  setDisciplinasSeleccionadas([]);
                  setError('');
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {equipos.length === 0 ? (
            <p className="text-slate-500">No hay equipos creados</p>
          ) : (
            <div className="space-y-3">
              {equipos.map((e) => (
                <div
                  key={e.id}
                  className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-500 flex items-start gap-3"
                >
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleEditEquipo(e)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-8 text-xs"
                    >
                      ✎ Editar
                    </Button>
                    <Button
                      onClick={() => setDeleteConfirmEquipoId(e.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 h-8 text-xs"
                    >
                      🗑 Eliminar
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-2">{e.nombre}</div>
                    {e.participaciones && e.participaciones.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {e.participaciones.map((p, idx) => (
                          <div key={idx} className="text-sm bg-white p-2 rounded border border-slate-200">
                            <span className="font-medium text-slate-800">{p.disciplina_nombre}</span>
                            <span className="text-slate-600"> - {p.serie_nombre}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Sin disciplinas asignadas</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmEquipoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-red-600">Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                ¿Estás seguro de que deseas eliminar el equipo <strong>{equipos.find(e => e.id === deleteConfirmEquipoId)?.nombre}</strong>?
              </p>
              <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteEquipo(deleteConfirmEquipoId)}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                </Button>
                <Button
                  onClick={() => setDeleteConfirmEquipoId(null)}
                  variant="outline"
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panel Lateral de Edición (Drawer) */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        showEditModal ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {showEditModal && (
          <div className="p-6 space-y-6">
            {/* Encabezado */}
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">Editar Disciplinas</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEquipoId(null);
                  setEditingDisciplinas([]);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Nombre del equipo */}
            {editingEquipoId !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-600 font-semibold">
                  Equipo: <span className="text-blue-900">{equipos.find(e => e.id === editingEquipoId)?.nombre}</span>
                </p>
              </div>
            )}

            {/* Seleccionar disciplinas */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Disciplinas de Participación
              </label>
              <div className="space-y-3">
                {disciplinas.map((disciplina) => {
                  const seleccionada = editingDisciplinas.find(
                    d => d.disciplina_id === disciplina.id
                  );

                  return (
                    <div key={disciplina.id} className="space-y-2">
                      <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition">
                        <input
                          type="checkbox"
                          id={`edit-disciplina-${disciplina.id}`}
                          checked={!!seleccionada}
                          onChange={() => handleToggleEditDisciplina(disciplina.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label
                          htmlFor={`edit-disciplina-${disciplina.id}`}
                          className="text-sm font-medium text-slate-700 cursor-pointer flex-1"
                        >
                          {disciplina.nombre}
                        </label>
                      </div>

                      {seleccionada && (
                        <div className="ml-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">
                            Serie
                          </label>
                          <select
                            value={seleccionada.serie_id}
                            onChange={(e) =>
                              handleChangeEditSerieForDisciplina(disciplina.id, parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          >
                            <option value={0}>Selecciona una serie</option>
                            {series.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen */}
            {editingDisciplinas.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-2 uppercase">Resumen</p>
                <ul className="space-y-1">
                  {editingDisciplinas.map((d) => {
                    const disciplina = disciplinas.find(disc => disc.id === d.disciplina_id);
                    const serie = series.find(s => s.id === d.serie_id);
                    return (
                      <li key={d.disciplina_id} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>
                          <strong>{disciplina?.nombre}</strong> - {serie?.nombre || <span className="text-orange-600">Sin serie</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveEditEquipo}
                disabled={editLoading || editingDisciplinas.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {editLoading ? 'Guardando...' : '✓ Guardar'}
              </Button>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEquipoId(null);
                  setEditingDisciplinas([]);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay semi-transparente */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
          onClick={() => {
            setShowEditModal(false);
            setEditingEquipoId(null);
            setEditingDisciplinas([]);
          }}
        />
      )}

      {/* Resumen por Disciplina - Cuadros */}
      {equipos.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Resumen de Equipos por Disciplina</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {disciplinas.map((disciplina) => {
              const equiposDisciplina = equipos.filter((e) =>
                e.participaciones.some((p) => p.disciplina_id === disciplina.id)
              );

              if (equiposDisciplina.length === 0) return null;

              const seriesEnDisciplina = series.filter((s) =>
                equiposDisciplina.some((e) =>
                  e.participaciones.some(
                    (p) => p.disciplina_id === disciplina.id && p.serie_id === s.id
                  )
                )
              );

              return (
                <Card key={disciplina.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardTitle className="text-center uppercase tracking-wide">
                      {disciplina.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-blue-100">
                            {seriesEnDisciplina.map((s) => (
                              <th
                                key={s.id}
                                className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-800 bg-blue-200 text-sm"
                              >
                                {s.nombre}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({
                            length: Math.max(
                              ...seriesEnDisciplina.map((s) =>
                                equiposDisciplina.filter((e) =>
                                  e.participaciones.some(
                                    (p) => p.disciplina_id === disciplina.id && p.serie_id === s.id
                                  )
                                ).length
                              )
                            ),
                          }).map((_, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              {seriesEnDisciplina.map((s) => {
                                const equiposSerie = equiposDisciplina.filter((e) =>
                                  e.participaciones.some(
                                    (p) => p.disciplina_id === disciplina.id && p.serie_id === s.id
                                  )
                                );
                                const equipo = equiposSerie[rowIndex];

                                return (
                                  <td
                                    key={s.id}
                                    className="border border-slate-300 px-3 py-2 text-center text-sm text-slate-700"
                                  >
                                    {equipo ? equipo.nombre : ''}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          <tr className="bg-blue-100 font-semibold">
                            {seriesEnDisciplina.map((s) => {
                              const count = equiposDisciplina.filter((e) =>
                                e.participaciones.some(
                                  (p) => p.disciplina_id === disciplina.id && p.serie_id === s.id
                                )
                              ).length;
                              return (
                                <td
                                  key={s.id}
                                  className="border border-slate-300 px-3 py-2 text-center text-slate-800 text-sm"
                                >
                                  {count}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
