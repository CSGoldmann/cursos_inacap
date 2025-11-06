// scripts/inscripciones.js
// Manejo de inscripciones a cursos

const API_BASE_URL = 'http://localhost:3000/api';

// Inscribirse a un curso
async function inscribirseACurso(cursoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/inscripciones/${cursoId}`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok && data.success) {
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
async function actualizarProgreso(cursoId, leccionId, completado, progreso) {
  try {
    const response = await fetch(`${API_BASE_URL}/inscripciones/${cursoId}/progreso/${leccionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ completado, progreso })
    });

    const data = await response.json();
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

