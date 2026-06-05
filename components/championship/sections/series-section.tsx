'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SeriesSection() {
  const [series, setSeries] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleAddSerie = async () => {
    if (!nombre.trim()) {
      setError('El nombre de la serie es requerido');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setNombre('');
        setShowForm(false);
        fetchSeries();
      } else {
        setError(data.error || 'Error al crear la serie');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la serie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Series</h2>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          + Nueva Serie
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
            <CardTitle>Crear Nueva Serie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Nombre de la serie (ej: Serie A, Liga Profesional)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddSerie}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creando...' : 'Crear'}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
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
          <CardTitle>Series Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="text-slate-500">No hay series creadas</p>
          ) : (
            <ul className="space-y-2">
              {series.map((s: any) => (
                <li key={s.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-indigo-500">
                  <div className="font-semibold text-slate-900">{s.nombre}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
