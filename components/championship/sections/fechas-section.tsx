'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Fecha {
  id: number;
  nombre: string;
  fecha: string;
  tipo?: string;
  activa: boolean;
}

export function FechasSection() {
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<'Apertura' | 'Clausura'>('Apertura');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para edición
  const [editingFechaId, setEditingFechaId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [editingFecha, setEditingFecha] = useState('');
  const [editingTipo, setEditingTipo] = useState<'Apertura' | 'Clausura'>('Apertura');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Estado para eliminación
  const [deleteConfirmFechaId, setDeleteConfirmFechaId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFechas = async () => {
    try {
      const response = await fetch('/api/fechas');
      const data = await response.json();
      if (data.success) {
        const fechasData = Array.isArray(data.data) ? data.data : [];
        setFechas(fechasData);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setError('Error al cargar fechas');
    }
  };

  useEffect(() => {
    fetchFechas();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleAddFecha = async () => {
    if (!nombre.trim()) {
      setError('El nombre de la fecha es requerido');
      return;
    }

    if (!fecha) {
      setError('La fecha es requerida');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/fechas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          fecha,
          tipo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNombre('');
        setFecha('');
        setTipo('Apertura');
        setShowForm(false);
        fetchFechas();
      } else {
        setError(data.error || 'Error al crear la fecha');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la fecha');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFecha = (f: Fecha) => {
    setEditingFechaId(f.id);
    setEditingNombre(f.nombre);
    setEditingFecha(f.fecha);
    setEditingTipo((f.tipo || 'Apertura') as 'Apertura' | 'Clausura');
    setShowEditModal(true);
  };

  const handleSaveEditFecha = async () => {
    if (!editingNombre.trim()) {
      setError('El nombre de la fecha es requerido');
      return;
    }

    if (!editingFecha) {
      setError('La fecha es requerida');
      return;
    }

    setEditLoading(true);
    setError('');
    try {
      const response = await fetch('/api/fechas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFechaId,
          nombre: editingNombre.trim(),
          fecha: editingFecha,
          tipo: editingTipo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        setEditingFechaId(null);
        fetchFechas();
      } else {
        setError(data.error || 'Error al actualizar la fecha');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar la fecha');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteFecha = async (fechaId: number) => {
    setDeleteLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/fechas?id=${fechaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteConfirmFechaId(null);
        fetchFechas();
      } else {
        setError(data.error || 'Error al eliminar la fecha');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar la fecha');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Fechas</h2>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          + Crear Fecha
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
            <CardTitle>Crear Nueva Fecha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre de la Fecha
              </label>
              <input
                type="text"
                placeholder="Ej: Fecha 1"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tipo de Fecha
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'Apertura' | 'Clausura')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Apertura">Apertura</option>
                <option value="Clausura">Clausura</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddFecha}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creando...' : 'Crear'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setNombre('');
                  setFecha('');
                  setTipo('Apertura');
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
          <CardTitle>📋 Fechas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {fechas.length === 0 ? (
            <p className="text-slate-500">No hay fechas creadas</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fechas.map((f) => (
                <div
                  key={f.id}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-l-4 border-green-500 space-y-3"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{f.nombre}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className={`px-2 py-1 rounded text-white font-semibold text-xs ${
                        f.tipo === 'Apertura' ? 'bg-blue-600' : 'bg-orange-600'
                      }`}>
                        {f.tipo || 'Apertura'}
                      </span>
                    </p>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p>
                      <span className="font-semibold">Fecha:</span> {formatDate(f.fecha)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditFecha(f)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-8 text-xs"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => setDeleteConfirmFechaId(f.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 h-8 text-xs"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmFechaId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-red-600">Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                ¿Estás seguro de que deseas eliminar la fecha{' '}
                <strong>{fechas.find((f) => f.id === deleteConfirmFechaId)?.nombre}</strong>?
              </p>
              <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteFecha(deleteConfirmFechaId)}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                </Button>
                <Button
                  onClick={() => setDeleteConfirmFechaId(null)}
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

      {/* Modal de Edición */}
      {showEditModal && editingFechaId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Editar Fecha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombre de la Fecha
                </label>
                <input
                  type="text"
                  value={editingNombre}
                  onChange={(e) => setEditingNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={editingFecha}
                  onChange={(e) => setEditingFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipo de Fecha
                </label>
                <select
                  value={editingTipo}
                  onChange={(e) => setEditingTipo(e.target.value as 'Apertura' | 'Clausura')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Apertura">Apertura</option>
                  <option value="Clausura">Clausura</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEditFecha}
                  disabled={editLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {editLoading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFechaId(null);
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
    </div>
  );
}
