'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Estudiante, Entrega } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { invalid, validateDelivery } from '@/lib/validation';
import { useValidationModal } from '@/components/ui/validation-modal';

export default function TareasPage() {
  const { user } = useAuth();
  const { getMatriculasByEstudiante, getTareasByCurso, getCursoById, getEntregasByEstudiante, addEntrega } = useAppData();
  const { showValidation, validationModal } = useValidationModal();
  
  const [selectedTarea, setSelectedTarea] = useState<string | null>(null);
  const [entregaData, setEntregaData] = useState({ archivo: '', comentarios: '', nombre_archivo: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showValidation(invalid('Archivo demasiado grande', ['La entrega no debe superar los 5 MB en esta demo local.']));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEntregaData({ ...entregaData, archivo: reader.result as string, nombre_archivo: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const estudiante = user as Estudiante | null;
  const matriculas = estudiante ? getMatriculasByEstudiante(estudiante.id) : [];
  const entregas = estudiante ? getEntregasByEstudiante(estudiante.id) : [];

  const handleEntregar = () => {
    if (showValidation(validateDelivery(entregaData.archivo, entregaData.comentarios))) return;
    if (!selectedTarea || !estudiante) return;

    const newEntrega: Entrega = {
      id: `entrega-${Date.now()}`,
      tarea_id: selectedTarea,
      estudiante_id: estudiante.id,
      archivo: entregaData.archivo,
      fecha_entrega: new Date().toISOString().split('T')[0],
      calificacion: null,
      comentarios: entregaData.comentarios,
    };
    addEntrega(newEntrega);
    toast.success('Tarea entregada exitosamente');
    setSelectedTarea(null);
    setEntregaData({ archivo: '', comentarios: '', nombre_archivo: '' });
  };

  const tareasPorCurso = matriculas.flatMap(mat => {
    const tareas = getTareasByCurso(mat.curso_id);
    return tareas.map(tarea => ({
      ...tarea,
      curso: getCursoById(mat.curso_id),
      entrega: entregas.find(e => e.tarea_id === tarea.id),
    }));
  });

  const isEntregada = (tareaId: string) => entregas.some(e => e.tarea_id === tareaId);
  const getEstadoEntrega = (tareaId: string) => {
    const entrega = entregas.find(e => e.tarea_id === tareaId);
    if (!entrega) return null;
    return (entrega.calificacion !== null && entrega.calificacion > 0) ? 'calificada' : 'pendiente';
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Tareas</h1>
          <p className="text-gray-500 mt-1">Tareas de tus cursos matriculados</p>
        </div>

        <div className="space-y-4">
          {tareasPorCurso.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No hay tareas disponibles</p>
              </CardContent>
            </Card>
          ) : (
            tareasPorCurso.map(tarea => (
              <Card key={tarea.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{tarea.titulo}</CardTitle>
                      <CardDescription>{tarea.curso?.nombre}</CardDescription>
                    </div>
                    {isEntregada(tarea.id) ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Entregada
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{tarea.descripcion}</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Fecha de entrega: <span className="font-medium">{tarea.fecha_entrega}</span>
                      </span>
                    </div>
                    <Badge variant="outline">{tarea.puntaje_total} pts</Badge>
                  </div>
                  {tarea.archivo_referencia && (
                    <a href={tarea.archivo_referencia} download={tarea.titulo + " - Referencia doc"} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                      📎 Descargar material de referencia del docente
                    </a>
                  )}

                  {!tarea.entrega && (
                    <Dialog open={selectedTarea === tarea.id} onOpenChange={(open) => {
                      if (!open) {
                        setSelectedTarea(null);
                        setEntregaData({ archivo: '', comentarios: '', nombre_archivo: '' });
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button className="w-full mt-4 bg-blue-900" onClick={() => setSelectedTarea(tarea.id)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Entregar Tarea
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Entregar Tarea</DialogTitle>
                          <DialogDescription>
                            Sube el enlace de tu documento o archivo para la tarea.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Sube tu Archivo</label>
                            <Input
                              type="file"
                              onChange={handleFileChange}
                              className="mt-1 cursor-pointer"
                            />
                            {entregaData.nombre_archivo && <p className="text-xs text-gray-500 mt-1">Adjunto: {entregaData.nombre_archivo}</p>}
                          </div>
                          <div>
                            <label className="text-sm font-medium">Comentarios (Opcional)</label>
                            <Textarea
                              placeholder="Algún comentario para el profesor..."
                              value={entregaData.comentarios}
                              onChange={(e) => setEntregaData({ ...entregaData, comentarios: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setSelectedTarea(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleEntregar} className="bg-blue-900">
                              Enviar Entrega
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {tarea.entrega && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-blue-900">
                          Estado: {tarea.entrega.calificacion !== null && tarea.entrega.calificacion > 0 ? `Calificada (${tarea.entrega.calificacion}/20)` : 'Pendiente de revisión'}
                        </p>
                        <a href={tarea.entrega.archivo} download={"Entrega - " + tarea.titulo} className="text-xs text-blue-600 hover:underline">
                          📎 Descargar mi entrega
                        </a>
                      </div>
                      {tarea.entrega.comentarios && (
                        <p className="text-sm text-blue-700 mt-2">Tus comentarios: {tarea.entrega.comentarios}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      {validationModal}
    </MainLayout>
  );
}
