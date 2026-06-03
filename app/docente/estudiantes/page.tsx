'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Docente } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, BookOpen, Award, AlertCircle, Percent, ShieldCheck, GraduationCap, ChevronRight 
} from 'lucide-react';

export default function EstudiantesPage() {
  const { user } = useAuth();
  const { getCursosByDocente, getMatriculasByCurso, appState } = useAppData();
  
  const docente = user as Docente;
  const cursos = getCursosByDocente(docente.id);

  const getEstudianteById = (id: string) => {
    return appState.usuarios.find(u => u.id === id);
  };

  const getCourseAverage = (matriculaId: string, cursoId: string, estudianteId: string) => {
    const notas = appState.notas.filter(n => n.matricula_id === matriculaId && n.calificacion > 0);
    const tareas = appState.tareas.filter(t => t.curso_id === cursoId);
    const entregasEstudiante = appState.entregas.filter(
      e => e.estudiante_id === estudianteId && e.calificacion !== null && e.calificacion > 0 && tareas.some(t => t.id === e.tarea_id)
    );

    let puntajeObtenido = 0;
    let puntajePosible = 0;
    entregasEstudiante.forEach(e => {
      puntajeObtenido += e.calificacion || 0;
      const t = tareas.find(t => t.id === e.tarea_id);
      if (t) puntajePosible += t.puntaje_total;
    });
    const promedioTareas = puntajePosible > 0 ? (puntajeObtenido / puntajePosible) * 20 : 0;

    const pcs = notas.filter(n => ['PC1', 'PC2', 'PC3'].includes(n.tipo));
    const promedioPCs = pcs.length > 0 ? (pcs.reduce((s, n) => s + n.calificacion, 0) / pcs.length) : 0;
    const parcial = notas.find(n => n.tipo === 'parcial')?.calificacion || 0;
    const final = notas.find(n => n.tipo === 'final')?.calificacion || 0;

    // Calcular con pesos ponderados si hay notas
    return (promedioTareas * 0.20) + (promedioPCs * 0.30) + (parcial * 0.20) + (final * 0.30);
  };

  // Generador de color HSL único y estable basado en el ID o nombre del estudiante
  const getAvatarStyle = (nombre = '', apellido = '') => {
    const str = `${nombre} ${apellido}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const bg = `hsl(${h}, 75%, 95%)`;
    const fg = `hsl(${h}, 85%, 35%)`;
    return { backgroundColor: bg, color: fg, border: `1.5px solid hsl(${h}, 70%, 85%)` };
  };

  const getInitials = (nombre = '', apellido = '') => {
    return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase();
  };

  // Calcular estadísticas consolidadas de alumnos
  const alumnosGlobales = cursos.flatMap(curso => {
    const matriculas = getMatriculasByCurso(curso.id);
    return matriculas.map(mat => {
      const avg = getCourseAverage(mat.id, curso.id, mat.estudiante_id);
      return { avg, aprobado: avg >= 11.5 };
    });
  });

  const totalAlumnos = alumnosGlobales.length;
  const totalAprobados = alumnosGlobales.filter(a => a.aprobado).length;
  const totalAlertas = alumnosGlobales.filter(a => !a.aprobado && a.avg > 0).length;
  const tasaAprobacion = totalAlumnos > 0 ? Math.round((totalAprobados / totalAlumnos) * 100) : 0;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Mis Estudiantes
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200/50 py-0.5 px-2 rounded-full text-xs font-semibold">
                Docente
              </Badge>
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Listado y control de rendimiento analítico de los alumnos matriculados en tus secciones.
            </p>
          </div>
        </div>

        {/* Global Statistics Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-sm transition-all border-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Alumnos a Cargo</span>
                <div className="text-2xl font-black text-slate-800 mt-0.5">{totalAlumnos}</div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Suma de secciones inscritas</p>
              </div>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-all border-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tasa de Aprobación General</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-850">{tasaAprobacion}</span>
                  <span className="text-xs font-bold text-slate-450">%</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">{"Promedio final acumulado >= 11.5"}</p>
              </div>
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-all border-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alumnos en Alerta</span>
                <div className="text-2xl font-black text-rose-600 mt-0.5">{totalAlertas}</div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{"Promedio final acumulado < 11.5"}</p>
              </div>
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Section List */}
        <div className="space-y-6">
          {cursos.length === 0 ? (
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-8 text-center text-slate-450">
                <GraduationCap className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No tienes cursos académicos asignados este periodo.</p>
              </CardContent>
            </Card>
          ) : (
            cursos.map(curso => {
              const matriculas = getMatriculasByCurso(curso.id);

              return (
                <Card key={curso.id} className="border-slate-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                          <BookOpen className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                          {curso.nombre}
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                          Código: {curso.codigo} • Ciclo Académico {curso.ciclo}
                        </CardDescription>
                      </div>
                      <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-200/50 rounded-full px-2.5 py-0.5 text-[10px] font-black w-fit shrink-0">
                        {matriculas.length} Matriculados
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {matriculas.length === 0 ? (
                      <p className="text-slate-400 text-xs py-2">No hay estudiantes matriculados en esta sección aún.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matriculas.map(mat => {
                          const estudiante = getEstudianteById(mat.estudiante_id);
                          const avg = getCourseAverage(mat.id, curso.id, mat.estudiante_id);
                          const aprobado = avg >= 11.5;
                          const avatarStyle = getAvatarStyle(estudiante?.nombre, estudiante?.apellido);

                          return (
                            <div 
                              key={mat.id} 
                              className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-xl hover:bg-slate-50/30 transition-all group duration-200"
                            >
                              <div className="flex items-center gap-3 truncate pr-2">
                                <div 
                                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-black select-none shrink-0"
                                  style={avatarStyle}
                                >
                                  {getInitials(estudiante?.nombre, estudiante?.apellido)}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                    {estudiante?.nombre} {estudiante?.apellido}
                                  </p>
                                  <p className="text-[10px] text-slate-450 font-semibold mt-0.5 truncate">
                                    Código: {(estudiante as any)?.codigo} • {(estudiante as any)?.carrera || 'General'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <Badge variant="outline" className="text-[9px] font-extrabold text-slate-500 border-slate-200 bg-white select-none">
                                  {(estudiante as any)?.ciclo}° Ciclo
                                </Badge>
                                <div className="text-right flex flex-col justify-center min-w-[70px]">
                                  <span className={`text-xs font-black ${aprobado ? 'text-green-600' : avg > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                    Prom: {avg > 0 ? avg.toFixed(1) : 'N/A'}
                                  </span>
                                  {avg > 0 ? (
                                    <Badge className={aprobado ? "bg-green-50 text-green-700 border-green-200/50 font-extrabold text-[9px] px-1 py-0 border leading-none mt-0.5" : "bg-rose-50 text-rose-700 border-rose-200/50 font-extrabold text-[9px] px-1 py-0 border leading-none mt-0.5"} variant="outline">
                                      {aprobado ? "Aprobado" : "Desaprobado"}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-50 text-slate-400 border-slate-200/50 font-extrabold text-[9px] px-1 py-0 border leading-none mt-0.5" variant="outline">
                                      Sin notas
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}

