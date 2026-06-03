'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Docente, Asistencia } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, XCircle, Clock, Calendar, Users, 
  HelpCircle, ArrowUpRight, Save, ClipboardCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { validateAttendance } from '@/lib/validation';
import { useValidationModal } from '@/components/ui/validation-modal';

export default function AsistenciaPage() {
  const { user } = useAuth();
  const { getCursosByDocente, getMatriculasByCurso, appState, getAsistenciasByCurso, addAsistencia } = useAppData();
  const { showValidation, validationModal } = useValidationModal();
  
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [selectedFecha, setSelectedFecha] = useState(new Date().toISOString().split('T')[0]);
  const [asistencia, setAsistencia] = useState<Record<string, 'presente' | 'ausente' | 'tardanza' | null>>({});

  const docente = user as Docente | null;
  const cursos = docente ? getCursosByDocente(docente.id) : [];

  const getEstudianteById = (id: string) => {
    return appState.usuarios.find(u => u.id === id);
  };

  const selectedCursoData = cursos.find(c => c.id === selectedCurso);
  const matriculas = selectedCurso ? getMatriculasByCurso(selectedCurso) : [];

  const handleGuardarAsistencia = () => {
    const markedCount = Object.values(asistencia).filter(Boolean).length;
    if (showValidation(validateAttendance(selectedCurso, selectedFecha, markedCount))) return;

    let count = 0;
    matriculas.forEach(mat => {
      const estado = asistencia[mat.estudiante_id];
      if (estado) {
        const newAsistencia: Asistencia = {
          id: `asi-${Date.now()}-${count}`,
          curso_id: selectedCurso,
          estudiante_id: mat.estudiante_id,
          fecha: selectedFecha,
          estado,
        };
        addAsistencia(newAsistencia);
        count++;
      }
    });

    if (count > 0) {
      toast.success(`Asistencia registrada para ${count} estudiantes`);
      setAsistencia({});
    } else {
      toast.error('Marca la asistencia de al menos un estudiante');
    }
  };

  // Generador de iniciales del alumno para avatar
  const getInitials = (nombre = '', apellido = '') => {
    return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase();
  };

  // Cantidad de alumnos marcados para la barra de progreso
  const totalAlumnos = matriculas.length;
  const totalMarcados = Object.values(asistencia).filter(Boolean).length;
  const porcentajeMarcado = totalAlumnos > 0 ? Math.round((totalMarcados / totalAlumnos) * 100) : 0;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Registrar Asistencia
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200/50 py-0.5 px-2 rounded-full text-xs font-semibold">
                Control Diario
              </Badge>
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Marca la presencia, tardanza o inasistencia de tus alumnos en el aula correspondiente.
            </p>
          </div>
        </div>

        {/* Visual Course Grid Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selecciona la Asignatura</label>
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

        {/* Configuration Row and Student List */}
        {selectedCurso ? (
          <div className="grid grid-cols-1 gap-6">
            {/* Control Config Bar */}
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha del Registro</p>
                    <input
                      type="date"
                      value={selectedFecha}
                      onChange={(e) => setSelectedFecha(e.target.value)}
                      className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 outline-none w-32 cursor-pointer mt-0.5"
                    />
                  </div>
                </div>
                
                {/* Progress bar marked students */}
                <div className="w-full sm:w-60 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Progreso de Registro</span>
                    <span className="text-slate-700">{totalMarcados} de {totalAlumnos} alumnos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/20">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-550" style={{ width: `${porcentajeMarcado}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student List and Actions */}
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-850 flex items-center gap-1.5">
                    <ClipboardCheck className="h-4.5 w-4.5 text-blue-600" />
                    Listado de Estudiantes
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                    Selecciona el estado de asistencia de cada alumno de la sección.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {matriculas.length === 0 ? (
                  <p className="text-slate-450 text-xs py-4 text-center">No hay alumnos matriculados en esta sección.</p>
                ) : (
                  <div className="space-y-3">
                    {matriculas.map(mat => {
                      const estudiante = getEstudianteById(mat.estudiante_id);
                      const estado = asistencia[mat.estudiante_id];

                      return (
                        <div 
                          key={mat.id} 
                          className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-slate-50/20 transition-all duration-200 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black select-none border border-slate-200">
                              {getInitials(estudiante?.nombre, estudiante?.apellido)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {estudiante?.nombre} {estudiante?.apellido}
                              </p>
                              <p className="text-[10px] text-slate-450 font-semibold mt-0.5 truncate">
                                Código: {(estudiante as any)?.codigo} • {(estudiante as any)?.carrera || 'General'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Sleek Segmented Toggle Group */}
                          <div className="bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50 flex gap-0.5 w-full md:w-auto shrink-0 select-none">
                            <button
                              type="button"
                              onClick={() => setAsistencia({ ...asistencia, [mat.estudiante_id]: 'presente' })}
                              className={`flex-1 md:flex-none text-[10px] font-black px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 ${
                                estado === 'presente' 
                                  ? 'bg-green-600 text-white shadow-sm' 
                                  : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsistencia({ ...asistencia, [mat.estudiante_id]: 'tardanza' })}
                              className={`flex-1 md:flex-none text-[10px] font-black px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 ${
                                estado === 'tardanza' 
                                  ? 'bg-amber-500 text-white shadow-sm' 
                                  : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Tardanza
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsistencia({ ...asistencia, [mat.estudiante_id]: 'ausente' })}
                              className={`flex-1 md:flex-none text-[10px] font-black px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 ${
                                estado === 'ausente' 
                                  ? 'bg-rose-500 text-white shadow-sm' 
                                  : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                              }`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Ausente
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <Button 
                      onClick={handleGuardarAsistencia} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs py-3 mt-6 flex items-center justify-center gap-2 shadow-sm transition-all duration-300"
                    >
                      <Save className="h-4.5 w-4.5" />
                      Guardar Asistencia de la Sección
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-8 text-center text-slate-400">
              <HelpCircle className="h-10 w-10 mx-auto text-slate-350 mb-2" />
              <p className="text-sm font-semibold">Elige una de tus asignaturas en la cuadrícula de arriba para abrir el registro de asistencias.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {validationModal}
    </MainLayout>
  );
}
