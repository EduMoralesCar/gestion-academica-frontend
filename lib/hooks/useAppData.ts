import { useCallback, useState, useEffect } from 'react';
import { AppState, Nota, Tarea, Entrega, Asistencia, Matricula, Curso } from '@/lib/types';
import { toast } from 'sonner';

export const useAppData = () => {
  const [appState, setAppState] = useState<AppState>({
    usuarios: [],
    cursos: [],
    matriculas: [],
    notas: [],
    tareas: [],
    entregas: [],
    asistencias: [],
    horarios: [],
    contenidos: [],
  });

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nuevaschool_token') : null;
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nuevaschool_token') : null;
      console.log("[useAppData] Iniciando carga de datos. Token en localStorage:", token ? "PRESENTE (empieza con " + token.substring(0, 10) + ")" : "AUSENTE");
      if (!token) return;

      const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('nuevaschool_auth') : null;
      let userRole = null;
      if (storedAuth) {
        try {
          userRole = JSON.parse(storedAuth)?.rol;
        } catch (e) {}
      }
      const shouldFetchUsers = userRole === 'ADMIN' || userRole === 'DOCENTE';

      const [
        resUsuarios,
        resCursos,
        resMatriculas,
        resNotas,
        resTareas,
        resEntregas,
        resAsistencias,
        resContenidos
      ] = await Promise.all([
        shouldFetchUsers ? fetchWithAuth('/api/usuarios/') : Promise.resolve({ ok: true, status: 200, json: async () => [] } as any),
        fetchWithAuth('/api/cursos/'),
        fetchWithAuth('/api/matriculas/'),
        fetchWithAuth('/api/notas/'),
        fetchWithAuth('/api/tareas/'),
        fetchWithAuth('/api/entregas/'),
        fetchWithAuth('/api/asistencias/'),
        fetchWithAuth('/api/contenidos/')
      ]);

      console.log("[useAppData] Estados de respuesta HTTP:", {
        usuarios: resUsuarios.status,
        cursos: resCursos.status,
        matriculas: resMatriculas.status,
        notas: resNotas.status,
        tareas: resTareas.status,
        entregas: resEntregas.status,
        asistencias: resAsistencias.status,
        contenidos: resContenidos.status
      });

      if (resUsuarios.status === 401 || resCursos.status === 401) {
        console.warn("Sesión inválida o expirada. Limpiando localStorage...");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nuevaschool_token');
          localStorage.removeItem('nuevaschool_auth');
          window.location.href = '/';
        }
        return;
      }

      const [
        usuarios,
        cursos,
        matriculas,
        notas,
        tareas,
        entregas,
        asistencias,
        contenidos
      ] = await Promise.all([
        resUsuarios.ok ? resUsuarios.json() : Promise.resolve([]),
        resCursos.ok ? resCursos.json() : Promise.resolve([]),
        resMatriculas.ok ? resMatriculas.json() : Promise.resolve([]),
        resNotas.ok ? resNotas.json() : Promise.resolve([]),
        resTareas.ok ? resTareas.json() : Promise.resolve([]),
        resEntregas.ok ? resEntregas.json() : Promise.resolve([]),
        resAsistencias.ok ? resAsistencias.json() : Promise.resolve([]),
        resContenidos.ok ? resContenidos.json() : Promise.resolve([])
      ]);

      // Adaptar contenidos (archivo_url -> archivo)
      const adaptedContenidos = contenidos.map((c: any) => ({
        ...c,
        archivo: c.archivo_url || ''
      }));

      // Mantener horarios estáticos o simulados
      const seedHorarios = [
        { id: 'hor-1', curso_id: 'curso-3', dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', aula: 'A101' },
        { id: 'hor-2', curso_id: 'curso-3', dia: 'Miércoles', hora_inicio: '08:00', hora_fin: '10:00', aula: 'A101' },
        { id: 'hor-3', curso_id: 'curso-3', dia: 'Viernes', hora_inicio: '08:00', hora_fin: '10:00', aula: 'A101' },
        { id: 'hor-4', curso_id: 'curso-1', dia: 'Martes', hora_inicio: '10:00', hora_fin: '12:00', aula: 'B205' },
        { id: 'hor-5', curso_id: 'curso-1', dia: 'Jueves', hora_inicio: '10:00', hora_fin: '12:00', aula: 'B205' },
      ];

      setAppState({
        usuarios,
        cursos,
        matriculas,
        notas,
        tareas,
        entregas,
        asistencias,
        contenidos: adaptedContenidos,
        horarios: seedHorarios
      });
    } catch (e) {
      console.error("Error loading application state from API:", e);
    }
  }, [fetchWithAuth]);

  // Cargar datos al montar el componente si está autenticado
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Notas
  const addNota = async (nota: Nota) => {
    try {
      const res = await fetchWithAuth('/api/notas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricula_id: nota.matricula_id,
          tipo: nota.tipo,
          calificacion: Number(nota.calificacion),
          peso: Number(nota.peso)
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({ ...prev, notas: [...prev.notas, saved] }));
      } else {
        const err = await res.json();
        let errMsg = 'Error al registrar la calificación';
        if (err && err.detail) {
          errMsg = Array.isArray(err.detail) ? err.detail.map((d: any) => d.msg).join(', ') : err.detail;
        }
        toast.error(errMsg);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión al registrar la calificación');
    }
  };

  const updateNota = async (notaId: string, updates: Partial<Nota>) => {
    try {
      const currentNota = appState.notas.find(n => n.id === notaId);
      if (!currentNota) return;
      const updatedNota = { ...currentNota, ...updates };

      const res = await fetchWithAuth(`/api/notas/${notaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricula_id: updatedNota.matricula_id,
          tipo: updatedNota.tipo,
          calificacion: Number(updatedNota.calificacion),
          peso: Number(updatedNota.peso)
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({
          ...prev,
          notas: prev.notas.map(n => n.id === notaId ? saved : n)
        }));
      } else {
        const err = await res.json();
        let errMsg = 'Error al actualizar la calificación';
        if (err && err.detail) {
          errMsg = Array.isArray(err.detail) ? err.detail.map((d: any) => d.msg).join(', ') : err.detail;
        }
        toast.error(errMsg);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión al actualizar la calificación');
    }
  };

  const getNotasByMatricula = (matriculaId: string) => {
    return appState.notas.filter(n => n.matricula_id === matriculaId);
  };

  const getNotasByCurso = (cursoId: string) => {
    const matriculas = appState.matriculas.filter(m => m.curso_id === cursoId);
    return appState.notas.filter(n => matriculas.some(m => m.id === n.matricula_id));
  };

  // Tareas
  const addTarea = async (tarea: Tarea) => {
    try {
      const res = await fetchWithAuth('/api/tareas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso_id: tarea.curso_id,
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          fecha_entrega: new Date(tarea.fecha_entrega).toISOString(),
          puntaje_total: Number(tarea.puntaje_total),
          archivo_referencia: tarea.archivo_referencia || null
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({ ...prev, tareas: [...prev.tareas, saved] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTareasByCurso = (cursoId: string) => {
    return appState.tareas.filter(t => t.curso_id === cursoId);
  };

  const updateTarea = async (tareaId: string, updates: Partial<Tarea>) => {
    try {
      const currentTarea = appState.tareas.find(t => t.id === tareaId);
      if (!currentTarea) return;
      const updatedTarea = { ...currentTarea, ...updates };

      const res = await fetchWithAuth(`/api/tareas/${tareaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso_id: updatedTarea.curso_id,
          titulo: updatedTarea.titulo,
          descripcion: updatedTarea.descripcion,
          fecha_entrega: new Date(updatedTarea.fecha_entrega).toISOString(),
          puntaje_total: Number(updatedTarea.puntaje_total),
          archivo_referencia: updatedTarea.archivo_referencia || null
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({
          ...prev,
          tareas: prev.tareas.map(t => t.id === tareaId ? saved : t)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTarea = async (tareaId: string) => {
    try {
      const res = await fetchWithAuth(`/api/tareas/${tareaId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppState(prev => ({
          ...prev,
          tareas: prev.tareas.filter(t => t.id !== tareaId),
          entregas: prev.entregas.filter(e => e.tarea_id !== tareaId),
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Entregas
  const addEntrega = async (entrega: Entrega) => {
    try {
      const res = await fetchWithAuth('/api/entregas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarea_id: entrega.tarea_id,
          archivo: entrega.archivo
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({ ...prev, entregas: [...prev.entregas, saved] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateEntrega = async (entregaId: string, updates: Partial<Entrega>) => {
    try {
      const currentEntrega = appState.entregas.find(e => e.id === entregaId);
      if (!currentEntrega) return;
      const updatedEntrega = { ...currentEntrega, ...updates };

      const isGrading = updates.calificacion !== undefined || updates.comentarios !== undefined;

      let res;
      if (isGrading) {
        res = await fetchWithAuth(`/api/entregas/${entregaId}/calificar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calificacion: updatedEntrega.calificacion !== null ? Number(updatedEntrega.calificacion) : null,
            comentarios: updatedEntrega.comentarios || ""
          })
        });
      } else {
        res = await fetchWithAuth(`/api/entregas/${entregaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tarea_id: updatedEntrega.tarea_id,
            archivo: updatedEntrega.archivo
          })
        });
      }

      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({
          ...prev,
          entregas: prev.entregas.map(e => e.id === entregaId ? saved : e)
        }));
      } else {
        const err = await res.json();
        let errMsg = 'Error al actualizar la entrega';
        if (err && err.detail) {
          errMsg = Array.isArray(err.detail) ? err.detail.map((d: any) => d.msg).join(', ') : err.detail;
        }
        toast.error(errMsg);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión al actualizar la entrega');
    }
  };

  const getEntregasByTarea = (tareaId: string) => {
    return appState.entregas.filter(e => e.tarea_id === tareaId);
  };

  const getEntregasByEstudiante = (estudianteId: string) => {
    return appState.entregas.filter(e => e.estudiante_id === estudianteId);
  };

  // Asistencia
  const addAsistencia = async (asistencia: Asistencia) => {
    try {
      const res = await fetchWithAuth('/api/asistencias/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso_id: asistencia.curso_id,
          estudiante_id: asistencia.estudiante_id,
          fecha: new Date(asistencia.fecha).toISOString(),
          estado: asistencia.estado
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({ ...prev, asistencias: [...prev.asistencias, saved] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateAsistencia = async (asistenciaId: string, updates: Partial<Asistencia>) => {
    // Soportar actualización local si es necesario, aunque en BD usualmente se insertan nuevas marcas
    setAppState(prev => ({
      ...prev,
      asistencias: prev.asistencias.map(a => (a.id === asistenciaId ? { ...a, ...updates } : a)),
    }));
  };

  const getAsistenciasByCurso = (cursoId: string) => {
    return appState.asistencias.filter(a => a.curso_id === cursoId);
  };

  const getAsistenciasByEstudiante = (estudianteId: string, cursoId?: string) => {
    return appState.asistencias.filter(
      a => a.estudiante_id === estudianteId && (!cursoId || a.curso_id === cursoId)
    );
  };

  // Matrículas
  const getMatriculasByEstudiante = (estudianteId: string) => {
    return (appState.matriculas || []).filter(m => m.estudiante_id === estudianteId && m.estado === 'activo');
  };

  const getMatriculasByCurso = (cursoId: string) => {
    return (appState.matriculas || []).filter(m => m.curso_id === cursoId && m.estado === 'activo');
  };

  const addMatricula = async (matricula: any) => {
    try {
      const res = await fetchWithAuth('/api/matriculas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudiante_id: matricula.estudiante_id,
          curso_id: matricula.curso_id
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setAppState(prev => ({ ...prev, matriculas: [...prev.matriculas, saved] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeMatricula = async (matriculaId: string) => {
    try {
      const res = await fetchWithAuth(`/api/matriculas/${matriculaId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppState(prev => ({
          ...prev,
          matriculas: prev.matriculas.filter(m => m.id !== matriculaId)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cursos
  const getCursosByDocente = (docenteId: string) => {
    return (appState.cursos || []).filter(c => c.docente_id === docenteId);
  };

  const getCursoById = (cursoId: string) => {
    return (appState.cursos || []).find(c => c.id === cursoId);
  };

  const addCurso = async (curso: any) => {
    try {
      const res = await fetchWithAuth('/api/cursos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: curso.nombre,
          codigo: curso.codigo,
          creditos: Number(curso.creditos),
          ciclo: Number(curso.ciclo),
          modalidad: curso.modalidad,
          zoom_link: curso.zoom_link || null
        })
      });
      if (res.ok) {
        const saved = await res.json();
        
        if (curso.docente_id) {
          await fetchWithAuth('/api/asignaciones/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              docente_id: curso.docente_id,
              curso_id: saved.id
            })
          });
          saved.docente_id = curso.docente_id;
        }

        setAppState(prev => ({ ...prev, cursos: [...prev.cursos, saved] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateCurso = async (cursoId: string, updates: any) => {
    try {
      const currentCurso = appState.cursos.find(c => c.id === cursoId);
      if (!currentCurso) return;
      const updatedCurso = { ...currentCurso, ...updates };

      const res = await fetchWithAuth(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: updatedCurso.nombre,
          codigo: updatedCurso.codigo,
          creditos: Number(updatedCurso.creditos),
          ciclo: Number(updatedCurso.ciclo),
          modalidad: updatedCurso.modalidad,
          zoom_link: updatedCurso.zoom_link || null
        })
      });

      if (res.ok) {
        const saved = await res.json();
        saved.docente_id = updatedCurso.docente_id;

        if (updates.docente_id && updates.docente_id !== currentCurso.docente_id) {
          const asignacionesRes = await fetchWithAuth(`/api/asignaciones/?curso_id=${cursoId}`);
          if (asignacionesRes.ok) {
            const asigs = await asignacionesRes.json();
            if (asigs.length > 0) {
              await fetchWithAuth(`/api/asignaciones/${asigs[0].id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  docente_id: updates.docente_id,
                  curso_id: cursoId
                })
              });
            } else {
              await fetchWithAuth('/api/asignaciones/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  docente_id: updates.docente_id,
                  curso_id: cursoId
                })
              });
            }
          }
        }

        setAppState(prev => ({
          ...prev,
          cursos: prev.cursos.map(c => c.id === cursoId ? saved : c)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCurso = async (cursoId: string) => {
    try {
      const res = await fetchWithAuth(`/api/cursos/${cursoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppState(prev => ({
          ...prev,
          cursos: prev.cursos.filter(c => c.id !== cursoId)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Contenidos (Semanas)
  const getContenidosByCurso = (cursoId: string) => {
    return appState.contenidos?.filter(c => c.curso_id === cursoId).sort((a, b) => a.semana_numero - b.semana_numero) || [];
  };

  const addContenido = async (contenido: any) => {
    try {
      const res = await fetchWithAuth('/api/contenidos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso_id: contenido.curso_id,
          semana_numero: Number(contenido.semana_numero),
          titulo: contenido.titulo,
          descripcion: contenido.descripcion || null,
          archivo_url: contenido.archivo || null
        })
      });
      if (res.ok) {
        const saved = await res.json();
        saved.archivo = saved.archivo_url;
        setAppState(prev => ({ ...prev, contenidos: [...prev.contenidos, saved] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateContenido = async (contenidoId: string, updates: any) => {
    try {
      const currentCont = appState.contenidos.find(c => c.id === contenidoId);
      if (!currentCont) return;
      const updatedCont = { ...currentCont, ...updates };

      const res = await fetchWithAuth(`/api/contenidos/${contenidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso_id: updatedCont.curso_id,
          semana_numero: Number(updatedCont.semana_numero),
          titulo: updatedCont.titulo,
          descripcion: updatedCont.descripcion || null,
          archivo_url: updatedCont.archivo || null
        })
      });
      if (res.ok) {
        const saved = await res.json();
        saved.archivo = saved.archivo_url;
        setAppState(prev => ({
          ...prev,
          contenidos: prev.contenidos.map(c => c.id === contenidoId ? saved : c)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteContenido = async (contenidoId: string) => {
    try {
      const res = await fetchWithAuth(`/api/contenidos/${contenidoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppState(prev => ({
          ...prev,
          contenidos: prev.contenidos.filter(c => c.id !== contenidoId)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateAppState = useCallback(async (newState: Partial<AppState>) => {
    if (newState.usuarios) {
      const currentUsers = appState.usuarios;
      const newUsers = newState.usuarios;

      if (newUsers.length < currentUsers.length) {
        const deletedUser = currentUsers.find(u => !newUsers.some(nu => nu.id === u.id));
        if (deletedUser) {
          try {
            await fetchWithAuth(`/api/usuarios/${deletedUser.id}`, { method: 'DELETE' });
          } catch (e) {
            console.error("Error deleting user:", e);
          }
        }
      } else if (newUsers.length > currentUsers.length) {
        const createdUser = newUsers.find(nu => !currentUsers.some(u => u.id === nu.id)) as any;
        if (createdUser) {
          try {
            const res = await fetchWithAuth('/api/auth/registro', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: createdUser.email,
                nombre: createdUser.nombre,
                apellido: createdUser.apellido,
                rol: createdUser.rol,
                password: createdUser.password || 'estudiante123',
                profilePicture: createdUser.profilePicture || null,
                codigo: createdUser.codigo || null,
                carrera: createdUser.carrera || null,
                ciclo: createdUser.ciclo ? Number(createdUser.ciclo) : null,
                especialidad: createdUser.especialidad || null,
                departamento: createdUser.departamento || null,
                nivel_acceso: createdUser.nivel_acceso || null
              })
            });
            if (res.ok) {
              const savedUser = await res.json();
              newState.usuarios = newUsers.map(u => u.id === createdUser.id ? savedUser : u);
            }
          } catch (e) {
            console.error("Error creating user:", e);
          }
        }
      } else {
        const modifiedUser = newUsers.find(nu => {
          const old = currentUsers.find(u => u.id === nu.id);
          return old && JSON.stringify(old) !== JSON.stringify(nu);
        }) as any;
        if (modifiedUser) {
          try {
            await fetchWithAuth(`/api/usuarios/${modifiedUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: modifiedUser.email,
                nombre: modifiedUser.nombre,
                apellido: modifiedUser.apellido,
                rol: modifiedUser.rol,
                profilePicture: modifiedUser.profilePicture || null,
                codigo: modifiedUser.codigo || null,
                carrera: modifiedUser.carrera || null,
                ciclo: modifiedUser.ciclo ? Number(modifiedUser.ciclo) : null,
                especialidad: modifiedUser.especialidad || null,
                departamento: modifiedUser.departamento || null,
                nivel_acceso: modifiedUser.nivel_acceso || null
              })
            });
          } catch (e) {
            console.error("Error updating user:", e);
          }
        }
      }
    }

    setAppState(prevState => ({
      ...prevState,
      ...newState
    }));
  }, [appState.usuarios, fetchWithAuth]);

  return {
    appState,
    updateAppState,
    // Notas
    addNota,
    updateNota,
    getNotasByMatricula,
    getNotasByCurso,
    // Tareas
    addTarea,
    updateTarea,
    deleteTarea,
    getTareasByCurso,
    // Entregas
    addEntrega,
    updateEntrega,
    getEntregasByTarea,
    getEntregasByEstudiante,
    // Asistencia
    addAsistencia,
    updateAsistencia,
    getAsistenciasByCurso,
    getAsistenciasByEstudiante,
    // Matrículas
    getMatriculasByEstudiante,
    getMatriculasByCurso,
    addMatricula,
    removeMatricula,
    // Cursos
    getCursosByDocente,
    getCursoById,
    addCurso,
    updateCurso,
    deleteCurso,
    // Contenidos (Semanas)
    getContenidosByCurso,
    addContenido,
    updateContenido,
    deleteContenido,
  };
};
