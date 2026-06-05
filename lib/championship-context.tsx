'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Disciplina {
  id: number;
  nombre: string;
  activa?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Equipo {
  id: string;
  nombre: string;
  ciudad: string;
  entrenador: string;
}

export interface Estadio {
  id: string;
  nombre: string;
  ciudad: string;
  capacidad: number;
  direccion: string;
}

export interface Fecha {
  id: string;
  numero: number;
  fase: 'Clasificación' | 'Eliminación';
  fechaInicio: string;
  fechaFin: string;
}

export interface Eliminatoria {
  id: string;
  nombre: string;
  numero: number;
  fase: 'Octavos' | 'Cuartos' | 'Semis' | 'Final';
  fechaInicio: string;
  fechaFin: string;
  estado: 'Programada' | 'En curso' | 'Finalizada';
}

export interface Partido {
  id: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  fechaId?: string;
  eliminatoriaId?: string;
  fechaPartido: string;
  hora: string;
  estadioId: string;
  arbitro: string;
  golesLocal: number;
  golesVisitante: number;
  estado: 'Programado' | 'En juego' | 'Finalizado';
}

interface ChampionshipContextType {
  disciplinas: Disciplina[];
  equipos: Equipo[];
  fechas: Fecha[];
  partidos: Partido[];
  estadios: Estadio[];
  eliminatorias: Eliminatoria[];
  
  addEquipo: (equipo: Omit<Equipo, 'id'>) => void;
  editEquipo: (id: string, equipo: Omit<Equipo, 'id'>) => void;
  deleteEquipo: (id: string) => void;
  
  addFecha: (fecha: Omit<Fecha, 'id'>) => void;
  editFecha: (id: string, fecha: Omit<Fecha, 'id'>) => void;
  deleteFecha: (id: string) => void;
  
  addPartido: (partido: Omit<Partido, 'id'>) => void;
  editPartido: (id: string, partido: Omit<Partido, 'id'>) => void;
  deletePartido: (id: string) => void;
  
  addEstadio: (estadio: Omit<Estadio, 'id'>) => void;
  editEstadio: (id: string, estadio: Omit<Estadio, 'id'>) => void;
  deleteEstadio: (id: string) => void;
  
  addEliminatoria: (eliminatoria: Omit<Eliminatoria, 'id'>) => void;
  editEliminatoria: (id: string, eliminatoria: Omit<Eliminatoria, 'id'>) => void;
  deleteEliminatoria: (id: string) => void;
  
  getEquipoById: (id: string) => Equipo | undefined;
  getFechaById: (id: string) => Fecha | undefined;
  getEstadioById: (id: string) => Estadio | undefined;
  getEliminatoriaById: (id: string) => Eliminatoria | undefined;
  getPartidosByFecha: (fechaId: string) => Partido[];
  getPartidosByEliminatoria: (eliminatoriaId: string) => Partido[];
}

const ChampionshipContext = createContext<ChampionshipContextType | undefined>(undefined);

const initialEquipos: Equipo[] = [
  { id: '1', nombre: 'River Plate', ciudad: 'Buenos Aires', entrenador: 'Marcelo Gallardo' },
  { id: '2', nombre: 'Boca Juniors', ciudad: 'Buenos Aires', entrenador: 'Diego Martínez' },
  { id: '3', nombre: 'Independiente', ciudad: 'Avellaneda', entrenador: 'Julio Falcioni' },
  { id: '4', nombre: 'Racing Club', ciudad: 'Avellaneda', entrenador: 'Juan Antonio Pizzi' },
  { id: '5', nombre: 'San Lorenzo', ciudad: 'Buenos Aires', entrenador: 'Javier Mascherano' },
  { id: '6', nombre: 'Vélez Sarsfield', ciudad: 'Liniers', entrenador: 'Fernando Gago' },
];

const initialEstadios: Estadio[] = [
  { id: '1', nombre: 'Monumental de Núñez', ciudad: 'Buenos Aires', capacidad: 84693, direccion: 'Av. Figueroa Alcorta 7597' },
  { id: '2', nombre: 'La Bombonera', ciudad: 'Buenos Aires', capacidad: 54000, direccion: 'Brandsen 805' },
  { id: '3', nombre: 'Estadio Libertadores de América', ciudad: 'Avellaneda', capacidad: 52823, direccion: 'Mitre 1248' },
  { id: '4', nombre: 'Estadio Juan Domingo Perón', ciudad: 'Avellaneda', capacidad: 61799, direccion: 'Chile 1100' },
];

const initialFechas: Fecha[] = [
  { id: '1', numero: 1, fase: 'Clasificación', fechaInicio: '2024-05-01', fechaFin: '2024-05-05' },
  { id: '2', numero: 2, fase: 'Clasificación', fechaInicio: '2024-05-08', fechaFin: '2024-05-12' },
  { id: '3', numero: 3, fase: 'Clasificación', fechaInicio: '2024-05-15', fechaFin: '2024-05-19' },
];

