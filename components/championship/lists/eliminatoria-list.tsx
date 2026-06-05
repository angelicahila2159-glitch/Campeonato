'use client';

import { useState } from 'react';
import { useChampionship } from '@/lib/championship-context';

export function EliminatoriaList() {
  const { eliminatorias, editEliminatoria } = useChampionship();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fechaInicio: '', fechaFin: '', estado: '' });

  const handleEdit = (id: string) => {
    const elim = eliminatorias.find(e => e.id === id);
    if (elim) {
      setEditingId(id);
      setFormData({
        fechaInicio: elim.fechaInicio,
        fechaFin: elim.fechaFin,
        estado: elim.estado,
      });
    }
  };

  const handleSave = (id: string) => {
    const elim = eliminatorias.find(e => e.id === id);
    if (elim && formData.fechaInicio && formData.fechaFin && formData.estado) {
      editEliminatoria(id, {
        nombre: elim.nombre,
        numero: elim.numero,
        fase: elim.fase,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        estado: formData.estado as any,
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {eliminatorias.map((eliminatoria) => (
        <div
          key={eliminatoria.id}
          className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-purple-900">{eliminatoria.nombre}</h3>
              <p className="text-sm text-purple-700 mt-1">
                Fase: <span className="font-semibold">{eliminatoria.fase}</span>
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full font-semibold text-white text-sm ${
                eliminatoria.estado === 'Programada'
                  ? 'bg-blue-500'
                  : eliminatoria.estado === 'En curso'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
            >
              {eliminatoria.estado}
            </span>
          </div>

          {editingId === eliminatoria.id ? (
            <div className="space-y-4 bg-white p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaInicio: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaFin: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg"
                >
                  <option value="">Seleccionar</option>
                  <option value="Programada">Programada</option>
                  <option value="En curso">En curso</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(eliminatoria.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Inicio</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(eliminatoria.fechaInicio).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Fin</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(eliminatoria.fechaFin).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleEdit(eliminatoria.id)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded-lg transition font-semibold text-sm"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
