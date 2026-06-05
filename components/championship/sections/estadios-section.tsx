'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChampionship } from '@/lib/championship-context';

interface Sitio {
  id: number;
  nombre: string;
  disciplina_id: number;
  disciplina_nombre: string;
  ciudad: string;
  capacidad: number;
  direccion: string;
  horario_inicio: string;
  horario_fin: string;
  activa: boolean;
}

export function EstadiosSection() {
  const { disciplinas } = useChampionship();
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterDisciplinaId, setFilterDisciplinaId] = useState<string>('todas');

  // Form state
  const [nombre, setNombre] = useState('');
  const [disciplina_id, setDisciplina_id] = useState<string>('');
  const [ciudad, setCiudad] = useState('');
  const [capacidad, setCapacidad] = useState<string>('');
  const [direccion, setDireccion] = useState('');
  const [horario_inicio, setHorario_inicio] = useState('08:00');
  const [horario_fin, setHorario_fin] = useState('22:00');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSitios = async () => {
    setLoading(true);
    try {
      let url = '/api/sitios';
      if (filterDisciplinaId !== 'todas') {
        url += `?disciplinaId=${filterDisciplinaId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSitios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando sitios:', error);
      setError('Error al cargar los sitios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitios();
  }, [filterDisciplinaId]);

  const handleAddSitio = async () => {
    if (!nombre.trim() || !disciplina_id) {
      setError('Nombre y disciplina son requeridos');
      return;
    }

    setFormLoading(true);
    setError('');
    try {
      const url = editingId ? '/api/sitios' : '/api/sitios';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...(editingId && { id: editingId }),
        nombre: nombre.trim(),
        disciplina_id: parseInt(disciplina_id),
        ciudad: ciudad.trim() || null,
        capacidad: capacidad ? parseInt(capacidad) : 0,
        direccion: direccion.trim() || null,
        horario_inicio: horario_inicio + ':00',
        horario_fin: horario_fin + ':00',
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setNombre('');
        setDisciplina_id('');
        setCiudad('');
        setCapacidad('');
        setDireccion('');
        setHorario_inicio('08:00');
        setHorario_fin('22:00');
        setEditingId(null);
        setShowForm(false);
        fetchSitios();
      } else {
        setError(data.error || 'Error al guardar el sitio');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar el sitio');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSitio = (sitio: Sitio) => {
    setNombre(sitio.nombre);
    setDisciplina_id(sitio.disciplina_id.toString());
    setCiudad(sitio.ciudad);
    setCapacidad(sitio.capacidad.toString());
    setDireccion(sitio.direccion);
    setHorario_inicio(sitio.horario_inicio);
    setHorario_fin(sitio.horario_fin);
    setEditingId(sitio.id);
    setShowForm(true);
    setError('');
  };

  const handleDeleteSitio = async (id: number) => {
    setDeleteLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/sitios?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteConfirmId(null);
        fetchSitios();
      } else {
        setError(data.error || 'Error al eliminar el sitio');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar el sitio');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Sitios</h2>
        <div className="flex gap-4 items-center flex-wrap">
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
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setNombre('');
              setDisciplina_id('');
              setCiudad('');
              setCapacidad('');
              setDireccion('');
              setHorario_inicio('08:00');
              setHorario_fin('22:00');
              setError('');
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            + Crear Sitio
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Sitio' : 'Crear Nuevo Sitio'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre del Sitio
              </label>
              <input
                type="text"
                placeholder="Ej: Cancha A"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Disciplina
              </label>
              <select
                value={disciplina_id}
                onChange={(e) => setDisciplina_id(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Selecciona una disciplina</option>
                {disciplinas.map((disciplina) => (
                  <option key={disciplina.id} value={disciplina.id}>
                    {disciplina.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                placeholder="Ej: Buenos Aires"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Capacidad (personas)
              </label>
              <input
                type="number"
                placeholder="Ej: 200"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Horario de Atención Inicio
                </label>
                <input
                  type="time"
                  value={horario_inicio}
                  onChange={(e) => setHorario_inicio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Horario de Atención Fin
                </label>
                <input
                  type="time"
                  value={horario_fin}
                  onChange={(e) => setHorario_fin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                placeholder="Ej: Calle Principal 123"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddSitio}
                disabled={formLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {formLoading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setNombre('');
                  setDisciplina_id('');
                  setCiudad('');
                  setCapacidad('');
                  setDireccion('');
                  setHorario_inicio('08:00');
                  setHorario_fin('22:00');
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

      {loading ? (
        <div className="text-center text-slate-600 py-8">Cargando sitios...</div>
      ) : sitios.length === 0 ? (
        <div className="text-center text-slate-600 py-8">No hay sitios creados</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sitios.map((sitio) => (
            <Card key={sitio.id}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{sitio.nombre}</h3>
                <p className="text-sm text-blue-600 font-semibold mb-3">
                  {sitio.disciplina_nombre}
                </p>
                <div className="space-y-2 text-sm text-slate-700 mb-4">
                  <p>
                    <span className="font-semibold">Ciudad:</span> {sitio.ciudad}
                  </p>
                  <p>
                    <span className="font-semibold">Capacidad:</span> {sitio.capacidad} personas
                  </p>
                  <p>
                    <span className="font-semibold">Dirección:</span> {sitio.direccion}
                  </p>
                  <p>
                    <span className="font-semibold">Horario:</span> {sitio.horario_inicio} - {sitio.horario_fin}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditSitio(sitio)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-8 text-xs"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirmId(sitio.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 h-8 text-xs"
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-red-600">Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                ¿Estás seguro de que deseas eliminar el sitio{' '}
                <strong>{sitios.find((s) => s.id === deleteConfirmId)?.nombre}</strong>?
              </p>
              <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteSitio(deleteConfirmId)}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                </Button>
                <Button
                  onClick={() => setDeleteConfirmId(null)}
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
    </div>
  );
}
