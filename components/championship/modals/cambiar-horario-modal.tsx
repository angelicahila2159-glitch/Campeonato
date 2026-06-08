'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CambiarHorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nuevoHorario: string) => Promise<void>;
  partido: {
    id: number;
    equipo1_nombre: string;
    equipo2_nombre: string;
    horario_actual: string;
  };
  horariosDisponibles: string[];
  loading: boolean;
}

export function CambiarHorarioModal({
  isOpen,
  onClose,
  onConfirm,
  partido,
  horariosDisponibles,
  loading,
}: CambiarHorarioModalProps) {
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConfirm = async () => {
    if (!horarioSeleccionado) {
      setError('Selecciona un horario');
      return;
    }

    try {
      await onConfirm(horarioSeleccionado);
      setHorarioSeleccionado('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar horario');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Cambiar Horario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900">
              {partido.equipo1_nombre} vs {partido.equipo2_nombre}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Horario actual: <span className="font-semibold">{partido.horario_actual}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nuevo Horario</label>
            <select
              value={horarioSeleccionado}
              onChange={(e) => {
                setHorarioSeleccionado(e.target.value);
                setError('');
              }}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Selecciona un horario --</option>
              {horariosDisponibles.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={!horarioSeleccionado || loading}
            >
              {loading ? 'Guardando...' : 'Cambiar Horario'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
