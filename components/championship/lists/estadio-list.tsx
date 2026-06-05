'use client';

import { useChampionship } from '@/lib/championship-context';

interface EstadioListProps {
  onEdit: (id: string) => void;
}

export function EstadioList({ onEdit }: EstadioListProps) {
  const { estadios, deleteEstadio } = useChampionship();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {estadios.map((estadio) => (
        <div
          key={estadio.id}
          className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4 hover:shadow-lg transition"
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-red-900">{estadio.nombre}</h3>
            <p className="text-sm text-gray-600 mt-1">{estadio.ciudad}</p>
          </div>

          <div className="bg-white rounded-lg p-3 mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad:</span>
              <span className="font-semibold text-gray-800">
                {estadio.capacidad.toLocaleString('es-ES')} personas
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dirección:</span>
              <span className="font-semibold text-gray-800">{estadio.direccion}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(estadio.id)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition text-sm"
            >
              Editar
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar estadio ${estadio.nombre}?`)) {
                  deleteEstadio(estadio.id);
                }
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg transition text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
