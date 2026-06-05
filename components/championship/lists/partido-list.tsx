'use client';

import { useState } from 'react';
import { Partido } from '@/lib/championship-context';
import { useChampionship } from '@/lib/championship-context';

interface PartidoListProps {
  partidos: Partido[];
  onEdit: (id: string) => void;
  onRegisterResult: (partido: Partido) => void;
}

export function PartidoList({ partidos, onEdit, onRegisterResult }: PartidoListProps) {
  const { deletePartido, getEquipoById, getFechaById } = useChampionship();
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null);

  if (partidos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-5xl mb-4">🎯</div>
        <p className="text-slate-600 text-lg">No hay partidos registrados. Crea uno para comenzar.</p>
      </div>
    );
  }

  // Agrupar partidos por fecha
  const partidosPorFecha = partidos.reduce((acc: Record<string, Partido[]>, partido) => {
    const fechaId = partido.fechaId || 'sin-fecha';
    if (!acc[fechaId]) acc[fechaId] = [];
    acc[fechaId].push(partido);
    return acc;
  }, {});

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Programado':
        return 'bg-blue-100 text-blue-800';
      case 'En juego':
        return 'bg-yellow-100 text-yellow-800';
      case 'Finalizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(partidosPorFecha).map(([fechaId, partidosDelFecha]) => (
        <div key={fechaId} className="border-2 border-purple-300 rounded-lg overflow-hidden">
          {/* Encabezado de Fecha */}
          <button
            onClick={() => setExpandedFecha(expandedFecha === fechaId ? null : fechaId)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 flex justify-between items-center transition"
          >
            <div className="text-left">
              {fechaId !== 'sin-fecha' && getFechaById(fechaId) ? (
                <h3 className="text-lg font-bold">
                  Fecha {getFechaById(fechaId)?.numero}
                </h3>
              ) : (
                <h3 className="text-lg font-bold">Partidos sin fecha</h3>
              )}
              <p className="text-sm opacity-90">{partidosDelFecha.length} partidos</p>
            </div>
            <span className="text-2xl">{expandedFecha === fechaId ? '▼' : '▶'}</span>
          </button>

          {/* Listado de Partidos */}
          {expandedFecha === fechaId && (
            <div className="space-y-3 p-4 bg-slate-50">
              {partidosDelFecha.map((partido) => (
                <PartidoCard
                  key={partido.id}
                  partido={partido}
                  getEquipoById={getEquipoById}
                  getStatusColor={getStatusColor}
                  onEdit={onEdit}
                  onDelete={deletePartido}
                  onRegisterResult={onRegisterResult}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PartidoCard({
  partido,
  getEquipoById,
  getStatusColor,
  onEdit,
  onDelete,
  onRegisterResult,
}: {
  partido: Partido;
  getEquipoById: (id: string) => any;
  getStatusColor: (estado: string) => string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRegisterResult: (partido: Partido) => void;
}) {
  const equipoLocal = getEquipoById(partido.equipoLocalId);
  const equipoVisitante = getEquipoById(partido.equipoVisitanteId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(partido.estado)}`}>
            {partido.estado}
          </span>
          <span className="text-xs text-slate-600">
            {formatDate(partido.fechaPartido)} - {partido.hora}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {/* Equipo Local */}
        <div className="text-center">
          <h4 className="font-semibold text-slate-900 text-sm">
            {equipoLocal?.nombre || 'Desconocido'}
          </h4>
        </div>

        {/* Resultado */}
        <div className="text-center">
          {partido.estado === 'Finalizado' ? (
            <div className="flex justify-center items-center gap-1">
              <span className="text-2xl font-bold text-slate-900">{partido.golesLocal}</span>
              <span className="text-slate-600">-</span>
              <span className="text-2xl font-bold text-slate-900">{partido.golesVisitante}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-600">vs</p>
          )}
        </div>

        {/* Equipo Visitante */}
        <div className="text-center">
          <h4 className="font-semibold text-slate-900 text-sm">
            {equipoVisitante?.nombre || 'Desconocido'}
          </h4>
        </div>
      </div>

      <div className="flex gap-2">
        {partido.estado !== 'Finalizado' && (
          <button
            onClick={() => onRegisterResult(partido)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded transition text-sm"
          >
            Registrar Resultado
          </button>
        )}
        <button
          onClick={() => onEdit(partido.id)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition text-sm"
        >
          Editar
        </button>
        <button
          onClick={() => {
            if (window.confirm('¿Eliminar este partido?')) {
              onDelete(partido.id);
            }
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition text-sm"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
