'use client';

import { useState, useEffect } from 'react';
import { ChampionshipProvider, useChampionship } from '@/lib/championship-context';
import { Header } from './header';
import { DisciplinasSection } from './sections/disciplinas-section';
import { SeriesSection } from './sections/series-section';
import { EquiposSection } from './sections/equipos-section';
import { FechasSection } from './sections/fechas-section';
import { PartidosSection } from './sections/partidos-section';
import { PosicionesSection } from './sections/posiciones-section';
import { EstadiosSection } from './sections/estadios-section';
import { EliminatoriasSectionComponent } from './sections/eliminatorias-section';
import { CalendarModal } from './modals/calendar-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExcelJS from 'exceljs';

type Section = 'dashboard' | 'disciplinas' | 'series' | 'equipos' | 'fechas' | 'partidos' | 'posiciones' | 'estadios' | 'eliminatorias';

interface PartidoDB {
  id: number;
  fecha_id: number;
  fecha_nombre: string;
  fecha: string;
  disciplina_id: number;
  disciplina_nombre: string;
  serie_id: number;
  serie_nombre: string;
  equipo1_id: number;
  equipo1_nombre: string;
  equipo2_id: number;
  equipo2_nombre: string;
  goles_equipo1: number;
  goles_equipo2: number;
  estado: string;
  tipo_competicion: string;
  sitio_nombre?: string;
  horario_inicio?: string;
}

interface Fecha {
  id: number;
  nombre: string;
  fecha: string;
  tipo: string;
  activa: boolean;
}

