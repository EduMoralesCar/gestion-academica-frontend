'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, Shield, User, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import { validateUserForm } from '@/lib/validation';
import { useValidationModal } from '@/components/ui/validation-modal';
import { DEPARTAMENTOS_CARRERAS, DEPARTAMENTOS_DOCENTES, ESPECIALIDADES_DOCENTES } from '@/lib/constants';

export default function GestionUsuariosPage() {
  const { user } = useAuth();
  const { appState, updateAppState } = useAppData();
  const { showValidation, validationModal } = useValidationModal();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);
  
  // Filter for tab-like toggle
  const [activeRole, setActiveRole] = useState<'ESTUDIANTE' | 'DOCENTE' | 'ADMIN'>('ESTUDIANTE');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'ESTUDIANTE',
    profilePicture: '',
    // Estudiante specific
    carrera: '',
    ciclo: '1',
    codigo: '',
    // Docente specific
    especialidad: '',
    departamento: '',
    // Admin specific
    nivel_acceso: ''
  });

  const generateUserCode = (rol: string) => {
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    const prefix = rol === 'ESTUDIANTE' ? 'U' : rol === 'DOCENTE' ? 'D' : 'A';
    const codePrefix = `${prefix}${yearSuffix}`;
    const codes = (appState.usuarios || [])
      .filter(u => u.rol === rol && u.codigo && u.codigo.startsWith(codePrefix))
      .map(u => {
        const numPart = u.codigo.slice(codePrefix.length);
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    const maxNumber = codes.length > 0 ? Math.max(...codes) : 0;
    const nextNumber = maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(3, '0');
    return `${codePrefix}${paddedNumber}`;
  };


  const getFilteredUsers = () => {
    return (appState.usuarios || []).filter(u => u.rol === activeRole);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (showValidation(validateUserForm(formData, appState.usuarios || [], editingId))) return;

    const baseUser: any = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: formData.email.trim().toLowerCase(),
      rol: formData.rol,
      estado: 'activo',
    };

    if (formData.profilePicture) {
      baseUser.profilePicture = formData.profilePicture;
    }

    let userObj: any = { ...baseUser };

    if (formData.rol === 'ESTUDIANTE') {
      userObj = { ...userObj, carrera: formData.carrera, ciclo: parseInt(formData.ciclo), codigo: formData.codigo };
    } else if (formData.rol === 'DOCENTE') {
      userObj = { ...userObj, especialidad: formData.especialidad, departamento: formData.departamento };
    } else if (formData.rol === 'ADMIN') {
      userObj = { ...userObj, nivel_acceso: formData.nivel_acceso };
    }

    if (editingId) {
       updateAppState({
         usuarios: (appState.usuarios || []).map(u => u.id === editingId ? { ...u, ...userObj } : u)
       });
       toast.success('Usuario actualizado');
    } else {
       if(!formData.password) {
         toast.error('La contraseña es obligatoria para usuarios nuevos');
         return;
       }
       userObj = { ...userObj, id: `${formData.rol.toLowerCase()}-${Date.now()}`, password: formData.password, createdAt: new Date().toISOString() };
       updateAppState({
         usuarios: [...(appState.usuarios || []), userObj]
       });
       toast.success('Usuario creado con éxito');
    }

    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({nombre: '', apellido: '', email: '', password: '', rol: activeRole, profilePicture: '', carrera: '', ciclo: '1', codigo: '', especialidad: '', departamento: '', nivel_acceso: ''});
    setEditingId(null);
    setEmailManuallyEdited(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new (window as any).Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setFormData({ ...formData, profilePicture: compressedBase64 });
            toast.success('Imagen optimizada correctamente');
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      password: '',
      rol: user.rol,
      profilePicture: user.profilePicture || '',
      carrera: user.carrera || '',
      ciclo: user.ciclo?.toString() || '1',
      codigo: user.codigo || '',
      especialidad: user.especialidad || '',
      departamento: user.departamento || '',
      nivel_acceso: user.nivel_acceso || ''
    });
    setEditingId(user.id);
    setEmailManuallyEdited(true);
    setIsOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if(confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${name}?`)) {
      updateAppState({
         usuarios: (appState.usuarios || []).filter(u => u.id !== id)
      });
      toast.success('Usuario eliminado');
    }
  };

  if(user?.rol !== UserRole.ADMIN) {
    return <MainLayout><div className="p-6">Acceso Denegado</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Crea, edita o elimina cuentas de estudiantes, docentes y administradores.</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveRole('ESTUDIANTE')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeRole === 'ESTUDIANTE' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Estudiantes
                </button>
                <button 
                  onClick={() => setActiveRole('DOCENTE')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeRole === 'DOCENTE' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Docentes
                </button>
                <button 
                  onClick={() => setActiveRole('ADMIN')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeRole === 'ADMIN' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Administradores
                </button>
              </div>

              <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if(!open) resetForm();
                else {
                  setFormData({...formData, rol: activeRole, codigo: ''});
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-900">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir {activeRole === 'ESTUDIANTE' ? 'Estudiante' : activeRole === 'DOCENTE' ? 'Docente' : 'Administrador'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                    <DialogDescription>
                      Completa los detalles institucionales. Las credenciales de acceso servirán para el login.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nombre</label>
                        <Input 
                          required 
                          value={formData.nombre} 
                          onChange={e => {
                            const nameVal = e.target.value;
                            setFormData(prev => {
                              const nextFormData = { ...prev, nombre: nameVal };
                              if (!editingId && nameVal.trim() && prev.apellido.trim() && !prev.codigo) {
                                const code = generateUserCode(prev.rol);
                                nextFormData.codigo = code;
                                nextFormData.email = `${code}@nuevaschool.pe`.toLowerCase();
                              }
                              return nextFormData;
                            });
                          }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Apellido</label>
                        <Input 
                          required 
                          value={formData.apellido} 
                          onChange={e => {
                            const surnameVal = e.target.value;
                            setFormData(prev => {
                              const nextFormData = { ...prev, apellido: surnameVal };
                              if (!editingId && prev.nombre.trim() && surnameVal.trim() && !prev.codigo) {
                                const code = generateUserCode(prev.rol);
                                nextFormData.codigo = code;
                                nextFormData.email = `${code}@nuevaschool.pe`.toLowerCase();
                              }
                              return nextFormData;
                            });
                          }} 
                          className="mt-1" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Correo Electrónico (Login)</label>
                        <Input 
                          type="email" 
                          required 
                          readOnly={!editingId}
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          className={`mt-1 font-mono ${!editingId ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      {!editingId && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Contraseña Inicial</label>
                          <Input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1" />
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Foto de Perfil (Opcional)</label>
                        <div className="mt-1 flex items-center gap-4">
                          {formData.profilePicture && (
                            <img src={formData.profilePicture} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                          )}
                          <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
                        </div>
                      </div>
                    </div>

                    {formData.rol === 'ESTUDIANTE' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-sm font-medium">Código Universitario</label>
                          <Input required readOnly value={formData.codigo} className="mt-1 bg-slate-50 cursor-not-allowed font-mono" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-sm font-medium">Ciclo Actual</label>
                          <Input required type="number" min="1" max="10" value={formData.ciclo} onChange={e => setFormData({...formData, ciclo: e.target.value})} className="mt-1" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Carrera</label>
                          <select 
                            required 
                            value={formData.carrera} 
                            onChange={e => setFormData({...formData, carrera: e.target.value})} 
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                          >
                            <option value="">Seleccionar carrera...</option>
                            {Object.entries(DEPARTAMENTOS_CARRERAS).map(([depto, carreras]) => (
                              <optgroup key={depto} label={depto}>
                                {carreras.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {formData.rol === 'DOCENTE' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Código de Docente</label>
                          <Input required readOnly value={formData.codigo} className="mt-1 bg-slate-50 cursor-not-allowed font-mono" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Departamento Académico</label>
                          <select 
                            required 
                            value={formData.departamento} 
                            onChange={e => setFormData({...formData, departamento: e.target.value})} 
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                          >
                            <option value="">Seleccionar departamento...</option>
                            {DEPARTAMENTOS_DOCENTES.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Especialidad</label>
                          <select 
                            required 
                            value={formData.especialidad} 
                            onChange={e => setFormData({...formData, especialidad: e.target.value})} 
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                          >
                            <option value="">Seleccionar especialidad...</option>
                            {ESPECIALIDADES_DOCENTES.map(esp => (
                              <option key={esp} value={esp}>{esp}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {formData.rol === 'ADMIN' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Código de Administrador</label>
                          <Input required readOnly value={formData.codigo} className="mt-1 bg-slate-50 cursor-not-allowed font-mono" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Nivel de Acceso</label>
                          <Input required value={formData.nivel_acceso} onChange={e => setFormData({...formData, nivel_acceso: e.target.value})} placeholder="Ej: super, coordinador, soporte" className="mt-1" />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                      <Button type="submit" className="bg-blue-900">{editingId ? 'Actualizar' : 'Crear Usuario'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                     <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Nombre</th>
                        <th className="px-4 py-3">Email</th>
                        {activeRole === 'ESTUDIANTE' && <th className="px-4 py-3">Carrera</th>}
                        {activeRole === 'ESTUDIANTE' && <th className="px-4 py-3">Ciclo</th>}
                        {activeRole === 'DOCENTE' && <th className="px-4 py-3">Especialidad</th>}
                        {activeRole === 'ADMIN' && <th className="px-4 py-3">Nivel Acceso</th>}
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody>
                     {getFilteredUsers()?.length === 0 ? (
                       <tr><td colSpan={activeRole === 'ESTUDIANTE' ? 7 : 6} className="py-8 text-center text-gray-400">No se encontraron usuarios</td></tr>
                     ) : (
                       getFilteredUsers()?.map((u: any) => (
                         <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                           <td className="px-4 py-3 font-medium text-gray-900 border-l-4 border-transparent hover:border-blue-500">{u.nombre} {u.apellido}</td>
                           <td className="px-4 py-3 text-blue-600">{u.email}</td>
                           {activeRole === 'ESTUDIANTE' && <td className="px-4 py-3">{u.carrera}</td>}
                           {activeRole === 'ESTUDIANTE' && <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Ciclo {u.ciclo}</span></td>}
                           {activeRole === 'DOCENTE' && <td className="px-4 py-3">{u.especialidad}</td>}
                           {activeRole === 'ADMIN' && <td className="px-4 py-3"><span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded capitalize">{u.nivel_acceso || 'Coordinador'}</span></td>}
                           <td className="px-4 py-3"><span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded capitalize">{u.estado}</span></td>
                           <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(u)}>
                                <Edit2 className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.nombre)}>
                                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                              </Button>
                           </td>
                         </tr>
                       ))
                     )}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
      {validationModal}
    </MainLayout>
  );
}
