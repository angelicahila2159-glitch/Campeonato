'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DisciplinasSection() {
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchDisciplinas();
  }, []);

  const handleAddDisciplina = async () => {
    if (!nombre.trim()) {
      setError('El nombre de la disciplina es requerido');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setNombre('');
        setShowForm(false);
        fetchDisciplinas();
      } else {
        setError(data.error || 'Error al crear la disciplina');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la disciplina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Disciplinas</h2>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          + Nueva Disciplina
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
            <CardTitle>Crear Nueva Disciplina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Nombre de la disciplina"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddDisciplina}
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
          <CardTitle>Disciplinas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {disciplinas.length === 0 ? (
            <p className="text-slate-500">No hay disciplinas creadas</p>
          ) : (
            <ul className="space-y-2">
              {disciplinas.map((d: any) => (
                <li key={d.id} className="p-3 bg-slate-50 rounded-lg">
                  {d.nombre}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
