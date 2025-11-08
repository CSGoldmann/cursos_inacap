// scripts/inscripciones.js
// Manejo de inscripciones a cursos

// Variable global compartida para la URL base de la API
if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:3000/api';
}
// Usar directamente window.API_BASE_URL o crear alias local sin const
var API_BASE_URL = window.API_BASE_URL;

// Inscribirse a un curso
async function inscribirseACurso(cursoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/inscripciones/${cursoId}`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      window.dispatchEvent(new CustomEvent('inscripcion:cambio', {
        detail: {
          tipo: 'nueva',
          inscripcion: data.inscripcion
        }
      }));
      return { success: true, inscripcion: data.inscripcion, message: data.message };
    } else {
      return { success: false, error: data.error || 'Error al inscribirse' };
    }
  } catch (error) {
    console.error('Error al inscribirse:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Verificar si está inscrito
async function estaInscrito(cursoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/inscripciones/${cursoId}/estado`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.inscrito;
    }
    return false;
  } catch (error) {
    console.error('Error al verificar inscripción:', error);
    return false;
  }
}

// Obtener inscripciones del usuario
async function obtenerInscripciones() {
  try {
    const response = await fetch(`${API_BASE_URL}/inscripciones/usuario`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.inscripciones || data || [];
    }
    return [];
  } catch (error) {
    console.error('Error al obtener inscripciones:', error);
    return [];
  }
}

// Actualizar progreso de lección
async function actualizarProgreso(cursoId, leccionId, datos = {}) {
  try {
    const payload = {};

    if (datos.completado !== undefined) payload.completado = datos.completado;
    if (datos.progreso !== undefined) payload.progreso = datos.progreso;
    if (datos.videoCompletado !== undefined) payload.videoCompletado = datos.videoCompletado;

    const response = await fetch(`${API_BASE_URL}/inscripciones/${cursoId}/progreso/${leccionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.success) {
      window.dispatchEvent(new CustomEvent('inscripcion:cambio', {
        detail: {
          tipo: 'progreso',
          cursoId,
          leccionId,
          completado: datos.completado,
          progreso: datos.progreso,
          videoCompletado: datos.videoCompletado,
          inscripcion: data.inscripcion || null
        }
      }));
    }
    return data.success;
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    return false;
  }
}

// Exportar funciones
window.inscripcionesAPI = {
  inscribirse: inscribirseACurso,
  estaInscrito,
  obtenerInscripciones,
  actualizarProgreso
};

