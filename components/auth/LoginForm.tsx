import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, ShieldCheck, Camera } from 'lucide-react';
import Script from 'next/script';

import { useAuth } from '@/lib/context/AuthContext';
import { useAppData } from '@/lib/hooks/useAppData';
import {
  invalid,
  validateLogin,
  validatePasswordChange,
  validateRecoveryCode,
  validateRecoveryEmail,
} from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useValidationModal } from '@/components/ui/validation-modal';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { appState, updateAppState } = useAppData();
  const router = useRouter();
  const { showValidation, validationModal } = useValidationModal();

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingReset, setIsLoadingReset] = useState(false);

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [faceLoginStatus, setFaceLoginStatus] = useState<'LOADING' | 'READY' | 'RECOGNIZING' | 'ERROR'>('LOADING');
  const [faceErrorMsg, setFaceErrorMsg] = useState('');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const initFaceApi = async () => {
    if (typeof window !== 'undefined' && (window as any).faceapi && !faceApiLoaded && !loadingModels) {
      setLoadingModels(true);
      try {
        const faceapi = (window as any).faceapi;
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setFaceApiLoaded(true);
        setFaceLoginStatus('READY');
        console.log('Modelos de face-api cargados con éxito en Login');
      } catch (err) {
        console.error('Error al cargar modelos face-api en Login:', err);
        setFaceLoginStatus('ERROR');
        setFaceErrorMsg('No se pudieron cargar los modelos de reconocimiento facial.');
      } finally {
        setLoadingModels(false);
      }
    }
  };

  const openFaceLogin = async () => {
    if (!email.trim()) {
      toast.error('Por favor, ingresa tu correo institucional primero para buscar tu rostro.');
      return;
    }
    setIsFaceModalOpen(true);
    setFaceErrorMsg('');
    setFaceLoginStatus('LOADING');
    
    // Iniciar cámara y detección
    setTimeout(() => {
      startWebcam();
    }, 150);
  };

  const closeFaceLogin = () => {
    setIsFaceModalOpen(false);
    stopWebcam();
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setWebcamStream(stream);
      
      const video = document.getElementById('face-webcam') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          startFaceDetection(video, stream);
        };
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setFaceLoginStatus('ERROR');
      setFaceErrorMsg('No se pudo acceder a la cámara web. Verifica los permisos de tu navegador.');
    }
  };

  const startFaceDetection = async (video: HTMLVideoElement, stream: MediaStream) => {
    const faceapi = (window as any).faceapi;
    if (!faceapi) return;

    setFaceLoginStatus('RECOGNIZING');
    
    let isChecking = false;
    let scanCount = 0;
    
    const intervalId = setInterval(async () => {
      if (!stream.active || !video.srcObject) {
        clearInterval(intervalId);
        return;
      }
      
      if (isChecking) return;
      isChecking = true;
      scanCount++;

      try {
        const detection = await faceapi.detectSingleFace(video)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const embedding = Array.from(detection.descriptor);
          
          const res = await fetch('/api/auth/login-facial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), embedding })
          });

          if (res.ok) {
            clearInterval(intervalId);
            const data = await res.json();
            
            localStorage.setItem('nuevaschool_token', data.access_token);
            if (data.user) {
              localStorage.setItem('nuevaschool_user', JSON.stringify(data.user));
            }
            
            toast.success('Rostro reconocido con éxito. Ingresando...');
            stopWebcam();
            setIsFaceModalOpen(false);
            
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
            return;
          } else {
            const errDetail = await res.json().catch(() => ({}));
            console.log('Intento de reconocimiento fallido:', errDetail.detail);
          }
        }
      } catch (err) {
        console.error('Error en intervalo de detección:', err);
      } finally {
        isChecking = false;
        
        if (scanCount > 80) { // ~24 segundos
          clearInterval(intervalId);
          setFaceLoginStatus('ERROR');
          setFaceErrorMsg('Tiempo de espera agotado. Asegúrate de tener buena iluminación frente a la cámara.');
          stopWebcam();
        }
      }
    }, 300);
  };

  const resetRecovery = () => {
    setResetStep(1);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setIsLoadingReset(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showValidation(validateLogin(email, password))) return;

    setIsLoading(true);
    try {
      const response = await login(email.trim(), password);
      if (response.error) {
        showValidation(invalid('No se pudo iniciar sesión', [response.error]));
        setIsLoading(false);
        return;
      }

      toast.success('Bienvenido a NuevaSchool');
      if (response.user) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 400);
      }
    } catch (error) {
      showValidation(invalid('Error al iniciar sesión', ['Intenta nuevamente en unos segundos.']));
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    const result = validateRecoveryEmail(resetEmail, appState.usuarios || []);
    if (showValidation(result)) return;

    setIsLoadingReset(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      if (res.ok) {
        toast.success('Se ha enviado un código de recuperación a tu correo');
        setResetStep(2);
      } else {
        const err = await res.json();
        let errMsg = 'Error al enviar el código de recuperación';
        if (err && err.detail) {
          errMsg = Array.isArray(err.detail) ? err.detail.map((d: any) => d.msg).join(', ') : err.detail;
        }
        showValidation(invalid('No se pudo enviar el código', [errMsg]));
      }
    } catch (err) {
      showValidation(invalid('Error de conexión', ['No se pudo comunicar con el servidor. Intenta de nuevo.']));
    } finally {
      setIsLoadingReset(false);
    }
  };

  const handleVerifyCode = () => {
    if (!/^\d{6}$/.test(resetCode.trim())) {
      showValidation(invalid('Código de recuperación inválido', ['El código debe tener exactamente 6 dígitos.']));
      return;
    }
    toast.success('Formato de código correcto');
    setResetStep(3);
  };

  const handleResetPassword = async () => {
    if (showValidation(validatePasswordChange(newPassword, confirmPassword))) return;

    setIsLoadingReset(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          codigo: resetCode.trim(),
          nueva_contrasenia: newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Contraseña restablecida correctamente');
        setIsResetOpen(false);
        resetRecovery();
      } else {
        const err = await res.json();
        let errMsg = 'Error al restablecer la contraseña';
        if (err && err.detail) {
          errMsg = Array.isArray(err.detail) ? err.detail.map((d: any) => d.msg).join(', ') : err.detail;
        }
        showValidation(invalid('Error al restablecer la contraseña', [errMsg]));
      }
    } catch (err) {
      showValidation(invalid('Error de conexión', ['No se pudo comunicar con el servidor. Intenta de nuevo.']));
    } finally {
      setIsLoadingReset(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#edf6ff] lg:block">
          <Image
            src="/login-academic-hero.png"
            alt="Estudiantes usando una plataforma académica digital"
            fill
            priority
            className="object-cover object-left"
            sizes="55vw"
          />
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-xl">
            <div className="mb-10 flex flex-col items-start gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-slate-950">NuevaSchool</p>
                  <p className="text-sm font-medium text-blue-700">Sistema de Gestión Académica</p>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                  Tu plataforma académica en un solo lugar
                </h1>
                <p className="max-w-lg text-lg text-slate-600">
                  Gestiona cursos, notas, asistencia y tareas desde una experiencia clara, rápida y ordenada.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-base text-slate-600">
                Ingresa tus datos para <span className="font-bold text-slate-900">iniciar sesión.</span>
              </p>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900">Correo institucional</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="usuario@nuevaschool.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 border-blue-200 bg-blue-50/60 pr-11 text-base focus-visible:ring-blue-600"
                  />
                  <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 border-blue-200 bg-blue-50/60 pr-20 text-base focus-visible:ring-blue-600"
                  />
                  <Lock className="absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-700"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-sm font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
                >
                  Restablecer contraseña
                </button>
              </div>

              <Button type="submit" className="h-12 w-full bg-blue-700 text-base font-semibold hover:bg-blue-800" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>

              <Button
                type="button"
                onClick={openFaceLogin}
                variant="outline"
                className="h-12 w-full border-blue-200 text-blue-700 font-semibold hover:bg-blue-50/50 flex items-center justify-center gap-2 mt-2"
                disabled={isLoading}
              >
                <Camera className="h-5 w-5" />
                Ingresar con Reconocimiento Facial
              </Button>
            </form>
          </div>
        </section>
      </div>

      <Dialog
        open={isResetOpen}
        onOpenChange={(open) => {
          setIsResetOpen(open);
          if (!open) resetRecovery();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              {resetStep === 1 && 'Ingresa tu correo institucional para recibir un código de seguridad.'}
              {resetStep === 2 && 'Ingresa el código de 6 dígitos enviado a tu correo.'}
              {resetStep === 3 && 'Crea una nueva contraseña para tu cuenta.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {resetStep === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo institucional</label>
                  <Input
                    placeholder="usuario@nuevaschool.pe"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isLoadingReset}
                  />
                </div>
                <Button className="w-full bg-blue-900" onClick={handleSendCode} disabled={isLoadingReset}>
                  {isLoadingReset ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    'Enviar código'
                  )}
                </Button>
              </>
            )}

            {resetStep === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código de 6 dígitos</label>
                  <Input
                    placeholder="123456"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg font-bold tracking-[0.5em]"
                    disabled={isLoadingReset}
                  />
                </div>
                <Button className="w-full bg-blue-900" onClick={handleVerifyCode} disabled={isLoadingReset}>
                  Verificar código
                </Button>
              </>
            )}

            {resetStep === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nueva contraseña</label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoadingReset}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Repetir nueva contraseña</label>
                  <Input
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoadingReset}
                  />
                </div>
                <Button className="w-full bg-blue-900" onClick={handleResetPassword} disabled={isLoadingReset}>
                  {isLoadingReset ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando contraseña...
                    </>
                  ) : (
                    'Actualizar contraseña'
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFaceModalOpen} onOpenChange={(open) => { if (!open) closeFaceLogin(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inicio de Sesión Facial</DialogTitle>
            <DialogDescription>
              Colócate frente a la cámara web para validar tu identidad.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4 pt-4">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
              <video 
                id="face-webcam" 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover scale-x-[-1]" 
              />
              
              {/* Overlay states */}
              {(faceLoginStatus === 'LOADING' || loadingModels) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white p-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm font-semibold">Cargando cámara y modelos IA...</p>
                  <p className="text-xs text-slate-400 mt-1">Este proceso puede tardar unos segundos la primera vez.</p>
                </div>
              )}
              
              {faceLoginStatus === 'RECOGNIZING' && (
                <div className="absolute inset-x-0 top-3 flex justify-center">
                  <span className="bg-blue-600/90 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full animate-pulse">
                    Escaneando Rostro...
                  </span>
                </div>
              )}
            </div>

            {faceLoginStatus === 'ERROR' && (
              <div className="w-full bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm text-center">
                <p className="font-semibold">Ocurrió un inconveniente:</p>
                <p className="text-xs mt-1">{faceErrorMsg}</p>
                <Button 
                  onClick={startWebcam} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Reintentar Cámara
                </Button>
              </div>
            )}

            <div className="w-full flex justify-end pt-2">
              <Button onClick={closeFaceLogin} variant="outline" className="border-slate-200">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Script 
        src="/js/face-api.min.js" 
        strategy="lazyOnload" 
        onLoad={initFaceApi}
      />

      {validationModal}
    </main>
  );
};
