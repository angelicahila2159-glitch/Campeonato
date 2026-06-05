'use client';

import { useState, useEffect } from 'react';
import { useChampionship } from '@/lib/championship-context';

interface FechaFormProps {
  fechaId: string | null;
  onSuccess: () => void;
}

export function FechaForm({ fechaId, onSuccess }: FechaFormProps) {
  const { addFecha, editFecha, getFechaById, fechas } = useChampionship();
  const [formData, setFormData] = useState({
    numero: fechas.length + 1,
    fase: 'Clasificación' as const,
    fechaInicio: '',
    fechaFin: '',
  });

  useEffect(() => {
    if (fechaId) {
      const fecha = getFechaById(fechaId);
      if (fecha) {
        setFormData({
          numero: fecha.numero,
          fase: fecha.fase,
          fechaInicio: fecha.fechaInicio,
          fechaFin: fecha.fechaFin,
        });
      }
    }
  }, [fechaId, getFechaById]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fechaId) {
      editFecha(fechaId, formData);
    } else {
      addFecha(formData);
    }
    setFormData({
      numero: fechas.length + 1,
      fase: 'Clasificación',
      fechaInicio: '',
      fechaFin: '',
    });
    onSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600"
    >
      <h3 className="text-xl font-bold text-slate-900 mb-4">
        {fechaId ? 'Editar Fecha' : 'Crear Nueva Fecha'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Número de Fecha *
          </label>
          <input
            type="number"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Fase *
          </label>
          <select
            value={formData.fase}
            onChange={(e) => setFormData({ ...formData, fase: e.target.value as 'Clasificación' | 'Eliminación' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            required
          >
            <option value="Clasificación">Clasificación</option>
            <option value="Eliminación">Eliminación</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Fecha Inicio *
          </label>
          <input
            type="date"
            value={formData.fechaInicio}
            onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Fecha Fin *
          </label>
          <input
            type="date"
            value={formData.fechaFin}
            onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {fechaId ? 'Guardar Cambios' : 'Crear Fecha'}
      </button>
    </form>
  );
}
