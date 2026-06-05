'use client';

import { useState, useEffect } from 'react';
import { useChampionship, Partido } from '@/lib/championship-context';

interface PartidoFormProps {
  partidoId: string | null;
  onSuccess: () => void;
}

export function PartidoForm({ partidoId, onSuccess }: PartidoFormProps) {
  const { addPartido, editPartido, partidos, equipos, fechas, getEquipoById } = useChampionship();
  const [formData, setFormData] = useState({
    equipoLocalId: '',
    equipoVisitanteId: '',
    fechaId: fechas[0]?.id || '',
    fechaPartido: '',
    hora: '15:00',
    estadio: '',
    arbitro: '',
    golesLocal: 0,
    golesVisitante: 0,
    estado: 'Programado' as const,
  });

  useEffect(() => {
    if (partidoId) {
      const partido = partidos.find(p => p.id === partidoId);
      if (partido) {
        setFormData({
          equipoLocalId: partido.equipoLocalId,
          equipoVisitanteId: partido.equipoVisitanteId,
          fechaId: partido.fechaId,
          fechaPartido: partido.fechaPartido,
          hora: partido.hora,
          estadio: partido.estadio,
          arbitro: partido.arbitro,
          golesLocal: partido.golesLocal,
          golesVisitante: partido.golesVisitante,
          estado: partido.estado,
        });
      }
    }
  }, [partidoId, partidos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.equipoLocalId === formData.equipoVisitanteId) {
      alert('Un equipo no puede jugar contra sí mismo');
      return;
    }
    if (partidoId) {
      editPartido(partidoId, formData);
    } else {
      addPartido(formData);
    }
    setFormData({
      equipoLocalId: '',
      equipoVisitanteId: '',
      fechaId: fechas[0]?.id || '',
      fechaPartido: '',
      hora: '15:00',
      estadio: '',
      arbitro: '',
      golesLocal: 0,
      golesVisitante: 0,
      estado: 'Programado',
    });
    onSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600"
    >
      <h3 className="text-xl font-bold text-slate-900 mb-4">
        {partidoId ? 'Editar Partido' : 'Crear Nuevo Partido'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Fecha *
          </label>
          <select
            value={formData.fechaId}
            onChange={(e) => setFormData({ ...formData, fechaId: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            required
          >
            {fechas.map(fecha => (
              <option key={fecha.id} value={fecha.id}>
                Fecha {fecha.numero} - {fecha.fase}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Estado *
          </label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Programado' | 'En juego' | 'Finalizado' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="Programado">Programado</option>
            <option value="En juego">En juego</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Equipo Local *
          </label>
          <select
            value={formData.equipoLocalId}
            onChange={(e) => setFormData({ ...formData, equipoLocalId: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            required
          >
            <option value="">Selecciona un equipo</option>
            {equipos.map(equipo => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Equipo Visitante *
          </label>
          <select
            value={formData.equipoVisitanteId}
            onChange={(e) => setFormData({ ...formData, equipoVisitanteId: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            required
          >
            <option value="">Selecciona un equipo</option>
            {equipos.map(equipo => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Fecha del Partido *
          </label>
          <input
            type="date"
            value={formData.fechaPartido}
            onChange={(e) => setFormData({ ...formData, fechaPartido: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Hora *
          </label>
          <input
            type="time"
            value={formData.hora}
            onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Goles Locales
          </label>
          <input
            type="number"
            value={formData.golesLocal}
            onChange={(e) => setFormData({ ...formData, golesLocal: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            min="0"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Goles Visitantes
          </label>
          <input
            type="number"
            value={formData.golesVisitante}
            onChange={(e) => setFormData({ ...formData, golesVisitante: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Estadio
          </label>
          <input
            type="text"
            value={formData.estadio}
            onChange={(e) => setFormData({ ...formData, estadio: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Ej: Estadio Monumental"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">
            Árbitro
          </label>
          <input
            type="text"
            value={formData.arbitro}
            onChange={(e) => setFormData({ ...formData, arbitro: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Ej: Fernando Rapallini"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {partidoId ? 'Guardar Cambios' : 'Crear Partido'}
      </button>
    </form>
  );
}
