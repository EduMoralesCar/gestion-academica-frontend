'use client';

import React from 'react';
import { useAppData } from '@/lib/hooks/useAppData';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ReferenceLine 
} from 'recharts';
import { 
  Users, UserCheck, BookOpen, GraduationCap, Award, TrendingUp, AlertCircle, ArrowUpRight 
} from 'lucide-react';
import type { Estudiante } from '@/lib/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

type EstudiantesPorCiclo = {
  ciclo: number;
  cantidad: number;
};

type EstudiantesPorCarrera = {
  name: string;
  value: number;
};

// Custom modern glass tooltip
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const fillCol = item.fill || item.color || '#3b82f6';
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-3 rounded-xl shadow-lg transition-all duration-200">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fillCol }} />
          <span className="text-xs font-semibold text-slate-600">{item.name}:</span>
          <span className="text-sm font-extrabold text-slate-900">
            {prefix}{item.value}{suffix}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ReportesPage() {
  const { appState } = useAppData();
  
  // 1. Estudiantes por ciclo
  const estudiantes = appState.usuarios.filter((u): u is Estudiante => u.rol === 'ESTUDIANTE');
  const estudiantesPorCiclo = estudiantes.reduce<EstudiantesPorCiclo[]>((acc, est) => {
    const ciclo = est.ciclo || 1;
    const existing = acc.find((e) => e.ciclo === ciclo);
    if (existing) {
      existing.cantidad += 1;
    } else {
      acc.push({ ciclo, cantidad: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.ciclo - b.ciclo);

  // Ciclo con mayor cantidad de alumnos
  const cicloMasPoblado = estudiantesPorCiclo.length > 0 
    ? [...estudiantesPorCiclo].sort((a, b) => b.cantidad - a.cantidad)[0] 
    : null;

  // 2. Matrículas por curso (sólidos y activos)
  const matriculasPorCurso = appState.cursos.map(curso => ({
    nombre: curso.nombre,
    estudiantes: appState.matriculas.filter(m => m.curso_id === curso.id && m.estado === 'activo').length,
  }));

  const cursoMasConcurrido = matriculasPorCurso.length > 0
    ? [...matriculasPorCurso].sort((a, b) => b.estudiantes - a.estudiantes)[0]
    : null;

  // 3. Distribución por carrera
  const estudiantesPorCarrera = estudiantes.reduce<EstudiantesPorCarrera[]>((acc, est) => {
    const carrera = est.carrera || 'General';
    const existing = acc.find((e) => e.name === carrera);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: carrera, value: 1 });
    }
    return acc;
  }, []);

  const carreraMasPopular = estudiantesPorCarrera.length > 0
    ? [...estudiantesPorCarrera].sort((a, b) => b.value - a.value)[0]
    : null;

  // 4. Promedios por asignatura (basado en notas reales > 0.0)
  const promediosPorCurso = appState.cursos.map(curso => {
    const matriculas = appState.matriculas.filter(m => m.curso_id === curso.id);
    const matriculaIds = matriculas.map(m => m.id);
    const notasCurso = appState.notas.filter(n => matriculaIds.includes(n.matricula_id) && n.calificacion > 0);
    
    const suma = notasCurso.reduce((acc, curr) => acc + curr.calificacion, 0);
    const promedio = notasCurso.length > 0 ? parseFloat((suma / notasCurso.length).toFixed(1)) : 0;
    
    return {
      nombre: curso.nombre,
      promedio: promedio,
    };
  }).filter(c => c.promedio > 0); // Omitir cursos sin notas cargadas para la gráfica

  // Promedio institucional global
  const todasLasNotasValidas = appState.notas.filter(n => n.calificacion > 0);
  const promedioInstitucionalGlobal = todasLasNotasValidas.length > 0
    ? parseFloat((todasLasNotasValidas.reduce((acc, n) => acc + n.calificacion, 0) / todasLasNotasValidas.length).toFixed(1))
    : 0;

  // Cursos destacado y en alerta
  const cursoMejorRendimiento = promediosPorCurso.length > 0
    ? [...promediosPorCurso].sort((a, b) => b.promedio - a.promedio)[0]
    : null;

  const cursoMenorRendimiento = promediosPorCurso.length > 0
    ? [...promediosPorCurso].sort((a, b) => a.promedio - b.promedio)[0]
    : null;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Reportes e Indicadores
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200/50 py-0.5 px-2 rounded-full text-xs font-semibold">
                Administración
              </Badge>
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Análisis analítico, estadísticas y rendimiento académico general de NuevaSchool.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Promedio Institucional</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800">{promedioInstitucionalGlobal || 'N/A'}</span>
                <span className="text-[10px] font-bold text-slate-500">/ 20</span>
                {promedioInstitucionalGlobal >= 11.5 ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 py-0 rounded text-[9px] font-extrabold ml-1.5">
                    Satisfactorio
                  </Badge>
                ) : promedioInstitucionalGlobal > 0 ? (
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-1.5 py-0 rounded text-[9px] font-extrabold ml-1.5">
                    Crítico
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-blue-500 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Estudiantes Activos</span>
                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 leading-none">{estudiantes.length}</div>
              <p className="text-[10px] font-medium text-slate-500 mt-2 flex items-center gap-1">
                Matrículas consolidadas <ArrowUpRight className="h-3 w-3 text-slate-400" />
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-emerald-500 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Planta Docente</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 leading-none">
                {appState.usuarios.filter(u => u.rol === 'DOCENTE').length}
              </div>
              <p className="text-[10px] font-medium text-slate-500 mt-2">
                Asignados a cursos académicos
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-amber-500 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Asignaturas Ofertadas</span>
                <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 leading-none">{appState.cursos.length}</div>
              <p className="text-[10px] font-medium text-slate-500 mt-2">
                Conectados con sílabo y horario
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-l-purple-500 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Rendimiento Promedio</span>
                <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Award className="h-4 w-4 text-purple-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 leading-none">{promedioInstitucionalGlobal || '0.0'}</div>
              <p className="text-[10px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
                {promedioInstitucionalGlobal >= 11.5 ? (
                  <span className="text-green-600 flex items-center gap-0.5">✔ Aprobatorio institucional</span>
                ) : promedioInstitucionalGlobal > 0 ? (
                  <span className="text-rose-600 flex items-center gap-0.5">⚠ Alerta de calificaciones</span>
                ) : (
                  <span>Sin calificaciones aún</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Estudiantes por Ciclo (Grid Dual) */}
          <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Estudiantes por Ciclo
              </CardTitle>
              <CardDescription>Población institucional distribuida por nivel académico</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 h-[260px] w-full">
                  {estudiantesPorCiclo.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={estudiantesPorCiclo} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCiclo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.95}/>
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.25}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="ciclo" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Ciclo ${val}`} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip suffix=" estudiantes" />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="cantidad" name="Estudiantes" fill="url(#colorCiclo)" radius={[5, 5, 0, 0]} maxBarSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      No hay estudiantes registrados.
                    </div>
                  )}
                </div>
                {/* Panel lateral estadístico */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-center space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Población Total</span>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{estudiantes.length}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Estudiantes matriculados</p>
                  </div>
                  <div className="border-t border-slate-200/60 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ciclo Mayoritario</span>
                    <p className="text-base font-extrabold text-slate-700 mt-0.5">
                      {cicloMasPoblado ? `Ciclo ${cicloMasPoblado.ciclo}` : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {cicloMasPoblado ? `${cicloMasPoblado.cantidad} alumnos registrados` : 'Sin datos'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Distribución por Carrera (Dona + Sidebar Leyendas) */}
          <Card className="border-slate-100 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-bold text-slate-800">Distribución por Escuela</CardTitle>
              <CardDescription>Proporción de alumnado inscrito según programa/carrera</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {estudiantesPorCarrera.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                  <div className="md:col-span-2 h-[220px] flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={estudiantesPorCarrera}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {estudiantesPorCarrera.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip suffix=" alumnos" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centro interactivo */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-slate-400 mb-0.5" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escuelas</span>
                      <span className="text-lg font-black text-slate-800 leading-none mt-0.5">{estudiantesPorCarrera.length}</span>
                    </div>
                  </div>
                  {/* Desglose visual derecho */}
                  <div className="md:col-span-3 space-y-3.5 pl-0 md:pl-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Desglose Institucional</p>
                    <div className="max-h-[170px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {estudiantesPorCarrera.map((entry, index) => {
                        const total = estudiantes.length || 1;
                        const percentage = Math.round((entry.value / total) * 100);
                        const color = COLORS[index % COLORS.length];
                        return (
                          <div key={entry.name} className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 font-bold text-slate-700 truncate max-w-[150px]">
                                <span className="h-2 w-2 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                                {entry.name}
                              </span>
                              <span className="font-extrabold text-slate-900 shrink-0">
                                {entry.value} <span className="text-slate-400 font-normal text-[10px]">({percentage}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Sin datos de carreras disponibles.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 3: Rendimiento Promedio por Curso (Nuevo e Increíble) */}
          <Card className="border-slate-100 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Rendimiento por Asignatura</CardTitle>
                  <CardDescription>Calificación promedio ponderada por curso dictado</CardDescription>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200/50 text-[10px] font-bold">
                  Escala 1 - 20
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {promediosPorCurso.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[230px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={promediosPorCurso} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPromedio" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.00}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="nombre" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(' ')[0] || val} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 20]} ticks={[0, 5, 10, 11, 15, 20]} />
                        <Tooltip content={<CustomTooltip suffix=" / 20" />} />
                        <ReferenceLine y={11} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Aprobación (11)', fill: '#f43f5e', fontSize: 9, position: 'top' }} />
                        <Area type="monotone" dataKey="promedio" name="Nota Promedio" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPromedio)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Desglose inferior de rendimiento */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Award className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="truncate">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Rendimiento Destacado</p>
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {cursoMejorRendimiento ? `${cursoMejorRendimiento.nombre}` : 'N/A'}
                        </p>
                        <p className="text-[10px] font-black text-emerald-600 mt-0.5">
                          {cursoMejorRendimiento ? `Nota: ${cursoMejorRendimiento.promedio}` : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      </div>
                      <div className="truncate">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Bajo Rendimiento</p>
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {cursoMenorRendimiento ? `${cursoMenorRendimiento.nombre}` : 'N/A'}
                        </p>
                        <p className="text-[10px] font-black text-rose-600 mt-0.5">
                          {cursoMenorRendimiento ? `Nota: ${cursoMenorRendimiento.promedio}` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[270px] flex items-center justify-center text-slate-400 text-sm">
                  Aún no se han registrado calificaciones en el sistema para calcular el rendimiento.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Matrículas por Curso en Formato Horizontal Elegante */}
          <Card className="border-slate-100 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-bold text-slate-800">Inscripciones por Asignatura</CardTitle>
              <CardDescription>Volumen de estudiantes matriculados en cada curso activo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {matriculasPorCurso.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[230px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={matriculasPorCurso} 
                        layout="vertical" 
                        margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorCurso" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.95}/>
                            <stop offset="95%" stopColor="#fb923c" stopOpacity={0.35}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis 
                          dataKey="nombre" 
                          type="category" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false} 
                          width={110} 
                          tickFormatter={(val) => val.length > 18 ? `${val.substring(0, 15)}...` : val}
                        />
                        <Tooltip content={<CustomTooltip suffix=" matriculados" />} cursor={{ fill: '#f8fafc' }} />
                        <Bar 
                          dataKey="estudiantes" 
                          name="Matriculados" 
                          fill="url(#colorCurso)" 
                          radius={[0, 4, 4, 0]} 
                          maxBarSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Estadísticas de matrículas */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Asignatura más demandada:</span>
                    <span className="font-extrabold text-slate-800">
                      {cursoMasConcurrido ? `${cursoMasConcurrido.nombre} (${cursoMasConcurrido.estudiantes} alumnos)` : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-[270px] flex items-center justify-center text-slate-400 text-sm">
                  No hay asignaturas activas registradas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

