'use client';

import { Fecha } from '@/lib/championship-context';
import { useChampionship } from '@/lib/championship-context';

interface FechaListProps {
  fechas: Fecha[];
  onEdit: (id: string) => void;
}

export function FechaList({ fechas, onEdit }: FechaListProps) {
  const { deleteFecha } = useChampionship();

  if (fechas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-5xl mb-4">📅</div>
        <p className="text-slate-600 text-lg">No hay fechas registradas. Crea una para comenzar.</p>
      </div>
    );
  }

  const clasificacion = fechas.filter(f => f.fase === 'Clasificación');
  const eliminacion = fechas.filter(f => f.fase === 'Eliminación');

  return (
    <div className="space-y-8">
      {clasificacion.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-green-700 mb-4">📋 Fechas de Clasificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clasificacion.map(fecha => (
              <FechaCard
                key={fecha.id}
                fecha={fecha}
                onEdit={onEdit}
                onDelete={deleteFecha}
              />
            ))}
          </div>
        </div>
      )}

      {eliminacion.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-red-700 mb-4">🏆 Fechas de Eliminación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eliminacion.map(fecha => (
              <FechaCard
                key={fecha.id}
                fecha={fecha}
                onEdit={onEdit}
                onDelete={deleteFecha}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FechaCard({
  fecha,
  onEdit,
  onDelete,
}: {
  fecha: Fecha;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-bold text-slate-900">Fecha {fecha.numero}</h4>
          <p className="text-sm text-slate-600">{fecha.fase}</p>
        </div>
        <span className="text-2xl">
          {fecha.fase === 'Clasificación' ? '📋' : '🏆'}
        </span>
      </div>

      <div className="mb-4 bg-slate-50 rounded p-3">
        <p className="text-slate-700">
          <span className="font-medium">Período:</span>{' '}
          {formatDate(fecha.fechaInicio)} - {formatDate(fecha.fechaFin)}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(fecha.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
        >
          Editar
        </button>
        <button
          onClick={() => {
            if (window.confirm('¿Estás seguro de que deseas eliminar esta fecha?')) {
              onDelete(fecha.id);
            }
          }}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