const initialEliminatorias: Eliminatoria[] = [
  { id: '1', nombre: 'Octavos de Final', numero: 1, fase: 'Octavos', fechaInicio: '2024-06-01', fechaFin: '2024-06-05', estado: 'Programada' },
  { id: '2', nombre: 'Cuartos de Final', numero: 2, fase: 'Cuartos', fechaInicio: '2024-06-10', fechaFin: '2024-06-15', estado: 'Programada' },
  { id: '3', nombre: 'Semifinal', numero: 3, fase: 'Semis', fechaInicio: '2024-06-20', fechaFin: '2024-06-25', estado: 'Programada' },
  { id: '4', nombre: 'Final', numero: 4, fase: 'Final', fechaInicio: '2024-07-01', fechaFin: '2024-07-05', estado: 'Programada' },
];

export function ChampionshipProvider({ children }: { children: ReactNode }) {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>(initialEquipos);
  const [fechas, setFechas] = useState<Fecha[]>(initialFechas);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [estadios, setEstadios] = useState<Estadio[]>(initialEstadios);
  const [eliminatorias, setEliminatorias] = useState<Eliminatoria[]>(initialEliminatorias);

  // Cargar disciplinas desde la API
  useEffect(() => {
    const fetchDisciplinas = async () => {
      try {
        const response = await fetch('/api/disciplinas');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setDisciplinas(data.data);
        }
      } catch (error) {
        console.error('Error cargando disciplinas:', error);
      }
    };

    fetchDisciplinas();
  }, []);

  const addEquipo = (equipo: Omit<Equipo, 'id'>) => {
    setEquipos([...equipos, { ...equipo, id: Date.now().toString() }]);
  };

  const editEquipo = (id: string, equipo: Omit<Equipo, 'id'>) => {
    setEquipos(equipos.map(e => (e.id === id ? { ...e, ...equipo } : e)));
  };

  const deleteEquipo = (id: string) => {
    setEquipos(equipos.filter(e => e.id !== id));
  };

  const addFecha = (fecha: Omit<Fecha, 'id'>) => {
    setFechas([...fechas, { ...fecha, id: Date.now().toString() }]);
  };

  const editFecha = (id: string, fecha: Omit<Fecha, 'id'>) => {
    setFechas(fechas.map(f => (f.id === id ? { ...f, ...fecha } : f)));
  };

  const deleteFecha = (id: string) => {
    setFechas(fechas.filter(f => f.id !== id));
  };

  const addPartido = (partido: Omit<Partido, 'id'>) => {
    setPartidos([...partidos, { ...partido, id: Date.now().toString() }]);
  };

  const editPartido = (id: string, partido: Omit<Partido, 'id'>) => {
    setPartidos(partidos.map(p => (p.id === id ? { ...p, ...partido } : p)));
  };

  const deletePartido = (id: string) => {
    setPartidos(partidos.filter(p => p.id !== id));
  };

  const addEstadio = (estadio: Omit<Estadio, 'id'>) => {
    setEstadios([...estadios, { ...estadio, id: Date.now().toString() }]);
  };

  const editEstadio = (id: string, estadio: Omit<Estadio, 'id'>) => {
    setEstadios(estadios.map(e => (e.id === id ? { ...e, ...estadio } : e)));
  };

  const deleteEstadio = (id: string) => {
    setEstadios(estadios.filter(e => e.id !== id));
  };

  const addEliminatoria = (eliminatoria: Omit<Eliminatoria, 'id'>) => {
    setEliminatorias([...eliminatorias, { ...eliminatoria, id: Date.now().toString() }]);
  };

  const editEliminatoria = (id: string, eliminatoria: Omit<Eliminatoria, 'id'>) => {
    setEliminatorias(eliminatorias.map(e => (e.id === id ? { ...e, ...eliminatoria } : e)));
  };

  const deleteEliminatoria = (id: string) => {
    setEliminatorias(eliminatorias.filter(e => e.id !== id));
  };

  const getEquipoById = (id: string) => equipos.find(e => e.id === id);
  const getFechaById = (id: string) => fechas.find(f => f.id === id);
  const getEstadioById = (id: string) => estadios.find(e => e.id === id);
  const getEliminatoriaById = (id: string) => eliminatorias.find(e => e.id === id);
  const getPartidosByFecha = (fechaId: string) => partidos.filter(p => p.fechaId === fechaId);
  const getPartidosByEliminatoria = (eliminatoriaId: string) => partidos.filter(p => p.eliminatoriaId === eliminatoriaId);

  return (
    <ChampionshipContext.Provider
      value={{
        disciplinas,
        equipos,
        fechas,
        partidos,
        estadios,
        eliminatorias,
        addEquipo,
        editEquipo,
        deleteEquipo,
        addFecha,
        editFecha,
        deleteFecha,
        addPartido,
        editPartido,
        deletePartido,
        addEstadio,
        editEstadio,
        deleteEstadio,
        addEliminatoria,
        editEliminatoria,
        deleteEliminatoria,
        getEquipoById,
        getFechaById,
        getEstadioById,
        getEliminatoriaById,
        getPartidosByFecha,
        getPartidosByEliminatoria,
      }}
    >
      {children}
    </ChampionshipContext.Provider>
  );
}

export function useChampionship() {
  const context = useContext(ChampionshipContext);
  if (!context) {
    throw new Error('useChampionship must be used within ChampionshipProvider');
  }
  return context;
}
