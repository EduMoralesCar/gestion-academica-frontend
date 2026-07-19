'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { validatePasswordChange } from '@/lib/validation';
import { useValidationModal } from '@/components/ui/validation-modal';
import { Camera } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';

export default function MiPerfilPage() {
  const { user, updateUser } = useAuth();
  const { appState, updateAppState } = useAppData();
  const { showValidation, validationModal } = useValidationModal();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const userId = user?.id;

  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const initFaceApi = async () => {
    if (typeof window !== 'undefined' && (window as any).faceapi && !loadingModels && !faceApiLoaded) {
      setLoadingModels(true);
      try {
        const faceapi = (window as any).faceapi;
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setFaceApiLoaded(true);
        console.log('Modelos de face-api.js cargados con éxito');
      } catch (err) {
        console.error('Error cargando modelos face-api:', err);
      } finally {
        setLoadingModels(false);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).faceapi) {
      initFaceApi();
    }
  }, []);

  // Migración silenciosa de rostro si tiene foto de perfil pero no embedding
  useEffect(() => {
    if (faceApiLoaded && user && user.profilePicture && !(user as any).face_embedding) {
      const migrateFace = async () => {
        try {
          const faceapi = (window as any).faceapi;
          const img = new (window as any).Image();
          img.src = user.profilePicture!;
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            const detection = await faceapi.detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (detection) {
              const embedding = Array.from(detection.descriptor);
              const token = localStorage.getItem('nuevaschool_token');
              const res = await fetch('/api/auth/registrar-rostro', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ embedding })
              });
              if (res.ok) {
                console.log('Migración silenciosa de rostro completada con éxito');
                updateUser({ ...user, face_embedding: JSON.stringify(embedding) });
              }
            } else {
              console.log('No se detectó un rostro claro en la foto actual para la migración silenciosa.');
            }
          };
        } catch (err) {
          console.error('Error durante la migración de rostro:', err);
        }
      };
      migrateFace();
    }
  }, [faceApiLoaded, user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new (window as any).Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const max_size = 400; // Mejor resolución para detectar facciones faciales
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
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
            
            if (!user) return;
            
            const token = typeof window !== 'undefined' ? localStorage.getItem('nuevaschool_token') : null;
            
            // Si face-api.js está cargado, intentar extraer el descriptor de rostro
            let faceEmbeddingVal: string | null = null;
            if (faceApiLoaded) {
              const faceapi = (window as any).faceapi;
              toast.loading('Analizando rostro en la foto...', { id: 'face-load' });
              
              try {
                // Crear un objeto imagen para face-api
                const faceImg = new (window as any).Image();
                faceImg.src = compressedBase64;
                await new Promise((resolve) => { faceImg.onload = resolve; });
                
                const detection = await faceapi.detectSingleFace(faceImg)
                  .withFaceLandmarks()
                  .withFaceDescriptor();
                  
                toast.dismiss('face-load');
                
                if (detection) {
                  faceEmbeddingVal = JSON.stringify(Array.from(detection.descriptor));
                  toast.success('Rostro detectado correctamente. ¡Inicio de sesión facial habilitado!');
                } else {
                  toast.warning('No se detectó un rostro claro en la imagen. No podrás iniciar sesión con cámara.');
                }
              } catch (err) {
                toast.dismiss('face-load');
                console.error('Error al detectar rostro:', err);
              }
            }
            
            toast.loading('Guardando foto de perfil...', { id: 'upload-load' });

            // Realizar la actualización directamente en el servidor
            fetch(`/api/usuarios/${userId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
                profilePicture: compressedBase64,
                face_embedding: faceEmbeddingVal,
                codigo: (user as any).codigo || null,
                carrera: (user as any).carrera || null,
                ciclo: (user as any).ciclo ? Number((user as any).ciclo) : null,
                especialidad: (user as any).especialidad || null,
                departamento: (user as any).departamento || null,
                nivel_acceso: (user as any).nivel_acceso || null
              })
            }).then(async (res) => {
              toast.dismiss('upload-load');
              if (res.ok) {
                // Actualizar el estado global en memoria de usuarios si está cargado
                if (appState.usuarios && appState.usuarios.length > 0) {
                  const updatedUsers = appState.usuarios.map(u => 
                    u.id === userId ? { ...u, profilePicture: compressedBase64, face_embedding: faceEmbeddingVal || undefined } : u
                  );
                  updateAppState({ usuarios: updatedUsers });
                }
                
                // Actualizar el usuario de sesión
                updateUser({ ...user, profilePicture: compressedBase64, face_embedding: faceEmbeddingVal || undefined });
                toast.success('Foto de perfil actualizada con éxito');
              } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.detail || 'No se pudo guardar la foto de perfil en el servidor');
              }
            }).catch((err) => {
              toast.dismiss('upload-load');
              console.error('Error uploading photo:', err);
              toast.error('Error de conexión al guardar la foto de perfil');
            });
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showValidation(validatePasswordChange(newPassword, confirmPassword, currentPassword, true))) return;

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nuevaschool_token') : null;
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contrasenia_actual: currentPassword,
          nueva_contrasenia: newPassword
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'La contraseña actual es incorrecta' }));
        toast.error(errorData.detail || 'La contraseña actual es incorrecta');
        return;
      }

      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error de conexión al actualizar la contraseña');
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent"></div>
          <span className="ml-3 text-gray-600 font-medium">Cargando perfil...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-500 mt-1">Administra tu cuenta y credenciales</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
            <CardDescription>Información básica de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre</label>
                <p className="text-lg font-medium text-gray-900">{user.nombre}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Apellido</label>
                <p className="text-lg font-medium text-gray-900">{user.apellido}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Correo Electrónico</label>
                <p className="text-lg font-medium text-blue-600">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Rol</label>
                <p className="text-lg font-medium text-gray-900 capitalize">{user.rol}</p>
              </div>
              {user.rol === 'ESTUDIANTE' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ciclo</label>
                  <p className="text-lg font-medium text-gray-900">{(user as any).ciclo}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Actualiza tu imagen de perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={32} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500">
                  Sube una imagen (JPG, PNG) de máximo 2MB.
                </p>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Reconocimiento Facial</h4>
                    <p className="text-xs text-slate-500">
                      {(user as any).face_embedding 
                        ? '✅ Rostro registrado. Puedes iniciar sesión con tu cámara.' 
                        : '❌ Rostro no registrado. Sube una foto de perfil clara.'}
                    </p>
                  </div>
                  {!faceApiLoaded && (
                    <span className="text-[10px] text-slate-400">
                      {loadingModels ? 'Cargando modelos IA...' : 'Modelos listos'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Actualiza la contraseña de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Contraseña Actual</label>
                <Input 
                  type="password" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual" 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nueva Contraseña</label>
                <Input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirmar Nueva Contraseña</label>
                <Input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña" 
                />
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full bg-blue-900">
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {validationModal}
      <Script 
        src="/js/face-api.min.js" 
        strategy="lazyOnload" 
        onLoad={initFaceApi}
      />
    </MainLayout>
  );
}
