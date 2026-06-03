'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Docente, Entrega } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, BookOpen, FileText, CheckCircle, AlertTriangle, 
  ArrowDownToLine, Users, HelpCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { invalid, validateGrade } from '@/lib/validation';
import { useValidationModal } from '@/components/ui/validation-modal';

export default function CalificarPage() {
  const { user } = useAuth();
  const { 
    getCursosByDocente, getMatriculasByCurso, getNotasByMatricula, 
    getTareasByCurso, getEntregasByTarea, appState, updateNota, addNota, updateEntrega 
  } = useAppData();
  const { showValidation, validationModal } = useValidationModal();
  
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [editingNota, setEditingNota] = useState<{matriculaId: string, tipo: string, nota?: any} | null>(null);
  const [newCalificacion, setNewCalificacion] = useState<string>('');

  const [editingEntrega, setEditingEntrega] = useState<Entrega | null>(null);
  const [newCalificacionTarea, setNewCalificacionTarea] = useState<string>('');

  const docente = user as Docente | null;
  const cursos = docente ? getCursosByDocente(docente.id) : [];

  const getEstudianteById = (id: string) => {
    return appState.usuarios.find(u => u.id === id);
  };

  const selectedCursoData = cursos.find(c => c.id === selectedCurso);
  const matriculas = selectedCurso ? getMatriculasByCurso(selectedCurso) : [];

  const handleSaveNota = () => {
    if (showValidation(validateGrade(newCalificacion))) return;

    if (!newCalificacion || isNaN(parseFloat(newCalificacion))) {
      toast.error('Ingresa una calificación válida');
      return;
    }

    const calif = parseFloat(newCalificacion);
    if (calif < 1 || calif > 20) {
      toast.error('La calificación debe estar entre 1 y 20');
      return;
    }

    if (!editingNota) {
      showValidation(invalid('No se encontró la nota', ['Vuelve a seleccionar la evaluación que quieres calificar.']));
      return;
    }

    if (editingNota.nota) {
      updateNota(editingNota.nota.id, { calificacion: calif });
    } else {
      addNota({
        id: `nota-${Date.now()}`,
        matricula_id: editingNota.matriculaId,
        tipo: editingNota.tipo as any,
        calificacion: calif,
        peso: editingNota.tipo === 'parcial' ? 20 : editingNota.tipo === 'final' ? 30 : 0,
        fecha: new Date().toISOString().split('T')[0]
      });
    }

    toast.success('Calificación actualizada');
    setEditingNota(null);
    setNewCalificacion('');
  };

  const handleSaveEntrega = () => {
    if (showValidation(validateGrade(newCalificacionTarea, 20))) return;

    if (!newCalificacionTarea || isNaN(parseFloat(newCalificacionTarea))) {
      toast.error('Ingresa una calificación válida');
      return;
    }
    const calif = parseFloat(newCalificacionTarea);
    if (calif < 1 || calif > 20) {
      toast.error('La calificación debe estar entre 1 y 20');
      return;
    }
    if (!editingEntrega) return;
    
    updateEntrega(editingEntrega.id, { calificacion: calif });
    toast.success('Entrega calificada');
    setEditingEntrega(null);
    setNewCalificacionTarea('');
  };

  // Determinar color de la celda de calificación
  const getNotaBadgeClass = (calificacion: number | undefined | null) => {
    if (calificacion === undefined || calificacion === null) {
      return 'border-2 border-dashed border-slate-200 text-slate-350 hover:bg-slate-50';
    }
    if (calificacion >= 11.5) {
      return 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100/70';
    }
    return 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/70';
  };

  // Iniciales del estudiante para avatar
  const getInitials = (nombre = '', apellido = '') => {
    return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase();
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Calificar Estudiantes
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200/50 py-0.5 px-2 rounded-full text-xs font-semibold">
                Registro de Actas
              </Badge>
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Ingresa y actualiza las notas generales, prácticas y entregas de tareas del aula activa.
            </p>
          </div>
        </div>

        {/* Visual Course Selector Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selecciona el Aula/Asignatura</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cursos.map(curso => {
              const isActive = selectedCurso === curso.id;
              const matriculadosCount = getMatriculasByCurso(curso.id).length;
              return (
                <div 
                  key={curso.id}
                  onClick={() => setSelectedCurso(curso.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between h-28 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/30' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="truncate">
                    <h3 className={`font-bold text-sm truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                      {curso.nombre}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{curso.codigo} • Ciclo {curso.ciclo}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 shrink-0">
                    <Badge variant="outline" className={`text-[9px] font-black ${isActive ? 'bg-blue-100 text-blue-700 border-none' : 'bg-white'}`}>
                      {curso.modalidad === 'presencial' ? '🏢 Presencial' : '💻 Virtual'}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3" /> {matriculadosCount} alumnos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel and Tabs */}
        {selectedCurso ? (
          <Tabs defaultValue="notas" className="w-full space-y-6">
            <TabsList className="bg-slate-100 p-1 rounded-xl flex w-full max-w-md border border-slate-200/40">
              <TabsTrigger value="notas" className="flex-1 rounded-lg text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Promedios y Notas Gen.
              </TabsTrigger>
              <TabsTrigger value="tareas" className="flex-1 rounded-lg text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Entregas de Tareas
              </TabsTrigger>
            </TabsList>
            
            {/* Tab 1: Grades and Weighted Averages */}
            <TabsContent value="notas" className="outline-none">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-850">Boleta de Calificaciones</CardTitle>
                  <CardDescription>Haz clic en cualquier celda para ingresar o editar la calificación del estudiante (escala 1 a 20).</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    {matriculas.length === 0 ? (
                      <p className="text-slate-450 text-xs py-4">No hay estudiantes matriculados en este curso.</p>
                    ) : (
                      matriculas.map(mat => {
                        const estudiante = getEstudianteById(mat.estudiante_id);
                        const notas = getNotasByMatricula(mat.id);

                        return (
                          <div key={mat.id} className="border border-slate-100 rounded-xl p-4 space-y-3.5 hover:shadow-sm hover:border-slate-200/80 transition-all duration-200">
                            {/* Student Profile Row */}
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black select-none border border-slate-200">
                                {getInitials(estudiante?.nombre, estudiante?.apellido)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {estudiante?.nombre} {estudiante?.apellido}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Código Estudiante: {(estudiante as any)?.codigo}</p>
                              </div>
                            </div>

                            {/* Evaluation Grid Cells */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                              {['PC1', 'PC2', 'PC3', 'parcial', 'final'].map(tipo => {
                                const nota = notas.find(n => n.tipo === tipo);
                                const hasNota = nota && nota.calificacion !== null && nota.calificacion !== undefined;
                                return (
                                  <Dialog key={tipo} open={editingNota?.matriculaId === mat.id && editingNota?.tipo === tipo} onOpenChange={(open) => {
                                    if (!open) setEditingNota(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <div
                                        className={`p-2.5 rounded-lg text-center cursor-pointer transition-all duration-200 select-none ${getNotaBadgeClass(nota?.calificacion)}`}
                                        onClick={() => {
                                          setEditingNota({ matriculaId: mat.id, tipo, nota });
                                          setNewCalificacion(nota?.calificacion?.toString() || '');
                                        }}
                                      >
                                        <p className="text-[9px] uppercase font-extrabold tracking-wider opacity-60">{tipo}</p>
                                        <p className="text-xl font-black mt-0.5">
                                          {hasNota ? (nota as any).calificacion : '—'}
                                        </p>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                                          <Award className="h-5 w-5 text-blue-600" />
                                          Calificar {tipo}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs">
                                          Ingresa la calificación de **{estudiante?.nombre} {estudiante?.apellido}** para la evaluación **{tipo.toUpperCase()}**.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 pt-2">
                                        <div className="space-y-1">
                                          <label className="text-xs font-bold text-slate-500">Calificación (Escala 1 - 20)</label>
                                          <Input
                                            type="number"
                                            min="1"
                                            max="20"
                                            step="0.5"
                                            placeholder="Ej. 16.5"
                                            value={newCalificacion}
                                            onChange={(e) => setNewCalificacion(e.target.value)}
                                            className="mt-1"
                                          />
                                          <p className="text-[10px] text-slate-400 font-semibold mt-1">El valor mínimo aprobatorio es 11.5.</p>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                          <Button variant="outline" size="sm" onClick={() => setEditingNota(null)}>
                                            Cancelar
                                          </Button>
                                          <Button onClick={handleSaveNota} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                            Guardar Calificación
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                );
                              })}
                            </div>

                            {/* Aggregated Final Grade Summary */}
                            {(() => {
                              const tareas = getTareasByCurso(selectedCurso);
                              const entregasEstudiante = appState.entregas.filter(e => e.estudiante_id === mat.estudiante_id);
                              const entregasDeTareas = entregasEstudiante.filter(e => tareas.some(t => t.id === e.tarea_id) && e.calificacion !== null && e.calificacion > 0);
                              const puntajeObtenido = entregasDeTareas.reduce((sum, e) => sum + (e.calificacion || 0), 0);
                              const puntajePosible = entregasDeTareas.reduce((sum, e) => {
                                const t = tareas.find(t => t.id === e.tarea_id);
                                return sum + (t ? t.puntaje_total : 0);
                              }, 0);
                              const promedioTareas = puntajePosible > 0 ? (puntajeObtenido / puntajePosible) * 20 : 0;

                              const pcs = notas.filter(n => ['PC1', 'PC2', 'PC3'].includes(n.tipo));
                              const sumaPCs = pcs.reduce((sum, n) => sum + n.calificacion, 0);
                              const promedioPCs = pcs.length > 0 ? sumaPCs / pcs.length : 0;

                              const parcial = notas.find(n => n.tipo === 'parcial')?.calificacion || 0;
                              const final = notas.find(n => n.tipo === 'final')?.calificacion || 0;

                              const promedioFinal = (promedioTareas * 0.20) + (promedioPCs * 0.30) + (parcial * 0.20) + (final * 0.30);
                              const aprobado = promedioFinal >= 11.5;

                              return (
                                <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl justify-between">
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                                    <span>Tareas: <strong className="text-slate-800 font-extrabold">{promedioTareas.toFixed(1)}</strong></span>
                                    <span className="text-slate-200 hidden sm:inline">|</span>
                                    <span>PCs: <strong className="text-slate-800 font-extrabold">{promedioPCs.toFixed(1)}</strong></span>
                                    <span className="text-slate-200 hidden sm:inline">|</span>
                                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200/50 hover:bg-blue-50 py-0.5 px-2 font-black rounded-md">
                                      Promedio Final: {promedioFinal.toFixed(1)}
                                    </Badge>
                                  </div>
                                  {promedioFinal > 0 ? (
                                    <Badge className={aprobado ? "bg-green-50 text-green-700 border border-green-200/50 font-black rounded-full text-[9px] px-2.5 py-0.5 w-fit" : "bg-rose-50 text-rose-700 border-rose-200/50 font-black rounded-full text-[9px] px-2.5 py-0.5 w-fit"}>
                                      {aprobado ? "Aprobado" : "Desaprobado"}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-100 text-slate-400 font-black rounded-full text-[9px] px-2.5 py-0.5 w-fit">
                                      Pendiente notas
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Task Submission review */}
            <TabsContent value="tareas" className="outline-none">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-850">Entregas de Alumnos</CardTitle>
                  <CardDescription>Revisa, descarga los materiales entregados y califica las asignaciones del curso.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-6">
                    {getTareasByCurso(selectedCurso).length === 0 ? (
                      <p className="text-slate-450 text-xs py-4 text-center">No hay tareas programadas para este curso.</p>
                    ) : (
                      getTareasByCurso(selectedCurso).map(tarea => {
                        const entregas = getEntregasByTarea(tarea.id);
                        return (
                          <div key={tarea.id} className="border border-slate-100 rounded-xl p-4 space-y-4">
                            <div>
                              <h3 className="font-extrabold text-slate-800 text-base">{tarea.titulo}</h3>
                              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                                Puntaje Máximo: {tarea.puntaje_total} pts • Entregados: {entregas.length} alumnos
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              {entregas.length === 0 ? (
                                <p className="text-[11px] text-slate-400 font-semibold py-2">Ningún estudiante ha subido esta entrega aún.</p>
                              ) : (
                                entregas.map(entrega => {
                                  const estudiante = getEstudianteById(entrega.estudiante_id);
                                  const hasNota = entrega.calificacion !== null && entrega.calificacion > 0;
                                  return (
                                    <div key={entrega.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl gap-4 hover:border-slate-200 transition-colors duration-200">
                                      <div className="space-y-1">
                                        <p className="font-bold text-slate-800 text-xs">{estudiante?.nombre} {estudiante?.apellido}</p>
                                        <a href={entrega.archivo} download={estudiante?.nombre + "_" + tarea.titulo} className="text-blue-600 hover:text-blue-700 hover:underline text-[10px] font-bold flex items-center gap-1 mt-1">
                                          <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" /> Descargar Archivo Entregado
                                        </a>
                                        {entrega.comentarios && (
                                          <p className="text-[10px] text-slate-500 mt-2 bg-white px-2 py-1 rounded border border-slate-100 italic">
                                            "{entrega.comentarios}"
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex sm:flex-col items-start sm:items-end justify-between gap-3 shrink-0">
                                        {hasNota ? (
                                          <Badge className="bg-green-50 text-green-700 border border-green-200/50 font-black rounded-md text-[10px] px-2 py-0.5">
                                            Calificada: {entrega.calificacion} / {tarea.puntaje_total}
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200/50 font-black rounded-md text-[10px] px-2 py-0.5 animate-pulse">
                                            Pendiente de revisión
                                          </Badge>
                                        )}
                                        
                                        <Dialog open={editingEntrega?.id === entrega.id} onOpenChange={(open) => {
                                          if (!open) setEditingEntrega(null);
                                        }}>
                                          <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="text-[10px] font-black py-1 h-7" onClick={() => {
                                              setEditingEntrega(entrega);
                                              setNewCalificacionTarea(hasNota ? (entrega.calificacion as any).toString() : '');
                                            }}>
                                              {hasNota ? 'Cambiar Nota' : 'Calificar'}
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                Calificar Asignación
                                              </DialogTitle>
                                              <DialogDescription className="text-xs">
                                                Tarea: **{tarea.titulo}** • Estudiante: **{estudiante?.nombre} {estudiante?.apellido}**
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 pt-2">
                                              <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500">Calificación asignada (Escala 1 a 20)</label>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  max="20"
                                                  step="1"
                                                  placeholder="Ej. 18"
                                                  value={newCalificacionTarea}
                                                  onChange={(e) => setNewCalificacionTarea(e.target.value)}
                                                  className="mt-1"
                                                />
                                                <p className="text-[10px] text-slate-400 font-semibold mt-1">El valor ingresado debe estar en el rango de 1 a 20.</p>
                                              </div>
                                              <div className="flex gap-3 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => setEditingEntrega(null)}>
                                                  Cancelar
                                                </Button>
                                                <Button onClick={handleSaveEntrega} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                                  Guardar Nota
                                                </Button>
                                              </div>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-8 text-center text-slate-400">
              <HelpCircle className="h-10 w-10 mx-auto text-slate-350 mb-2" />
              <p className="text-sm font-semibold">Elige una de tus asignaturas en la cuadrícula de arriba para gestionar las notas.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {validationModal}
    </MainLayout>
  );
}
