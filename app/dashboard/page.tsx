'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/lib/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { EstudianteDashboard } from '@/components/dashboards/EstudianteDashboard';
import { DocenteDashboard } from '@/components/dashboards/DocenteDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {user?.rol === UserRole.ESTUDIANTE && <EstudianteDashboard />}
        {user?.rol === UserRole.DOCENTE && <DocenteDashboard />}
        {user?.rol === UserRole.ADMIN && <AdminDashboard />}
      </div>
    </MainLayout>
  );
}
