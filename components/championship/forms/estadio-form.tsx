'use client';

import { useState, useEffect } from 'react';
import { useChampionship } from '@/lib/championship-context';

interface EstadioFormProps {
  editingId: string | null;
  onClose: () => void;
}

export function EstadioForm({ editingId, onClose }: EstadioFormProps) {
  const { estadios, addEstadio, editEstadio } = useChampionship();
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingId) {
      const estadio = estadios.find(e => e.id === editingId);
      if (estadio) {
        setNombre(estadio.nombre);
        setCiudad(estadio.ciudad);
        setCapacidad(estadio.capacidad.toString());
        setDireccion(estadio.direccion);
      }
    }
  }, [editingId, estadios]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    if (!capacidad || parseInt(capacidad) <= 0) newErrors.capacidad = 'La capacidad debe ser mayor a 0';
    if (!direccion.trim()) newErrors.direccion = 'La dirección es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingId) {
      editEstadio(editingId, {
        nombre,
        ciudad,
        capacidad: parseInt(capacidad),
        direccion,
      });
    } else {
      addEstadio({
        nombre,
        ciudad,
        capacidad: parseInt(capacidad),
        direccion,
      });
    }

    setNombre('');
    setCiudad('');
    setCapacidad('');
    setDireccion('');
    setErrors({});
    onClose();
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border-2 border-red-300">
      <h3 className="text-xl font-bold text-red-900 mb-4">
        {editingId ? 'Editar Estadio' : 'Crear Nuevo Estadio'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre del Estadio
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Estadio Monumental"
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.nombre ? 'border-red-500' : 'border-red-300 focus:border-red-600'
            }`}
          />
          {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Buenos Aires"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                errors.ciudad ? 'border-red-500' : 'border-red-300 focus:border-red-600'
              }`}
            />
            {errors.ciudad && <p className="text-red-600 text-sm mt-1">{errors.ciudad}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Capacidad
            </label>
            <input
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder="Ej: 50000"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                errors.capacidad ? 'border-red-500' : 'border-red-300 focus:border-red-600'
              }`}
            />
            {errors.capacidad && <p className="text-red-600 text-sm mt-1">{errors.capacidad}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Dirección
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Av. Figueroa Alcorta 7597"
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.direccion ? 'border-red-500' : 'border-red-300 focus:border-red-600'
            }`}
          />
          {errors.direccion && <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {editingId ? 'Guardar Cambios' : 'Crear Estadio'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
