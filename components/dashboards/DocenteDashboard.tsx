'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Docente } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, BookOpen, FileText, CheckSquare, TrendingUp, Calendar, AlertTriangle, ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const DocenteDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getCursosByDocente, getMatriculasByCurso, getTareasByCurso, appState } = useAppData();
  
  const docente = user as Docente;
  const cursos = getCursosByDocente(docente.id);
  const tareas = cursos.flatMap(curso => getTareasByCurso(curso.id));
  const entregas = appState.entregas.filter(entrega => tareas.some(t => t.id === entrega.tarea_id));
  const entregasPendientes = entregas.filter(entrega => entrega.calificacion === null).length;
  const entregasTotales = entregas.length;
  const tareasSinEntregas = tareas.filter(tarea => !entregas.some(e => e.tarea_id === tarea.id)).length;
  const promedioGeneral = entregas.length > 0 ? entregas.reduce((sum, e) => sum + (e.calificacion || 0), 0) / entregas.length : 0;
  
  const proximaTarea = tareas
    .filter(t => new Date(t.fecha_entrega).getTime() > Date.now())
    .sort((a, b) => new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime())[0];
    
  const totalEstudiantes = cursos.reduce((acc, curso) => {
    return acc + getMatriculasByCurso(curso.id).length;
  }, 0);

  const totalTareas = cursos.reduce((acc, curso) => {
    return acc + getTareasByCurso(curso.id).length;
  }, 0);

  // Formato de siglas para avatares de curso
  const getSiglasCurso = (nombre: string) => {
    const palabras = nombre.split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  // Datos para la gráfica comparativa de cursos
  const dataCursos = cursos.map(curso => ({
    nombre: curso.nombre.length > 14 ? `${curso.nombre.substring(0, 11)}...` : curso.nombre,
    nombreCompleto: curso.nombre,
    alumnos: getMatriculasByCurso(curso.id).length,
    tareas: getTareasByCurso(curso.id).length
  }));

  // Paleta de colores para los cursos
  const CURSE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Tooltip personalizado para la gráfica de cursos
  const CustomCourseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-3 rounded-xl shadow-lg transition-all duration-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Detalles de Asignatura</p>
          <p className="text-xs font-bold text-slate-800 mb-1">{data.nombreCompleto}</p>
          <div className="space-y-0.5 text-[11px] font-medium text-slate-500">
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Matriculados: <span className="font-extrabold text-slate-900">{data.alumnos} alumnos</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Tareas creadas: <span className="font-extrabold text-slate-900">{data.tareas} unidades</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Bienvenido, Prof. {docente.nombre}
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200/50 py-0.5 px-2 rounded-full text-xs font-semibold">
              Docente Activo
            </Badge>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            {docente.especialidad} • Departamento de {docente.departamento}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Calendar className="h-4 w-4 text-slate-400" />
          Periodo Académico Activo
        </div>
      </div>

      {/* Sleek KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-blue-500 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Cursos Asignados</span>
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 leading-none">{cursos.length}</div>
            <p className="text-[10px] font-medium text-slate-500 mt-2">Asignaturas a dictar este ciclo</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-emerald-500 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Alumnos Totales</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 leading-none">{totalEstudiantes}</div>
            <p className="text-[10px] font-medium text-slate-500 mt-2">Matriculados en tus secciones</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-amber-500 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Tareas Creadas</span>
              <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-amber-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 leading-none">{totalTareas}</div>
            <p className="text-[10px] font-medium text-slate-500 mt-2">Evaluaciones y trabajos asignados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-rose-500 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Pendientes Calificar</span>
              <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-rose-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 leading-none">{entregasPendientes}</div>
            <p className="text-[10px] font-semibold mt-2">
              {entregasPendientes > 0 ? (
                <span className="text-rose-600 flex items-center gap-0.5 animate-pulse">⚠ Entregas por revisar</span>
              ) : (
                <span className="text-green-600">✔ Todo calificado</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Recharts comparative course chart + Analytics details sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Chart) */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
              Estudiantes por Curso
            </CardTitle>
            <CardDescription>Población comparativa de alumnos matriculados en tus asignaturas</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] pb-6 pt-0">
            {cursos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataCursos} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nombre" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomCourseTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="alumnos" name="Matriculados" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {dataCursos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CURSE_COLORS[index % CURSE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No hay cursos asignados.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column (Analytics Details Sidebar) */}
        <Card className="border-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-800">Resumen del Aula</CardTitle>
            <CardDescription>Métricas complementarias del portafolio docente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col space-y-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Promedio General del Aula</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-800">{promedioGeneral > 0 ? promedioGeneral.toFixed(1) : '0.0'}</span>
                  <span className="text-[10px] font-semibold text-slate-400">/ 20</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">Nota acumulada sobre entregas revisadas</p>
              </div>
              <div className="border-t border-slate-200/60 pt-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" /> Próximo Límite de Entrega
                </span>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  {proximaTarea ? proximaTarea.titulo : 'Sin fechas programadas'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {proximaTarea 
                    ? `Límite: ${new Date(proximaTarea.fecha_entrega).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })}` 
                    : 'No hay entregas pendientes próximas'}
                </p>
              </div>
              <div className="border-t border-slate-200/60 pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Entregas</span>
                  <span className="font-extrabold text-slate-700">{entregasTotales} recibidas</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Sin Entregas</span>
                  <span className="font-extrabold text-slate-700">{tareasSinEntregas} tareas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Visual Course Cards List */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800">Secciones y Cursos Asignados</CardTitle>
          <CardDescription>Acceso directo a la administración de cada asignatura</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cursos.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No tienes cursos asignados asignados en este periodo.</p>
            ) : (
              cursos.map((curso, idx) => {
                const estudiantes = getMatriculasByCurso(curso.id);
                const colorTheme = CURSE_COLORS[idx % CURSE_COLORS.length];
                return (
                  <Link href={`/docente/cursos/${curso.id}`} key={curso.id} className="block group">
                    <div className="flex items-center justify-between p-4 border border-slate-100 group-hover:border-slate-200 rounded-xl hover:bg-slate-50/50 hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 select-none transition-transform group-hover:scale-105"
                          style={{ backgroundColor: `${colorTheme}12`, color: colorTheme, border: `1.5px solid ${colorTheme}20` }}
                        >
                          {getSiglasCurso(curso.nombre)}
                        </div>
                        <div className="truncate max-w-[200px] sm:max-w-[280px]">
                          <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate">
                            {curso.nombre}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {curso.codigo} • Ciclo {curso.ciclo} • {curso.modalidad === 'presencial' ? '🏢 Presencial' : '💻 Virtual'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-800">{estudiantes.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alumnos</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

