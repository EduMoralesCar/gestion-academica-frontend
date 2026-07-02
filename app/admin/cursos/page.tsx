'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Users, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { LISTA_CARRERAS } from '@/lib/constants';

export default function CursosPage() {
  const { appState, addCurso, updateCurso, deleteCurso, addMatricula, removeMatricula } = useAppData();
  
  const [isCursoOpen, setIsCursoOpen] = useState(false);
  const [isMatriculaOpen, setIsMatriculaOpen] = useState(false);
  
  const [editingCursoId, setEditingCursoId] = useState<string | null>(null);
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null);
  const [selectedCarreras, setSelectedCarreras] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showAllCareers, setShowAllCareers] = useState(false);
  const [selectedFilterCarrera, setSelectedFilterCarrera] = useState('');

  const generateCourseCode = (nombre: string, ciclo: string) => {
    if (!nombre) return '';
    const cleanName = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
    
    let initials = '';
    const words = cleanName.split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 2) {
      initials = (words[0].slice(0, 1) + words[1].slice(0, 2)).toUpperCase();
    } else if (cleanName.length > 0) {
      initials = cleanName.slice(0, 3).toUpperCase().padEnd(3, 'X');
    } else {
      initials = 'CUR';
    }

    const prefix = `${initials}-${ciclo}`;
    
    const existingCodes = (appState.cursos || [])
      .filter(c => c.codigo && c.codigo.startsWith(prefix))
      .map(c => {
        const numPart = c.codigo.slice(prefix.length);
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const nextNumber = maxNumber === 0 ? 1 : maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(2, '0');
    return `${prefix}${paddedNumber}`;
  };

  const [cursoData, setCursoData] = useState({
    nombre: '',
    codigo: '',
    docente_id: '',
    creditos: '3',
    ciclo: '1',
    modalidad: ''
  });

  const getDocenteById = (id: string) => {
    return (appState.usuarios || []).find(u => u.id === id);
  };

  const getEstudiantesCurso = (cursoId: string) => {
    return (appState.matriculas || []).filter(m => m.curso_id === cursoId && m.estado === 'activo');
  };

  const handleCursoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoData.nombre || !cursoData.codigo || !cursoData.docente_id) {
      toast.error('Nombre, código y docente son obligatorios');
      return;
    }

    const payload: any = {
      nombre: cursoData.nombre,
      codigo: cursoData.codigo,
      docente_id: cursoData.docente_id,
      creditos: parseInt(cursoData.creditos),
      ciclo: parseInt(cursoData.ciclo),
      modalidad: cursoData.modalidad as 'presencial' | 'virtual',
      carreras: selectedCarreras.join(',')
    };

    if (editingCursoId) {
      updateCurso(editingCursoId, payload);
      toast.success('Curso actualizado con éxito');
    } else {
      addCurso({
        id: `curso-${Date.now()}`,
        ...payload,
        estado: 'activo',
        createdAt: new Date().toISOString()
      });
      toast.success('Curso creado con éxito');
    }

    setIsCursoOpen(false);
    resetCursoForm();
  };

  const resetCursoForm = () => {
    setCursoData({ nombre: '', codigo: '', docente_id: '', creditos: '3', ciclo: '1', modalidad: '' });
    setSelectedCarreras([]);
    setEditingCursoId(null);
  };

  const handleEditCurso = (curso: any) => {
    setCursoData({
      nombre: curso.nombre,
      codigo: curso.codigo,
      docente_id: curso.docente_id,
      creditos: curso.creditos?.toString() || '3',
      ciclo: curso.ciclo?.toString() || '1',
      modalidad: curso.modalidad || 'presencial'
    });
    setSelectedCarreras(curso.carreras ? curso.carreras.split(',') : []);
    setEditingCursoId(curso.id);
    setIsCursoOpen(true);
  };

  const handleDeleteCurso = (id: string) => {
    if(confirm('¿Seguro que deseas eliminar este curso de la currícula?')) {
      deleteCurso(id);
      toast.success('Curso eliminado permanentemente');
    }
  };

  const handleToggleMatricula = (estudianteId: string, isEnrolled: boolean, matriculaId?: string) => {
    if(!selectedCursoId) return;

    if(isEnrolled && matriculaId) {
      removeMatricula(matriculaId);
      toast.success('Estudiante removido del curso');
    } else {
      addMatricula({
        id: `mat-${Date.now()}`,
        estudiante_id: estudianteId,
        curso_id: selectedCursoId,
        fecha_matricula: new Date().toISOString().split('T')[0],
        estado: 'activo'
      });
      toast.success('Estudiante matriculado con éxito');
    }
  };

  const openMatriculaManager = (cursoId: string) => {
    setSelectedCursoId(cursoId);
    setStudentSearch('');
    setSelectedFilterCarrera('');
    setShowAllCareers(false);
    setIsMatriculaOpen(true);
  };

  // Lists for dropdowns
  const docentes = (appState.usuarios || []).filter(u => u.rol === 'DOCENTE');
  const todosLosEstudiantes = (appState.usuarios || []).filter(u => u.rol === 'ESTUDIANTE');

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestionar Cursos</h1>
            <p className="text-gray-500 mt-1">Administra los cursos, asigna docentes y matricula estudiantes</p>
          </div>
          
          <Dialog open={isCursoOpen} onOpenChange={(o) => {
            setIsCursoOpen(o);
            if(!o) resetCursoForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCursoId ? 'Editar Curso' : 'Crear Curso'}</DialogTitle>
                <DialogDescription>Define los parámetros del curso y asígnale un Docente titular.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCursoSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nombre del Curso</label>
                    <Input 
                      required 
                      value={cursoData.nombre} 
                      onChange={e => {
                        const newName = e.target.value;
                        setCursoData(prev => {
                          const updated = { ...prev, nombre: newName };
                          if (!editingCursoId) {
                            updated.codigo = generateCourseCode(newName, prev.ciclo);
                          }
                          return updated;
                        });
                      }} 
                      placeholder="Ej. Matemática Avanzada" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Código</label>
                      <Input 
                        required 
                        value={cursoData.codigo} 
                        onChange={e => setCursoData({...cursoData, codigo: e.target.value})} 
                        placeholder="Ej. MAT-301" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Docente Titular</label>
                      <Select value={cursoData.docente_id} onValueChange={val => setCursoData({...cursoData, docente_id: val})}>
                         <SelectTrigger><SelectValue placeholder="Seleccionar docente" /></SelectTrigger>
                         <SelectContent>
                           {docentes.map(d => (
                             <SelectItem key={d.id} value={d.id}>{d.nombre} {d.apellido}</SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Créditos</label>
                      <Input required type="number" min="1" max="10" value={cursoData.creditos} onChange={e => setCursoData({...cursoData, creditos: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Ciclo</label>
                      <Input 
                        required 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={cursoData.ciclo} 
                        onChange={e => {
                          const newCiclo = e.target.value;
                          setCursoData(prev => {
                            const updated = { ...prev, ciclo: newCiclo };
                            if (!editingCursoId) {
                              updated.codigo = generateCourseCode(prev.nombre, newCiclo);
                            }
                            return updated;
                          });
                        }} 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Modalidad</label>
                      <Select value={cursoData.modalidad} onValueChange={val => setCursoData({...cursoData, modalidad: val})}>
                         <SelectTrigger><SelectValue placeholder="Seleccionar modalidad" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="presencial">Presencial</SelectItem>
                           <SelectItem value="virtual">Virtual</SelectItem>
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Carreras que llevan este curso (Matrícula)</label>
                      <div className="mt-1 border border-slate-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                        {LISTA_CARRERAS.map(c => {
                          const isChecked = selectedCarreras.includes(c);
                          return (
                            <label key={c} className="flex items-center gap-2 text-sm font-normal text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedCarreras(selectedCarreras.filter(x => x !== c));
                                  } else {
                                    setSelectedCarreras([...selectedCarreras, c]);
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-900 focus:ring-blue-500"
                              />
                              {c}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-blue-900">{editingCursoId ? 'Guardar Cambios' : 'Crear Curso'}</Button>
                  </div>
               </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isMatriculaOpen} onOpenChange={setIsMatriculaOpen}>
          <DialogContent className="max-w-4xl w-[95vw] md:w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Gestión de Matrículas</DialogTitle>
              <DialogDescription>
                Habilita o deshabilita a los estudiantes para el curso seleccionado.
              </DialogDescription>
            </DialogHeader>
            
            {/* Curso Selector */}
            <div className="flex flex-col gap-1.5 pb-4 border-b">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Curso Activo</label>
              <select
                value={selectedCursoId || ''}
                onChange={e => {
                  setSelectedCursoId(e.target.value);
                  setSelectedFilterCarrera('');
                }}
                className="w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar curso...</option>
                {(appState.cursos || []).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.codigo}) - Ciclo {c.ciclo}</option>
                ))}
              </select>
            </div>

            {/* Filter controls */}
            <div className="space-y-3 py-3 border-b">
              <Input
                placeholder="Buscar estudiante por nombre o correo..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedFilterCarrera}
                  onChange={e => setSelectedFilterCarrera(e.target.value)}
                  className="flex-1 rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 min-w-0"
                >
                  <option value="">Todas las carreras</option>
                  {(() => {
                    const selectedCursoObj = (appState.cursos || []).find(c => c.id === selectedCursoId);
                    const courseCareers = selectedCursoObj?.carreras ? selectedCursoObj.carreras.split(',') : [];
                    const careersToShow = showAllCareers ? LISTA_CARRERAS : courseCareers;
                    return careersToShow.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ));
                  })()}
                </select>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer whitespace-nowrap bg-slate-50 border border-slate-200 px-4 py-2 rounded-md justify-center h-10 sm:w-auto w-full">
                  <input
                    type="checkbox"
                    checked={showAllCareers}
                    onChange={() => {
                      setShowAllCareers(!showAllCareers);
                      setSelectedFilterCarrera('');
                    }}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 h-4 w-4"
                  />
                  Ver todas las carreras
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden mt-2 border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 w-2/5">Estudiante</th>
                    <th className="px-4 py-3 w-2/5">Carrera</th>
                    <th className="px-4 py-3 text-center w-1/5">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(() => {
                    const selectedCursoObj = (appState.cursos || []).find(c => c.id === selectedCursoId);
                    const courseCareers = selectedCursoObj?.carreras ? selectedCursoObj.carreras.split(',') : [];
                    
                    const filtered = todosLosEstudiantes.filter(est => {
                      const searchMatch = `${est.nombre} ${est.apellido} ${est.email}`.toLowerCase().includes(studentSearch.toLowerCase());
                      
                      let careerMatch = false;
                      if (selectedFilterCarrera) {
                        careerMatch = est.carrera === selectedFilterCarrera;
                      } else {
                        careerMatch = showAllCareers || courseCareers.length === 0 || (est.carrera && courseCareers.includes(est.carrera));
                      }
                      
                      return searchMatch && careerMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                            Ningún estudiante coincide con los filtros
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(est => {
                      const matricula = (appState.matriculas || []).find(m => m.curso_id === selectedCursoId && m.estudiante_id === est.id && m.estado === 'activo');
                      const isEnrolled = !!matricula;

                      return (
                        <tr key={est.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 align-middle">
                            <div className="font-medium text-slate-900">{est.nombre} {est.apellido}</div>
                            <div className="text-xs text-slate-500 font-mono">{est.email}</div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium whitespace-normal break-words max-w-[280px]" title={est.carrera}>
                              {est.carrera || 'No asignada'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                             <Button 
                               variant={isEnrolled ? 'default' : 'outline'}
                               size="sm"
                               className={isEnrolled ? 'bg-green-600 hover:bg-green-700 text-white font-medium border-0 w-32' : 'text-slate-600 font-medium w-32'}
                               onClick={() => handleToggleMatricula(est.id, isEnrolled, matricula?.id)}
                             >
                               {isEnrolled ? 'Matriculado' : 'Añadir al curso'}
                             </Button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsMatriculaOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800">Cerrar Panel</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{(appState.cursos || []).length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Cursos Disponibles
            </CardTitle>
            <CardDescription>Todos los cursos del ciclo actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(appState.cursos || []).map(curso => {
                const docente = getDocenteById(curso.docente_id);
                const estudiantes = getEstudiantesCurso(curso.id);

                return (
                  <div key={curso.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="pl-2">
                        <h3 className="font-bold text-lg text-gray-900">{curso.nombre}</h3>
                        <p className="text-sm font-medium text-blue-600">{curso.codigo}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-gray-50">Ciclo {curso.ciclo}</Badge>
                        <Badge variant="outline" className={curso.modalidad === 'virtual' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700'}>
                          {curso.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pl-2 text-sm border-t pt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Docente</span>
                        <span className="font-medium text-gray-800">{docente ? `${docente.nombre} ${docente.apellido}` : 'Sin asignar'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estudiantes</span>
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <Users className="h-4 w-4 text-blue-600" />
                          {estudiantes.length} alumnos
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openMatriculaManager(curso.id)}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Matricular
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEditCurso(curso)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDeleteCurso(curso.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!appState.cursos || appState.cursos.length === 0) && (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                  No hay cursos en la currícula. Comienza agregando uno nuevo.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
