import { UserRole, AppState, Estudiante, Docente, Admin, Curso, Matricula, Nota, Tarea, Entrega, Asistencia, Horario } from './types';

export const seedData: AppState = {
  usuarios: [
    // ADMIN
    {
      id: 'admin-1',
      email: 'admin@nuevaschool.pe',
      nombre: 'Carlos',
      apellido: 'Huamán',
      rol: UserRole.ADMIN,
      createdAt: '2024-01-01',
      nivel_acceso: 'super',
      estado: 'activo',
    } as Admin,

    // DOCENTES
    {
      id: 'docente-1',
      email: 'docente@nuevaschool.pe',
      nombre: 'Juan',
      apellido: 'Pérez',
      rol: UserRole.DOCENTE,
      createdAt: '2024-01-01',
      especialidad: 'Informática',
      departamento: 'Ingeniería',
      estado: 'activo',
    } as Docente,
    {
      id: 'docente-2',
      email: 'd.maria.garcia@nuevaschool.pe',
      nombre: 'María',
      apellido: 'García',
      rol: UserRole.DOCENTE,
      createdAt: '2024-01-01',
      especialidad: 'Matemáticas',
      departamento: 'Ciencias',
      estado: 'activo',
    } as Docente,
    {
      id: 'docente-3',
      email: 'd.luis.lopez@nuevaschool.pe',
      nombre: 'Luis',
      apellido: 'López',
      rol: UserRole.DOCENTE,
      createdAt: '2024-01-01',
      especialidad: 'Inglés',
      departamento: 'Idiomas',
      estado: 'activo',
    } as Docente,

    // ESTUDIANTES
    {
      id: 'estudiante-1',
      email: 'estudiante@nuevaschool.pe',
      nombre: 'Pedro',
      apellido: 'Rodríguez',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E001',
      carrera: 'Ingeniería Informática',
      ciclo: 5,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-2',
      email: 'e.ana.martinez@nuevaschool.pe',
      nombre: 'Ana',
      apellido: 'Martínez',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E002',
      carrera: 'Ingeniería Informática',
      ciclo: 5,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-3',
      email: 'e.carlos.lopez@nuevaschool.pe',
      nombre: 'Carlos',
      apellido: 'López',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E003',
      carrera: 'Ingeniería Informática',
      ciclo: 5,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-4',
      email: 'e.diana.soto@nuevaschool.pe',
      nombre: 'Diana',
      apellido: 'Soto',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E004',
      carrera: 'Administración',
      ciclo: 3,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-5',
      email: 'e.gabriel.quispe@nuevaschool.pe',
      nombre: 'Gabriel',
      apellido: 'Quispe',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E005',
      carrera: 'Ingeniería Informática',
      ciclo: 7,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-6',
      email: 'e.francisco.flores@nuevaschool.pe',
      nombre: 'Francisco',
      apellido: 'Flores',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E006',
      carrera: 'Administración',
      ciclo: 3,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-7',
      email: 'e.gloria.ruiz@nuevaschool.pe',
      nombre: 'Gloria',
      apellido: 'Ruiz',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E007',
      carrera: 'Ingeniería Informática',
      ciclo: 5,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-8',
      email: 'e.hernan.mendoza@nuevaschool.pe',
      nombre: 'Hernán',
      apellido: 'Mendoza',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E008',
      carrera: 'Administración',
      ciclo: 2,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-9',
      email: 'e.iris.condori@nuevaschool.pe',
      nombre: 'Iris',
      apellido: 'Condori',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E009',
      carrera: 'Ingeniería Informática',
      ciclo: 5,
      estado: 'activo',
    } as Estudiante,
    {
      id: 'estudiante-10',
      email: 'e.jose.torres@nuevaschool.pe',
      nombre: 'José',
      apellido: 'Torres',
      rol: UserRole.ESTUDIANTE,
      createdAt: '2024-01-01',
      codigo: 'E010',
      carrera: 'Administración',
      ciclo: 4,
      estado: 'activo',
    } as Estudiante,
  ],

  cursos: [
    {
      id: 'curso-1',
      nombre: 'Programación I',
      codigo: 'INF101',
      creditos: 4,
      docente_id: 'docente-1',
      ciclo: 1,
      modalidad: 'presencial',
      createdAt: '2024-01-01',
    },
    {
      id: 'curso-2',
      nombre: 'Programación II',
      codigo: 'INF202',
      creditos: 4,
      docente_id: 'docente-1',
      ciclo: 3,
      modalidad: 'presencial',
      createdAt: '2024-01-01',
    },
    {
      id: 'curso-3',
      nombre: 'Base de Datos',
      codigo: 'INF301',
      creditos: 3,
      docente_id: 'docente-1',
      ciclo: 5,
      modalidad: 'presencial',
      createdAt: '2024-01-01',
    },
    {
      id: 'curso-4',
      nombre: 'Cálculo I',
      codigo: 'MAT101',
      creditos: 4,
      docente_id: 'docente-2',
      ciclo: 1,
      modalidad: 'presencial',
      createdAt: '2024-01-01',
    },
    {
      id: 'curso-5',
      nombre: 'Inglés I',
      codigo: 'ENG101',
      creditos: 2,
      docente_id: 'docente-3',
      ciclo: 1,
      modalidad: 'presencial',
      createdAt: '2024-01-01',
    },
  ],

  matriculas: [
    { id: 'mat-1', estudiante_id: 'estudiante-1', curso_id: 'curso-3', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-2', estudiante_id: 'estudiante-2', curso_id: 'curso-3', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-3', estudiante_id: 'estudiante-3', curso_id: 'curso-3', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-4', estudiante_id: 'estudiante-1', curso_id: 'curso-1', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-5', estudiante_id: 'estudiante-2', curso_id: 'curso-1', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-6', estudiante_id: 'estudiante-7', curso_id: 'curso-3', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-7', estudiante_id: 'estudiante-9', curso_id: 'curso-3', fecha_matricula: '2024-03-01', estado: 'activo' },
    { id: 'mat-8', estudiante_id: 'estudiante-4', curso_id: 'curso-1', fecha_matricula: '2024-03-01', estado: 'activo' },
  ],

  notas: [
    // Estudiante 1 - Curso 3
    { id: 'nota-1', matricula_id: 'mat-1', tipo: 'parcial', calificacion: 15, peso: 15, fecha: '2024-04-15' },
    { id: 'nota-2', matricula_id: 'mat-1', tipo: 'practica', calificacion: 17, peso: 35, fecha: '2024-05-01' },
    { id: 'nota-3', matricula_id: 'mat-1', tipo: 'final', calificacion: 16, peso: 50, fecha: '2024-06-01' },

    // Estudiante 2 - Curso 3
    { id: 'nota-4', matricula_id: 'mat-2', tipo: 'parcial', calificacion: 14, peso: 15, fecha: '2024-04-15' },
    { id: 'nota-5', matricula_id: 'mat-2', tipo: 'practica', calificacion: 16, peso: 35, fecha: '2024-05-01' },
    { id: 'nota-6', matricula_id: 'mat-2', tipo: 'final', calificacion: 15, peso: 50, fecha: '2024-06-01' },

    // Estudiante 3 - Curso 3
    { id: 'nota-7', matricula_id: 'mat-3', tipo: 'parcial', calificacion: 18, peso: 15, fecha: '2024-04-15' },
    { id: 'nota-8', matricula_id: 'mat-3', tipo: 'practica', calificacion: 19, peso: 35, fecha: '2024-05-01' },
    { id: 'nota-9', matricula_id: 'mat-3', tipo: 'final', calificacion: 18, peso: 50, fecha: '2024-06-01' },

    // Estudiante 1 - Curso 1
    { id: 'nota-10', matricula_id: 'mat-4', tipo: 'parcial', calificacion: 16, peso: 15, fecha: '2024-04-20' },
    { id: 'nota-11', matricula_id: 'mat-4', tipo: 'practica', calificacion: 18, peso: 35, fecha: '2024-05-05' },

    // Estudiante 2 - Curso 1
    { id: 'nota-12', matricula_id: 'mat-5', tipo: 'parcial', calificacion: 13, peso: 15, fecha: '2024-04-20' },
    { id: 'nota-13', matricula_id: 'mat-5', tipo: 'practica', calificacion: 14, peso: 35, fecha: '2024-05-05' },
  ],

  tareas: [
    {
      id: 'tarea-1',
      curso_id: 'curso-3',
      titulo: 'Diseño de Base de Datos',
      descripcion: 'Diseñar un schema para un sistema de biblioteca',
      fecha_entrega: '2024-04-20',
      puntaje_total: 10,
      createdAt: '2024-04-01',
    },
    {
      id: 'tarea-2',
      curso_id: 'curso-3',
      titulo: 'Consultas SQL Avanzadas',
      descripcion: 'Realizar 5 consultas complejas con JOINs',
      fecha_entrega: '2024-05-10',
      puntaje_total: 15,
      createdAt: '2024-04-20',
    },
    {
      id: 'tarea-3',
      curso_id: 'curso-1',
      titulo: 'Programa en Python',
      descripcion: 'Crear programa que calcule el factorial',
      fecha_entrega: '2024-05-15',
      puntaje_total: 10,
      createdAt: '2024-05-01',
    },
  ],

  entregas: [
    { id: 'ent-1', tarea_id: 'tarea-1', estudiante_id: 'estudiante-1', archivo: 'db_design.pdf', fecha_entrega: '2024-04-19', calificacion: 9, comentarios: 'Buen diseño' },
    { id: 'ent-2', tarea_id: 'tarea-1', estudiante_id: 'estudiante-2', archivo: 'db_design_v2.pdf', fecha_entrega: '2024-04-18', calificacion: 10, comentarios: 'Excelente' },
    { id: 'ent-3', tarea_id: 'tarea-2', estudiante_id: 'estudiante-1', archivo: 'sql_queries.sql', fecha_entrega: '2024-05-09', calificacion: 14, comentarios: 'Falta optimización' },
  ],

  asistencias: [
    // Curso 3 - Abril
    { id: 'asi-1', curso_id: 'curso-3', estudiante_id: 'estudiante-1', fecha: '2024-04-01', estado: 'presente' },
    { id: 'asi-2', curso_id: 'curso-3', estudiante_id: 'estudiante-1', fecha: '2024-04-03', estado: 'presente' },
    { id: 'asi-3', curso_id: 'curso-3', estudiante_id: 'estudiante-1', fecha: '2024-04-05', estado: 'tardanza' },
    { id: 'asi-4', curso_id: 'curso-3', estudiante_id: 'estudiante-1', fecha: '2024-04-08', estado: 'ausente' },
    { id: 'asi-5', curso_id: 'curso-3', estudiante_id: 'estudiante-1', fecha: '2024-04-10', estado: 'presente' },

    { id: 'asi-6', curso_id: 'curso-3', estudiante_id: 'estudiante-2', fecha: '2024-04-01', estado: 'presente' },
    { id: 'asi-7', curso_id: 'curso-3', estudiante_id: 'estudiante-2', fecha: '2024-04-03', estado: 'presente' },
    { id: 'asi-8', curso_id: 'curso-3', estudiante_id: 'estudiante-2', fecha: '2024-04-05', estado: 'presente' },
    { id: 'asi-9', curso_id: 'curso-3', estudiante_id: 'estudiante-2', fecha: '2024-04-08', estado: 'presente' },
    { id: 'asi-10', curso_id: 'curso-3', estudiante_id: 'estudiante-2', fecha: '2024-04-10', estado: 'presente' },
  ],

  horarios: [
    { id: 'hor-1', curso_id: 'curso-3', dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', aula: 'A101' },
    { id: 'hor-2', curso_id: 'curso-3', dia: 'Miércoles', hora_inicio: '08:00', hora_fin: '10:00', aula: 'A101' },
    { id: 'hor-3', curso_id: 'curso-3', dia: 'Viernes', hora_inicio: '08:00', hora_fin: '10:00', aula: 'A101' },
    { id: 'hor-4', curso_id: 'curso-1', dia: 'Martes', hora_inicio: '10:00', hora_fin: '12:00', aula: 'B205' },
    { id: 'hor-5', curso_id: 'curso-1', dia: 'Jueves', hora_inicio: '10:00', hora_fin: '12:00', aula: 'B205' },
  ],
  contenidos: [],
};

import localforage from 'localforage';
import { toast } from 'sonner';

let memoryAppState: AppState = seedData;

const normalizeCursos = (cursos: any[]): Curso[] =>
  cursos.map((curso) => ({
    ...curso,
    modalidad: curso.modalidad === 'virtual' ? 'virtual' : 'presencial',
    zoom_link: curso.zoom_link || '',
  }));

// Initialize localforage with seed data
export async function initializeSeedData() {
  if (typeof window !== 'undefined') {
    localforage.config({ name: 'NuevaSchoolDB', storeName: 'appstate' });
    
    // First, migrate data from localStorage if it exists and localforage is empty
    const oldLocalStorage = localStorage.getItem('nuevaschool_appstate');
    
    const existingData = await localforage.getItem<AppState>('nuevaschool_appstate_v2');
    
    let rawData: any = null;
    if (existingData) {
      rawData = existingData;
    } else if (oldLocalStorage) {
      try {
        rawData = JSON.parse(oldLocalStorage);
        localStorage.removeItem('nuevaschool_appstate'); // Cleanup
      } catch (e) {
        rawData = null;
      }
    }

    if (rawData) {
      memoryAppState = {
        usuarios: (rawData.usuarios && rawData.usuarios.length > 0) ? rawData.usuarios : seedData.usuarios,
        cursos: normalizeCursos(rawData.cursos || seedData.cursos),
        matriculas: rawData.matriculas || seedData.matriculas,
        notas: rawData.notas || seedData.notas,
        tareas: rawData.tareas || seedData.tareas,
        entregas: rawData.entregas || seedData.entregas,
        asistencias: rawData.asistencias || seedData.asistencias,
        horarios: rawData.horarios || seedData.horarios,
        contenidos: rawData.contenidos || seedData.contenidos
      };
      await localforage.setItem('nuevaschool_appstate_v2', memoryAppState);
    } else {
      memoryAppState = seedData;
      await localforage.setItem('nuevaschool_appstate_v2', seedData);
    }
    
    if (!localStorage.getItem('nuevaschool_auth')) {
      localStorage.setItem('nuevaschool_auth', JSON.stringify(null));
    }
  }
}

// Get all app state synchronously from memory
export function getAppState(): AppState {
  return memoryAppState;
}

// Save app state to IndexedDB asynchronously
export async function saveAppState(state: AppState) {
  memoryAppState = state;
  if (typeof window !== 'undefined') {
    try {
      await localforage.setItem('nuevaschool_appstate_v2', state);
    } catch (error: any) {
      toast.error('Error guardando en la base de datos IndexedDB.');
      console.error("Storage error:", error);
    }
  }
}
