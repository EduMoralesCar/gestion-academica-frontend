'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { Estudiante } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function NotasPage() {
  const { user } = useAuth();
  const { getMatriculasByEstudiante, getNotasByMatricula, getCursoById, getTareasByCurso, getEntregasByEstudiante } = useAppData();
  
  const estudiante = user as Estudiante | null;
  const matriculas = estudiante ? getMatriculasByEstudiante(estudiante.id) : [];
  const entregasEstudiante = estudiante ? getEntregasByEstudiante(estudiante.id) : [];

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Notas</h1>
          <p className="text-gray-500 mt-1">Consulta tus calificaciones por curso</p>
        </div>

        <div className="space-y-4">
          {matriculas.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No tienes notas registradas</p>
              </CardContent>
            </Card>
          ) : (
            matriculas.map(mat => {
              const curso = getCursoById(mat.curso_id);
              const notas = getNotasByMatricula(mat.id);

              // Tareas
              const tareas = getTareasByCurso(curso!.id);
              const entregasDeTareas = entregasEstudiante.filter(e => e.calificacion !== null && e.calificacion > 0 && tareas.some(t => t.id === e.tarea_id));
              const puntajeObtenido = entregasDeTareas.reduce((sum, e) => sum + (e.calificacion || 0), 0);
              const puntajePosible = entregasDeTareas.reduce((sum, e) => {
                const t = tareas.find(t => t.id === e.tarea_id);
                return sum + (t ? t.puntaje_total : 0);
              }, 0);
              const promedioTareas = puntajePosible > 0 ? (puntajeObtenido / puntajePosible) * 20 : 0;

              // PCs
              const pcs = notas.filter(n => ['PC1', 'PC2', 'PC3'].includes(n.tipo));
              const sumaPCs = pcs.reduce((sum, n) => sum + n.calificacion, 0);
              const promedioPCs = pcs.length > 0 ? sumaPCs / pcs.length : 0;

              // Parcial y Final
              const parcial = notas.find(n => n.tipo === 'parcial')?.calificacion || 0;
              const final = notas.find(n => n.tipo === 'final')?.calificacion || 0;

              const promedioFinal = (promedioTareas * 0.20) + (promedioPCs * 0.30) + (parcial * 0.20) + (final * 0.30);

              const aprobado = promedioFinal >= 11.5;

              return (
                <Card key={mat.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {curso?.nombre}
                          <Badge className={aprobado ? "bg-green-100 text-green-800 border-green-300 font-medium px-2 py-0.5 text-xs" : "bg-red-100 text-red-800 border-red-300 font-medium px-2 py-0.5 text-xs"} variant="outline">
                            {aprobado ? "Aprobado" : "Desaprobado"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{curso?.codigo}</CardDescription>
                      </div>
                      <Badge className="bg-blue-900 text-lg py-1">Promedio: {promedioFinal.toFixed(1)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {['PC1', 'PC2', 'PC3', 'parcial', 'final'].map(tipo => {
                        const nota = notas.find(n => n.tipo === tipo);
                        return (
                          <div key={tipo} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 capitalize">{tipo}</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {nota && nota.calificacion !== null && nota.calificacion !== undefined ? nota.calificacion : '—'}
                            </p>
                          </div>
                        )
                      })}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 capitalize">Promedio Tareas</p>
                        <p className="text-2xl font-bold text-blue-900">{promedioTareas.toFixed(1)}</p>
                      </div>
                    </div>
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
