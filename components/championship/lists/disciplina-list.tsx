'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Disciplina {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string;
}

interface DisciplinaListProps {
  refresh?: number;
}

export function DisciplinaList({ refresh }: DisciplinaListProps) {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisciplinas();
  }, [refresh]);

  const fetchDisciplinas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disciplinas');
      const data = await response.json();

      if (data.success) {
        setDisciplinas(data.data || []);
      } else {
        setError('Error al cargar disciplinas');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">Cargando disciplinas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (disciplinas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">
            No hay disciplinas creadas. ¡Crea la primera!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disciplinas Registradas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha de Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disciplinas.map((disciplina) => (
              <TableRow key={disciplina.id}>
                <TableCell className="font-medium">{disciplina.nombre}</TableCell>
                <TableCell>{disciplina.descripcion || '-'}</TableCell>
                <TableCell>
                  {new Date(disciplina.fecha_creacion).toLocaleDateString('es-ES')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
