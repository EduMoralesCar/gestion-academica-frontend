import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

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

      {validationModal}
    </main>
  );
};
