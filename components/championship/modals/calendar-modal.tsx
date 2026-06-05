'use client';

import { useState } from 'react';
import { useChampionship } from '@/lib/championship-context';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const { fechas, eliminatorias, editFecha, editEliminatoria } = useChampionship();
  const [activeTab, setActiveTab] = useState<'clasificacion' | 'eliminatorias'>('clasificacion');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fechaInicio: '', fechaFin: '' });

  const clasificacionFechas = fechas.filter(f => f.fase === 'Clasificación');
  const eliminacionFechas = fechas.filter(f => f.fase === 'Eliminación');

  const handleEdit = (id: string, inicio: string, fin: string) => {
    setEditingId(id);
    setFormData({ fechaInicio: inicio, fechaFin: fin });
  };

  const handleSave = () => {
    if (editingId && formData.fechaInicio && formData.fechaFin) {
      if (activeTab === 'clasificacion') {
        const fecha = fechas.find(f => f.id === editingId);
        if (fecha) {
          editFecha(editingId, {
            numero: fecha.numero,
            fase: 'Clasificación',
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin,
          });
        }
      } else {
        const elim = eliminatorias.find(e => e.id === editingId);
        if (elim) {
          editEliminatoria(editingId, {
            nombre: elim.nombre,
            numero: elim.numero,
            fase: elim.fase,
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin,
            estado: elim.estado,
          });
        }
      }
      setEditingId(null);
      setFormData({ fechaInicio: '', fechaFin: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Programar Calendario</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('clasificacion')}
              className={`pb-3 px-4 font-semibold transition ${
                activeTab === 'clasificacion'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Fase de Clasificación
            </button>
            <button
              onClick={() => setActiveTab('eliminatorias')}
              className={`pb-3 px-4 font-semibold transition ${
                activeTab === 'eliminatorias'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Fase de Eliminatorias
            </button>
          </div>

          {/* Clasificación */}
          {activeTab === 'clasificacion' && (
            <div className="space-y-4">
              {clasificacionFechas.map((fecha) => (
                <div
                  key={fecha.id}
                  className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-blue-900">Fecha {fecha.numero}</h3>
                      {editingId === fecha.id ? (
                        <div className="mt-3 space-y-2">
                          <input
                            type="date"
                            value={formData.fechaInicio}
                            onChange={(e) =>
                              setFormData({ ...formData, fechaInicio: e.target.value })
                            }
                            className="block w-full px-3 py-2 border border-blue-300 rounded-lg"
                          />
                          <input
                            type="date"
                            value={formData.fechaFin}
                            onChange={(e) =>
                              setFormData({ ...formData, fechaFin: e.target.value })
                            }
                            className="block w-full px-3 py-2 border border-blue-300 rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSave}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-blue-700">
                          <p className="text-sm">
                            Del {new Date(fecha.fechaInicio).toLocaleDateString('es-ES')} al{' '}
                            {new Date(fecha.fechaFin).toLocaleDateString('es-ES')}
                          </p>
                          <button
                            onClick={() =>
                              handleEdit(fecha.id, fecha.fechaInicio, fecha.fechaFin)
                            }
                            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Eliminatorias */}
          {activeTab === 'eliminatorias' && (
            <div className="space-y-4">
              {eliminatorias.map((elim) => (
                <div
                  key={elim.id}
                  className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-purple-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-purple-900">{elim.nombre}</h3>
                      {editingId === elim.id ? (
                        <div className="mt-3 space-y-2">
                          <input
                            type="date"
                            value={formData.fechaInicio}
                            onChange={(e) =>
                              setFormData({ ...formData, fechaInicio: e.target.value })
                            }
                            className="block w-full px-3 py-2 border border-purple-300 rounded-lg"
                          />
                          <input
                            type="date"
                            value={formData.fechaFin}
                            onChange={(e) =>
                              setFormData({ ...formData, fechaFin: e.target.value })
                            }
                            className="block w-full px-3 py-2 border border-purple-300 rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSave}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-purple-700">
                          <p className="text-sm">
                            Del {new Date(elim.fechaInicio).toLocaleDateString('es-ES')} al{' '}
                            {new Date(elim.fechaFin).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-xs mt-1 opacity-75">
                            Estado: {elim.estado}
                          </p>
                          <button
                            onClick={() =>
                              handleEdit(elim.id, elim.fechaInicio, elim.fechaFin)
                            }
                            className="mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition text-sm"
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-4 flex justify-end gap-2 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
