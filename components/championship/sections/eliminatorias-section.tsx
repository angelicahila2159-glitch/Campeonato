'use client';

import { useState } from 'react';
import { useChampionship } from '@/lib/championship-context';
import { EliminatoriaList } from '../lists/eliminatoria-list';

export function EliminatoriasSectionComponent() {
  const { eliminatorias } = useChampionship();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Fase de Eliminatorias</h2>
        <p className="text-gray-600 mb-4">
          Gestiona todas las fases de eliminación del campeonato. Desde octavos de final hasta la gran final.
        </p>
      </div>

      {eliminatorias.length > 0 ? (
        <EliminatoriaList />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No hay eliminatorias configuradas</p>
        </div>
      )}
    </div>
  );
}
