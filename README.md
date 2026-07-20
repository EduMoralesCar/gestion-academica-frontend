<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-007ACC?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</div>

<h1 align="center">🎓 NuevaSchool - Sistema Integral de Gestión Académica</h1>

<p align="center">
  Plataforma web moderna y robusta para la administración de instituciones educativas, gestión de calificaciones, control de asistencia y aulas virtuales.
</p>

<div align="center">
  <h3>
    <a href="https://nuevaschool.onrender.com">🚀 VER DEMO EN VIVO</a>
  </h3>
</div>

---

## 🌟 Sobre el Proyecto

**NuevaSchool** nace con el objetivo de profesionalizar la gestión académica mediante una interfaz moderna, rápida y adaptable (Mobile-First). El sistema permite una interconexión fluida entre tres roles principales: **Administradores, Docentes y Estudiantes**, agilizando procesos que normalmente consumen tiempo en las instituciones tradicionales.

## ✨ Funcionalidades Principales

El proyecto utiliza una arquitectura de base de datos local (IndexedDB a través de `localForage`) para garantizar una persistencia de datos ultra-rápida en el entorno del navegador, permitiendo crear, editar y eliminar registros sin necesidad de una API externa durante esta fase del despliegue.

### 👑 Panel de Administrador
- **Dashboard Estadístico:** Gráficos dinámicos con el recuento total de alumnos, docentes y carreras.
- **Gestión de Usuarios (CRUD):** Creación y administración completa de perfiles institucionales.
- **Gestión de Cursos y Matrículas:** Asignación de docentes a materias y matriculación de estudiantes a los mismos.

### 👨‍🏫 Módulo para Docentes
- **Panel de Clases:** Resumen de las materias asignadas y estudiantes a cargo.
- **Registro de Evaluaciones:** Interfaz ágil para la calificación de notas (PC1, Parcial, Final) con promedios automáticos.
- **Control de Asistencia:** Registro diario de inasistencias y tardanzas.
- **Gestión de Tareas:** Publicación de asignaciones para que los alumnos entregen sus trabajos.

### 👨‍🎓 Portal del Estudiante
- **Historial Académico:** Visualización en tiempo real del promedio de sus cursos.
- **Aulas Virtuales:** Acceso a temarios, entrega de tareas en PDF y visualización de notas.
- **Reporte de Asistencias:** Verificación de su estado en cada clase dictada.
- **Inicio de Sesión Holográfico:** Acceso biométrico interactivo con escaneo facial por cámara web en tiempo real, incluyendo barrido láser, retícula de enfoque y mapeo de contornos del rostro (landmarks) en vivo.

---

## 🔑 Credenciales de Acceso (Demo)

Puedes ingresar al demo en vivo utilizando los siguientes correos y contraseñas. Cada uno te llevará a un Dashboard distinto según los permisos de su rol:

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@nuevaschool.pe` | `admin123` |
| **Docente** | `docente@nuevaschool.pe` | `docente123` |
| **Estudiante** | `estudiante@nuevaschool.pe` | `estudiante123` |

> **Nota:** Puedes crear nuevos usuarios en el panel de Administrador y asignarles sus propios correos y contraseñas. ¡Tienen validación de dominio obligatoria!

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** Next.js (App Router), React, TypeScript.
- **Estilos:** TailwindCSS, Componentes de UI basados en Shadcn.
- **Persistencia de Datos:** IndexedDB (`localForage`).
- **Iconos:** Lucide-React.
- **Despliegue:** Render.

---

## 🚀 Despliegue Local (Para Desarrolladores)

Si deseas clonar el proyecto y correrlo en tu máquina:

1. **Clonar el repositorio:**
```bash
git clone https://github.com/Luxorift/gestion-academica-frontend.git
cd gestion-academica-frontend
```

2. **Instalar dependencias:**
```bash
npm install
# o con pnpm
pnpm install
```

3. **Ejecutar en modo desarrollo:**
```bash
npm run dev
```

4. **Abrir en tu navegador:**
Navega a `http://localhost:3000` para ver la aplicación funcionando localmente.

5. **Ejecutar auditoría:**
```bash
npx unlighthouse --site https://nuevaschool.onrender.com/
```

---
