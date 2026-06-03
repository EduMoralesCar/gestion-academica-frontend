'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/lib/types';
import {
  BarChart3,
  Users,
  BookOpen,
  FileText,
  CheckSquare,
  BarChart,
  GraduationCap,
  LogOut,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: [UserRole.ADMIN, UserRole.DOCENTE, UserRole.ESTUDIANTE],
  },
  {
    label: 'Mis Notas',
    href: '/estudiante/notas',
    icon: <FileText className="h-5 w-5" />,
    roles: [UserRole.ESTUDIANTE],
  },
  {
    label: 'Mis Cursos',
    href: '/estudiante/cursos',
    icon: <BookOpen className="h-5 w-5" />,
    roles: [UserRole.ESTUDIANTE],
  },
  {
    label: 'Mis Tareas',
    href: '/estudiante/tareas',
    icon: <CheckSquare className="h-5 w-5" />,
    roles: [UserRole.ESTUDIANTE],
  },
  {
    label: 'Asistencia',
    href: '/estudiante/asistencia',
    icon: <BarChart className="h-5 w-5" />,
    roles: [UserRole.ESTUDIANTE],
  },
  {
    label: 'Mis Estudiantes',
    href: '/docente/estudiantes',
    icon: <Users className="h-5 w-5" />,
    roles: [UserRole.DOCENTE],
  },
  {
    label: 'Calificar',
    href: '/docente/calificar',
    icon: <FileText className="h-5 w-5" />,
    roles: [UserRole.DOCENTE],
  },
  {
    label: 'Tareas',
    href: '/docente/tareas',
    icon: <CheckSquare className="h-5 w-5" />,
    roles: [UserRole.DOCENTE],
  },
  {
    label: 'Asistencia',
    href: '/docente/asistencia',
    icon: <BarChart className="h-5 w-5" />,
    roles: [UserRole.DOCENTE],
  },
  {
    label: 'Gestión de Usuarios',
    href: '/admin/usuarios',
    icon: <Users className="h-5 w-5" />,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Cursos',
    href: '/admin/cursos',
    icon: <BookOpen className="h-5 w-5" />,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Reportes',
    href: '/admin/reportes',
    icon: <BarChart className="h-5 w-5" />,
    roles: [UserRole.ADMIN],
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const visibleItems = menuItems.filter(item => user?.rol && item.roles.includes(user.rol));

  const getRoleBadge = (role?: UserRole) => {
    if (role === UserRole.ADMIN) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (role === UserRole.DOCENTE) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  };

  const getInitials = () => {
    if (!user) return 'NS';
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <aside className="bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-slate-100 w-64 min-h-screen p-4 flex flex-col justify-between border-r border-slate-800 shadow-xl">
      <div className="space-y-6">
        {/* Logo/Header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
            <GraduationCap className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent block">
              NuevaSchool
            </span>
            <span className="text-[10px] text-blue-300/60 font-semibold uppercase tracking-wider block">
              Gestión Académica
            </span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* Menu Items */}
        <div className="space-y-1.5">
          {visibleItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border border-transparent ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/10 text-white border-l-4 border-l-blue-500 border-blue-500/20 shadow-md shadow-blue-900/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:-translate-x-0.5'
                }`}
              >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Profile Card at Bottom */}
      {user && (
        <div className="space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-3 overflow-hidden">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.nombre}
                  className="h-10 w-10 rounded-full object-cover border border-slate-700 shadow-md"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                  {getInitials()}
                </div>
              )}
              <div className="overflow-hidden">
                <span className="font-semibold text-xs text-slate-200 block truncate leading-tight">
                  {user.nombre} {user.apellido}
                </span>
                <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold uppercase tracking-wider border leading-none ${getRoleBadge(user.rol)}`}>
                  {user.rol}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
