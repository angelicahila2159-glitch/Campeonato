'use client';

import { useState, useEffect } from 'react';
import { useChampionship, Equipo } from '@/lib/championship-context';

interface EquipoFormProps {
  equipoId: string | null;
  onSuccess: () => void;
}

export function EquipoForm({ equipoId, onSuccess }: EquipoFormProps) {
  const { addEquipo, editEquipo, getEquipoById } = useChampionship();
  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: '',
    entrenador: '',
  });

  useEffect(() => {
    if (equipoId) {
      const equipo = getEquipoById(equipoId);
      if (equipo) {
        setFormData({
          nombre: equipo.nombre,
          ciudad: equipo.ciudad,
          entrenador: equipo.entrenador,
        });
      }
    }
  }, [equipoId, getEquipoById]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equipoId) {
      editEquipo(equipoId, formData);
    } else {
      addEquipo(formData);
    }
    setFormData({ nombre: '', ciudad: '', entrenador: '' });
    onSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600"
    >
      <h3 className="text-xl font-bold text-slate-900 mb-4">
        {equipoId ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Nombre del Equipo *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: River Plate"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Ciudad *
          </label>
          <input
            type="text"
            value={formData.ciudad}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Buenos Aires"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Entrenador *
          </label>
          <input
            type="text"
            value={formData.entrenador}
            onChange={(e) => setFormData({ ...formData, entrenador: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Marcelo Gallardo"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {equipoId ? 'Guardar Cambios' : 'Crear Equipo'}
      </button>
    </form>
  );
}
