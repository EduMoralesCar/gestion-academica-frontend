'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Admin } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, UserCheck, BarChart3 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appState } = useAppData();
  
  const admin = user as Admin;
  
  // Calculate stats
  const totalEstudiantes = (appState.usuarios || []).filter(u => u.rol === 'ESTUDIANTE').length;
  const totalDocentes = (appState.usuarios || []).filter(u => u.rol === 'DOCENTE').length;
  const totalCursos = (appState.cursos || []).length;
  const totalMatriculas = (appState.matriculas || []).filter(m => m.estado === 'activo').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenido, {admin.nombre}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-slate-100 hover:border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalEstudiantes}</div>
            <p className="text-[11px] font-medium text-green-600 mt-1 flex items-center gap-1">🟢 activos en el sistema</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-slate-100 hover:border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Docentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalDocentes}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">en planta académica</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-slate-100 hover:border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-orange-600" />
              Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalCursos}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">disponibles este ciclo</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-slate-100 hover:border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Matrículas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalMatriculas}</div>
            <p className="text-[11px] font-medium text-purple-600 mt-1">activas y vigentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Estudiantes por Carrera</CardTitle>
            <CardDescription>Distribución porcentual en la institución</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(
              (appState.usuarios || [])
                .filter(u => u.rol === 'ESTUDIANTE')
                .reduce((acc: Record<string, number>, curr: any) => {
                  const carrera = curr.carrera || 'Sin especialidad';
                  acc[carrera] = (acc[carrera] || 0) + 1;
                  return acc;
                }, {})
            ).map(([carrera, count]) => {
              const percentage = totalEstudiantes > 0 ? (count / totalEstudiantes) * 100 : 0;
              return (
                <div key={carrera} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{carrera}</span>
                    <span className="font-bold text-blue-600">{count} alumnos ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Especialidades Docentes</CardTitle>
            <CardDescription>Distribución de planta por especialidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(
              (appState.usuarios || [])
                .filter(u => u.rol === 'DOCENTE')
                .reduce((acc: Record<string, number>, curr: any) => {
                  const especialidad = curr.especialidad || 'General';
                  acc[especialidad] = (acc[especialidad] || 0) + 1;
                  return acc;
                }, {})
            ).map(([esp, count]) => {
              const percentage = totalDocentes > 0 ? (count / totalDocentes) * 100 : 0;
              return (
                <div key={esp} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{esp}</span>
                    <span className="font-bold text-emerald-600">{count} docentes ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
