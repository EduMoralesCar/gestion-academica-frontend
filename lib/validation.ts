import { UserRole } from '@/lib/types';
import type { Curso, User } from '@/lib/types';

export type ValidationResult = {
  valid: boolean;
  title: string;
  messages: string[];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s'.-]+$/;
const codePattern = /^[A-Za-z0-9-]{3,16}$/;

const ok = (title = 'Datos correctos'): ValidationResult => ({
  valid: true,
  title,
  messages: [],
});

export const invalid = (title: string, messages: string[]): ValidationResult => ({
  valid: false,
  title,
  messages,
});

export const isBlank = (value?: string | number | null) => String(value ?? '').trim().length === 0;

export const isValidEmail = (email: string) => emailPattern.test(email.trim());

export const isValidInstitutionalEmail = (email: string) =>
  isValidEmail(email) && email.trim().toLowerCase().endsWith('@nuevaschool.pe');

export const isValidName = (value: string) => namePattern.test(value.trim());

export const isValidDate = (value: string) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
};

export const isFutureOrToday = (value: string) => {
  if (!isValidDate(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${value}T00:00:00`);
  return date >= today;
};

export const validateLogin = (email: string, password: string): ValidationResult => {
  const messages: string[] = [];

  if (isBlank(email)) messages.push('Ingresa tu correo institucional.');
  else if (!isValidEmail(email)) messages.push('El correo debe tener un formato valido, por ejemplo usuario@nuevaschool.pe.');

  if (isBlank(password)) messages.push('Ingresa tu contraseña.');

  return messages.length ? invalid('Revisa tus datos de acceso', messages) : ok();
};

export const validateRecoveryEmail = (email: string, users: User[]): ValidationResult => {
  const messages: string[] = [];

  if (isBlank(email)) messages.push('Ingresa el correo de la cuenta que quieres recuperar.');
  else if (!isValidEmail(email)) messages.push('El correo no tiene un formato valido.');

  return messages.length ? invalid('No se pudo enviar el código', messages) : ok();
};

export const validateRecoveryCode = (code: string, expectedCode: string): ValidationResult => {
  const messages: string[] = [];

  if (!/^\d{6}$/.test(code.trim())) messages.push('El código debe tener exactamente 6 dígitos.');
  else if (code !== expectedCode) messages.push('El código ingresado no coincide con el código generado.');

  return messages.length ? invalid('Código de recuperación inválido', messages) : ok();
};

export const validatePasswordChange = (
  newPassword: string,
  confirmPassword: string,
  currentPassword?: string,
  requireCurrent = false,
): ValidationResult => {
  const messages: string[] = [];

  if (requireCurrent && isBlank(currentPassword)) messages.push('Ingresa tu contraseña actual.');
  if (isBlank(newPassword)) messages.push('Ingresa una nueva contraseña.');
  else {
    if (newPassword.length < 6) messages.push('La nueva contraseña debe tener al menos 6 caracteres.');
    if (!/[A-Za-z]/.test(newPassword)) messages.push('La nueva contraseña debe incluir al menos una letra.');
    if (!/\d/.test(newPassword)) messages.push('La nueva contraseña debe incluir al menos un número.');
  }
  if (newPassword !== confirmPassword) messages.push('La confirmación debe coincidir con la nueva contraseña.');

  return messages.length ? invalid('Revisa la contraseña', messages) : ok();
};

type UserFormData = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  carrera: string;
  ciclo: string;
  codigo: string;
  especialidad: string;
  departamento: string;
  nivel_acceso?: string;
};

export const validateUserForm = (
  formData: UserFormData,
  users: User[],
  editingId: string | null,
): ValidationResult => {
  const messages: string[] = [];
  const normalizedEmail = formData.email.trim().toLowerCase();

  if (isBlank(formData.nombre)) messages.push('El nombre es obligatorio.');
  else if (!isValidName(formData.nombre)) messages.push('El nombre solo debe contener letras y espacios.');

  if (isBlank(formData.apellido)) messages.push('El apellido es obligatorio.');
  else if (!isValidName(formData.apellido)) messages.push('El apellido solo debe contener letras y espacios.');

  if (isBlank(formData.email)) messages.push('El correo es obligatorio.');
  else if (!isValidInstitutionalEmail(formData.email)) messages.push('Usa un correo institucional con dominio @nuevaschool.pe.');
  else if (users.some((user) => user.email.toLowerCase() === normalizedEmail && user.id !== editingId)) {
    messages.push('Ya existe un usuario con ese correo.');
  }

  if (!editingId) {
    const passwordResult = validatePasswordChange(formData.password, formData.password);
    passwordResult.messages.forEach((message) => messages.push(message.replace('La nueva contraseña', 'La contraseña inicial')));
  }

  if (formData.rol === UserRole.ESTUDIANTE) {
    const cycle = Number(formData.ciclo);
    if (isBlank(formData.codigo)) messages.push('El código universitario es obligatorio.');
    else if (!codePattern.test(formData.codigo.trim())) messages.push('El código debe tener de 3 a 16 caracteres alfanuméricos.');
    if (isBlank(formData.carrera)) messages.push('La carrera es obligatoria.');
    if (!Number.isInteger(cycle) || cycle < 1 || cycle > 10) messages.push('El ciclo debe ser un número entero entre 1 y 10.');
  }

  if (formData.rol === UserRole.DOCENTE) {
    if (isBlank(formData.departamento)) messages.push('El departamento académico es obligatorio.');
    if (isBlank(formData.especialidad)) messages.push('La especialidad es obligatoria.');
  }

  if (formData.rol === UserRole.ADMIN) {
    if (isBlank(formData.nivel_acceso || '')) messages.push('El nivel de acceso es obligatorio.');
  }

  return messages.length ? invalid('Revisa el formulario de usuario', messages) : ok();
};

type CourseFormData = {
  nombre: string;
  codigo: string;
  docente_id: string;
  creditos: string;
  ciclo: string;
};

export const validateCourseForm = (
  formData: CourseFormData,
  courses: Curso[],
  editingId: string | null,
): ValidationResult => {
  const messages: string[] = [];
  const credits = Number(formData.creditos);
  const cycle = Number(formData.ciclo);
  const normalizedCode = formData.codigo.trim().toLowerCase();

  if (isBlank(formData.nombre)) messages.push('El nombre del curso es obligatorio.');
  if (isBlank(formData.codigo)) messages.push('El código del curso es obligatorio.');
  else if (!/^[A-Za-z0-9-]{3,12}$/.test(formData.codigo.trim())) {
    messages.push('El código del curso debe tener de 3 a 12 caracteres alfanuméricos.');
  } else if (courses.some((course) => course.codigo.toLowerCase() === normalizedCode && course.id !== editingId)) {
    messages.push('Ya existe un curso con ese código.');
  }
  if (isBlank(formData.docente_id)) messages.push('Selecciona un docente titular.');
  if (!Number.isInteger(credits) || credits < 1 || credits > 10) messages.push('Los créditos deben ser un número entero entre 1 y 10.');
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 10) messages.push('El ciclo debe ser un número entero entre 1 y 10.');

  return messages.length ? invalid('Revisa el curso', messages) : ok();
};

type TaskFormData = {
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  puntaje_total: number;
};

export const validateTaskForm = (formData: TaskFormData, selectedCurso: string): ValidationResult => {
  const messages: string[] = [];

  if (isBlank(selectedCurso)) messages.push('Selecciona el curso al que pertenece la tarea.');
  if (isBlank(formData.titulo)) messages.push('El título de la tarea es obligatorio.');
  if (isBlank(formData.descripcion)) messages.push('La descripcion de la tarea es obligatoria.');
  if (!isValidDate(formData.fecha_entrega)) messages.push('Selecciona una fecha de entrega válida.');
  if (!Number.isFinite(Number(formData.puntaje_total)) || formData.puntaje_total < 1 || formData.puntaje_total > 100) {
    messages.push('El puntaje total debe estar entre 1 y 100.');
  }

  return messages.length ? invalid('Revisa la tarea', messages) : ok();
};

type ContentFormData = {
  semana_numero: string;
  titulo: string;
  descripcion: string;
};

export const validateContentForm = (
  formData: ContentFormData,
  existingWeeks: number[],
  editingWeek?: number,
): ValidationResult => {
  const messages: string[] = [];
  const week = Number(formData.semana_numero);

  if (!Number.isInteger(week) || week < 1 || week > 18) messages.push('El número de semana debe estar entre 1 y 18.');
  else if (existingWeeks.includes(week) && week !== editingWeek) messages.push('Ya existe contenido para esa semana.');
  if (isBlank(formData.titulo)) messages.push('El título del tema es obligatorio.');
  if (formData.descripcion.trim().length > 500) messages.push('La descripcion no debe superar los 500 caracteres.');

  return messages.length ? invalid('Revisa el contenido de la semana', messages) : ok();
};

export const validateGrade = (value: string, max = 20): ValidationResult => {
  const messages: string[] = [];
  const grade = Number(value);

  if (isBlank(value)) messages.push('Ingresa una calificación.');
  else if (!Number.isFinite(grade)) messages.push('La calificación debe ser numérica.');
  else if (grade < 1 || grade > max) messages.push(`La calificación debe estar entre 1 y ${max}.`);

  return messages.length ? invalid('Revisa la calificación', messages) : ok();
};

export const validateDelivery = (archivo: string, comentarios: string): ValidationResult => {
  const messages: string[] = [];

  if (isBlank(archivo)) messages.push('Adjunta un archivo antes de enviar la tarea.');
  if (comentarios.trim().length > 300) messages.push('Los comentarios no deben superar los 300 caracteres.');

  return messages.length ? invalid('Revisa tu entrega', messages) : ok();
};

export const validateAttendance = (
  selectedCurso: string,
  selectedFecha: string,
  markedCount: number,
): ValidationResult => {
  const messages: string[] = [];

  if (isBlank(selectedCurso)) messages.push('Selecciona un curso.');
  if (!isValidDate(selectedFecha)) messages.push('Selecciona una fecha válida.');
  if (markedCount === 0) messages.push('Marca la asistencia de al menos un estudiante.');

  return messages.length ? invalid('Revisa la asistencia', messages) : ok();
};