function DashboardContent() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const { equipos, partidos } = useChampionship();
  
  // Estado para cronograma
  const [cronogramaPartidos, setCronogramaPartidos] = useState<PartidoDB[]>([]);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [filterFecha, setFilterFecha] = useState<string>('');
  const [filterDisciplina, setFilterDisciplina] = useState<string>('');
  const [cronogramaLoading, setCronogramaLoading] = useState(false);

  // Cargar cronograma de actividades
  useEffect(() => {
    const fetchCronograma = async () => {
      setCronogramaLoading(true);
      try {
        // Obtener fechas
        const fechasResponse = await fetch('/api/fechas');
        const fechasData = await fechasResponse.json();
        if (fechasData.success) {
          setFechas(fechasData.data || []);
        }

        // Obtener disciplinas
        const disciplinasResponse = await fetch('/api/disciplinas');
        const disciplinasData = await disciplinasResponse.json();
        if (disciplinasData.success) {
          setDisciplinas(disciplinasData.data || []);
        }

        // Obtener partidos
        const partidosResponse = await fetch('/api/partidos');
        const partidosData = await partidosResponse.json();
        if (partidosData.success) {
          setCronogramaPartidos(partidosData.data || []);
        }
      } catch (error) {
        console.error('Error cargando cronograma:', error);
      } finally {
        setCronogramaLoading(false);
      }
    };

    fetchCronograma();
    
    // Escuchar evento global cuando se guarda un resultado
    window.addEventListener('resultadoGuardado', fetchCronograma);
    
    return () => {
      window.removeEventListener('resultadoGuardado', fetchCronograma);
    };
  }, []);

  // Filtrar partidos
  const filteredPartidos = cronogramaPartidos.filter(p => {
    const matchFecha = !filterFecha || p.fecha_id === parseInt(filterFecha);
    const matchDisciplina = !filterDisciplina || p.disciplina_id === parseInt(filterDisciplina);
    return matchFecha && matchDisciplina;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExportCronogramaToExcel = async () => {
    if (filteredPartidos.length === 0) {
      alert('No hay partidos para exportar');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cronograma');

    // Título
    const titleRow = worksheet.addRow(['🏅 CRONOGRAMA DE OLIMPIADAS DEPORTIVAS']);
    titleRow.getCell(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 16,
      name: 'Calibri',
    };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF8C00' },
    };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'center' };
    worksheet.mergeCells('A1:H1');
    worksheet.getRow(1).height = 30;

    // Fila vacía
    worksheet.addRow([]);

    // Encabezados
    const headerRow = worksheet.addRow(['#', 'Fecha', 'Disciplina', 'Serie', 'Evento', 'Sitio', 'Horario', 'Estado']);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 12,
        name: 'Calibri',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF8C00' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
    });

    // Colores alternados
    const color1 = 'FFE8F4F8'; // Azul claro
    const color2 = 'FFFFF8DC'; // Beige claro

    // Agregar datos
    filteredPartidos.forEach((p, idx) => {
      const rowData = [
        idx + 1,
        formatDate(p.fecha),
        p.disciplina_nombre,
        p.serie_nombre,
        p.tipo_competicion === 'puntos' 
          ? p.equipo1_nombre 
          : `${p.equipo1_nombre} vs ${p.equipo2_nombre}`,
        p.sitio_nombre || '-',
        p.horario_inicio || '-',
        p.estado,
      ];

      const row = worksheet.addRow(rowData);
      const isEven = idx % 2 === 0;
      const bgColor = isEven ? color1 : color2;

      row.eachCell((cell, colNum) => {
        let fillColor = bgColor;
        let fontColor = 'FF333333';
        let isBold = false;

        // Colores especiales para Estado (columna 8)
        if (colNum === 8) {
          if (p.estado === 'Finalizado') {
            fillColor = 'FFC6EFCE';
            fontColor = 'FF006100';
            isBold = true;
          } else if (p.estado === 'En juego') {
            fillColor = 'FFFFEB9C';
            fontColor = 'FF9C6500';
            isBold = true;
          } else if (p.estado === 'Programado') {
            fillColor = 'FFF2F2F2';
            fontColor = 'FF333333';
            isBold = true;
          }
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
        cell.font = {
          bold: isBold,
          color: { argb: fontColor },
          size: 11,
          name: 'Calibri',
        };
        cell.alignment = {
          horizontal: colNum === 1 || colNum === 7 ? 'center' : 'left',
          vertical: 'center',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        };
      });
    });

    // Ancho de columnas
    worksheet.columns = [
      { width: 4 },   // #
      { width: 13 },  // Fecha
      { width: 18 },  // Disciplina
      { width: 12 },  // Serie
      { width: 35 },  // Evento
      { width: 20 },  // Sitio
      { width: 10 },  // Horario
      { width: 15 },  // Estado
    ];

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cronograma_Olimpiadas_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const partidosFinalizados = partidos.filter(p => p.estado === 'Finalizado').length;
  const partidosProgramados = partidos.filter(p => p.estado === 'Programado').length;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Resumen general del campeonato</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
                <p className="text-blue-600 text-sm font-semibold">Equipos</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">{equipos.length}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6">
                <p className="text-green-600 text-sm font-semibold">Partidos Totales</p>
                <p className="text-4xl font-bold text-green-900 mt-2">{partidos.length}</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6">
                <p className="text-yellow-600 text-sm font-semibold">Programados</p>
                <p className="text-4xl font-bold text-yellow-900 mt-2">{partidosProgramados}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-6">
                <p className="text-purple-600 text-sm font-semibold">Finalizados</p>
                <p className="text-4xl font-bold text-purple-900 mt-2">{partidosFinalizados}</p>
              </div>
            </div>

            {/* Cronograma de Actividades */}
            <div className="mt-12">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-900">📅 Cronograma de Actividades</h2>
                    <Button
                      onClick={handleExportCronogramaToExcel}
                      disabled={filteredPartidos.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium disabled:bg-slate-400"
                    >
                      📊 Descargar Excel
                    </Button>
                  </div>

                  {/* Filtros */}
                  <div className="flex gap-4 mb-6 flex-wrap">
                    <select
                      value={filterFecha}
                      onChange={(e) => setFilterFecha(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                    >
                      <option value="">Todas las fechas</option>
                      {fechas.map(fecha => (
                        <option key={fecha.id} value={fecha.id}>
                          {fecha.nombre} - {formatDate(fecha.fecha)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterDisciplina}
                      onChange={(e) => setFilterDisciplina(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                    >
                      <option value="">Todas las disciplinas</option>
                      {disciplinas.map(disc => (
                        <option key={disc.id} value={disc.id}>
                          {disc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tabla de cronograma */}
                  {cronogramaLoading ? (
                    <div className="text-center text-slate-600 py-8">Cargando cronograma...</div>
                  ) : filteredPartidos.length === 0 ? (
                    <div className="text-center text-slate-600 py-8">
                      No hay partidos programados con los filtros seleccionados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-300 bg-slate-50">
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Fecha</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Disciplina</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Serie</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Partido</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Sitio</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Horario</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPartidos.map((partido) => (
                            <tr key={partido.id} className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-900 font-medium">{formatDate(partido.fecha)}</td>
                              <td className="px-4 py-3 text-slate-900">{partido.disciplina_nombre}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium text-xs">
                                  {partido.serie_nombre}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-900">
                                {partido.tipo_competicion === 'puntos' ? (
                                  <div className="font-medium text-center text-blue-600">
                                    {partido.equipo1_nombre}
                                    <div className="text-xs text-slate-600 mt-0.5">Individual</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium">{partido.equipo1_nombre}</div>
                                    <div className="text-slate-500 text-xs">vs</div>
                                    <div className="font-medium">{partido.equipo2_nombre}</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-900 text-sm">{partido.sitio_nombre || '--'}</td>
                              <td className="px-4 py-3 text-slate-900 font-medium text-sm">{partido.horario_inicio || '--'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  partido.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                                  partido.estado === 'En juego' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {partido.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'disciplinas':
        return <DisciplinasSection />;
      case 'series':
        return <SeriesSection />;
      case 'equipos':
        return <EquiposSection />;
      case 'fechas':
        return <FechasSection />;
      case 'partidos':
        return <PartidosSection />;
      case 'posiciones':
        return <PosicionesSection />;
      case 'estadios':
        return <EstadiosSection />;
      case 'eliminatorias':
        return <EliminatoriasSectionComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        onCalendarClick={() => setShowCalendarModal(true)}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {renderContent()}
      </main>

      <CalendarModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />
    </div>
  );
}

export function ChampionshipDashboard() {
  return (
    <ChampionshipProvider>
      <DashboardContent />
    </ChampionshipProvider>
  );
}
