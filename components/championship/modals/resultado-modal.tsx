'use client';

import { useState } from 'react';
import { Partido } from '@/lib/championship-context';
import { useChampionship } from '@/lib/championship-context';

interface ResultadoModalProps {
  isOpen: boolean;
  partido: Partido | null;
  onClose: () => void;
}

export function ResultadoModal({ isOpen, partido, onClose }: ResultadoModalProps) {
  const { editPartido, getEquipoById } = useChampionship();
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [estado, setEstado] = useState<'Programado' | 'En juego' | 'Finalizado'>('Programado');

  if (!isOpen || !partido) return null;

  const equipoLocal = getEquipoById(partido.equipoLocalId);
  const equipoVisitante = getEquipoById(partido.equipoVisitanteId);

  const handleSave = () => {
    if (equipoLocal && equipoVisitante) {
      editPartido(partido.id, {
        equipoLocalId: partido.equipoLocalId,
        equipoVisitanteId: partido.equipoVisitanteId,
        fechaId: partido.fechaId,
        eliminatoriaId: partido.eliminatoriaId,
        fechaPartido: partido.fechaPartido,
        hora: partido.hora,
        estadioId: partido.estadioId,
        arbitro: partido.arbitro,
        golesLocal,
        golesVisitante,
        estado,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Registrar Resultado</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Equipos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Local</p>
                <p className="font-bold text-blue-900">{equipoLocal?.nombre}</p>
              </div>
              <input
                type="number"
                min="0"
                value={golesLocal}
                onChange={(e) => setGolesLocal(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center text-3xl font-bold bg-white border-2 border-blue-300 rounded-lg px-2 py-1"
              />
            </div>

            <div className="text-center text-gray-500 font-semibold">VS</div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <input
                type="number"
                min="0"
                value={golesVisitante}
                onChange={(e) => setGolesVisitante(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center text-3xl font-bold bg-white border-2 border-orange-300 rounded-lg px-2 py-1"
              />
              <div>
                <p className="text-sm text-gray-600">Visitante</p>
                <p className="font-bold text-orange-900">{equipoVisitante?.nombre}</p>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado del Partido
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full px-4 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              <option value="Programado">Programado</option>
              <option value="En juego">En juego</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>

          {/* Info Partido */}
          <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 space-y-1">
            <p>
              <strong>Fecha:</strong> {new Date(partido.fechaPartido).toLocaleDateString('es-ES')}
            </p>
            <p>
              <strong>Hora:</strong> {partido.hora}
            </p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 flex justify-end gap-2 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
          >
            Guardar Resultado
          </button>
        </div>
      </div>
    </div>
  );
}
