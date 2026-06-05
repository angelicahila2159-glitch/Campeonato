'use client';

import { Equipo } from '@/lib/championship-context';
import { useChampionship } from '@/lib/championship-context';

interface EquipoListProps {
  equipos: Equipo[];
  onEdit: (id: string) => void;
}

export function EquipoList({ equipos, onEdit }: EquipoListProps) {
  const { deleteEquipo } = useChampionship();

  if (equipos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-5xl mb-4">⚽</div>
        <p className="text-slate-600 text-lg">No hay equipos registrados. Crea uno para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {equipos.map(equipo => (
        <div
          key={equipo.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-t-4 border-blue-500"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-2">{equipo.nombre}</h3>
          <div className="space-y-2 mb-4">
            <p className="text-slate-600">
              <span className="font-medium">Ciudad:</span> {equipo.ciudad}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Entrenador:</span> {equipo.entrenador}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(equipo.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
                  deleteEquipo(equipo.id);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
