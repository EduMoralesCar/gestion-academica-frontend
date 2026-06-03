'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Docente, Tarea } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, Edit2, Trash2, BookOpen, Calendar, Clock, Award, 
  Paperclip, ArrowUpRight, HelpCircle, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import { invalid, validateTaskForm } from '@/lib/validation';
import { useValidationModal } from '@/components/ui/validation-modal';

export default function TareasPage() {
  const { user } = useAuth();
  const { getCursosByDocente, getTareasByCurso, addTarea, updateTarea, deleteTarea, getMatriculasByCurso } = useAppData();
  const { showValidation, validationModal } = useValidationModal();
  
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_entrega: '',
    puntaje_total: 10,
    archivo_referencia: '',
    nombre_archivo: '',
  });

  const openEditDialog = (tarea: Tarea) => {
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fecha_entrega: tarea.fecha_entrega,
      puntaje_total: tarea.puntaje_total,
      archivo_referencia: tarea.archivo_referencia || '',
      nombre_archivo: tarea.archivo_referencia ? 'Archivo ya adjunto' : '',
    });
    setEditingTaskId(tarea.id);
    setIsOpen(true);
  };
  
  const handleOpenNew = () => {
    if (!selectedCurso) {
      showValidation(invalid('Selecciona un curso', ['Elige un curso antes de crear una tarea.']));
      return;
    }
    setFormData({ titulo: '', descripcion: '', fecha_entrega: '', puntaje_total: 20, archivo_referencia: '', nombre_archivo: '' });
    setEditingTaskId(null);
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, archivo_referencia: reader.result as string, nombre_archivo: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const docente = user as Docente | null;
  const cursos = docente ? getCursosByDocente(docente.id) : [];

  const selectedCursoData = cursos.find(c => c.id === selectedCurso);
  const tareas = selectedCurso ? getTareasByCurso(selectedCurso) : [];

  const handleSubmit = () => {
    if (showValidation(validateTaskForm(formData, selectedCurso))) return;

    if (editingTaskId) {
      updateTarea(editingTaskId, {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_entrega: formData.fecha_entrega,
        puntaje_total: formData.puntaje_total,
        archivo_referencia: formData.archivo_referencia || undefined,
      });
      toast.success('Tarea actualizada exitosamente');
    } else {
      const newTarea: Tarea = {
        id: `tarea-${Date.now()}`,
        curso_id: selectedCurso,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_entrega: formData.fecha_entrega,
        puntaje_total: formData.puntaje_total,
        archivo_referencia: formData.archivo_referencia || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };

      addTarea(newTarea);
      toast.success('Tarea creada exitosamente');
    }
    
    setFormData({ titulo: '', descripcion: '', fecha_entrega: '', puntaje_total: 20, archivo_referencia: '', nombre_archivo: '' });
    setIsOpen(false);
    setEditingTaskId(null);
  };

  const isFutureDate = (dateStr: string) => {
    return new Date(dateStr).getTime() >= new Date().setHours(0, 0, 0, 0);
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Gestionar Tareas
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200/50 py-0.5 px-2 rounded-full text-xs font-semibold">
                Planificación
              </Badge>
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Crea enunciados de tareas, sube materiales adjuntos de referencia y gestiona plazos de entrega.
            </p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setEditingTaskId(null);
              setFormData({ titulo: '', descripcion: '', fecha_entrega: '', puntaje_total: 20, archivo_referencia: '', nombre_archivo: '' });
            }
          }}>
            {selectedCurso && (
              <Button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4.5 w-4.5" />
                Nueva Tarea
              </Button>
            )}
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {editingTaskId ? 'Editar Tarea' : 'Crear Nueva Tarea'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingTaskId ? 'Modifica los detalles o el plazo de la tarea programada.' : 'Completa los detalles para asignar una nueva tarea al aula activa.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Título de Tarea</label>
                  <Input
                    placeholder="Ej. Práctica Calificada 2, Tarea Académica 1"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Descripción / Instrucciones</label>
                  <Textarea
                    placeholder="Escribe las instrucciones detalladas para el estudiante..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="min-h-[90px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Fecha de Entrega</label>
                    <Input
                      type="date"
                      value={formData.fecha_entrega}
                      onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Puntaje Máximo</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.puntaje_total}
                      onChange={(e) => setFormData({ ...formData, puntaje_total: parseInt(e.target.value) || 20 })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Material de Referencia (Opcional)</label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer text-xs"
                  />
                  {formData.nombre_archivo && (
                    <p className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1.5">
                      <Paperclip className="h-3 w-3" /> Adjunto: {formData.nombre_archivo}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {editingTaskId ? 'Guardar Cambios' : 'Asignar Tarea'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Visual Course Grid Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selecciona el Curso</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cursos.map(curso => {
              const isActive = selectedCurso === curso.id;
              const matriculadosCount = getMatriculasByCurso(curso.id).length;
              const tareasCount = getTareasByCurso(curso.id).length;
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
                      {tareasCount} tareas programadas
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500">
                      {matriculadosCount} alumnos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Course's Tasks Feed */}
        {selectedCurso ? (
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-850 flex items-center gap-1.5">
                  <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                  {selectedCursoData?.nombre}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                  Listado cronológico de evaluaciones y tareas programadas.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {tareas.length === 0 ? (
                  <p className="text-slate-450 text-xs py-4 text-center">No hay tareas programadas para este curso. ¡Crea una nueva con el botón de arriba!</p>
                ) : (
                  tareas.map(tarea => {
                    const isFuture = isFutureDate(tarea.fecha_entrega);
                    return (
                      <div 
                        key={tarea.id} 
                        className="p-4 border border-slate-100 hover:border-slate-200 rounded-xl hover:bg-slate-50/30 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1.5">
                            <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{tarea.titulo}</h3>
                            <p className="text-xs text-slate-550 leading-relaxed max-w-xl">{tarea.descripcion}</p>
                            
                            {tarea.archivo_referencia && (
                              <a 
                                href={tarea.archivo_referencia} 
                                download={tarea.titulo + " - Referencia"} 
                                className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-bold flex items-center gap-1 w-fit select-none"
                              >
                                📎 Descargar Material Adjunto
                              </a>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5">
                              <Badge 
                                className={`text-[9px] font-black rounded-full flex items-center gap-1 select-none px-2.5 py-0.5 border ${
                                  isFuture 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200/50' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200/50'
                                }`}
                              >
                                <Calendar className="h-3 w-3 shrink-0" />
                                {isFuture ? `Límite: ${tarea.fecha_entrega}` : `Vencido: ${tarea.fecha_entrega}`}
                              </Badge>
                              <Badge className="bg-slate-50 hover:bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-black rounded-full flex items-center gap-1 select-none px-2.5 py-0.5">
                                <Award className="h-3 w-3 text-slate-400 shrink-0" />
                                Nota máx: {tarea.puntaje_total} pts
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Actions Menu */}
                          <div className="flex gap-1.5 shrink-0 select-none">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => openEditDialog(tarea)}
                               className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                             >
                               <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => {
                                 if (confirm('¿Seguro que deseas eliminar esta tarea?')) {
                                   deleteTarea(tarea.id);
                                   toast.success('Tarea eliminada');
                                 }
                               }}
                               className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                             >
                               <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                             </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-8 text-center text-slate-400">
              <HelpCircle className="h-10 w-10 mx-auto text-slate-350 mb-2" />
              <p className="text-sm font-semibold">Elige una de tus asignaturas en la cuadrícula de arriba para gestionar las tareas programadas.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {validationModal}
    </MainLayout>
  );
}
