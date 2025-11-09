// scripts/examenes.js
// API para exámenes

// Variable global compartida para la URL base de la API
if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:3000/api';
}
// Usar directamente window.API_BASE_URL o crear alias local sin const
var API_BASE_URL = window.API_BASE_URL;

// Obtener examen de una sección o final
async function obtenerExamen(cursoId, seccionId, esFinal = false) {
  try {
    let url = `${API_BASE_URL}/examenes/curso/${cursoId}`;
    if (esFinal) {
      url += '?tipo=final';
    } else if (seccionId) {
      url += `?seccion=${seccionId}`;
    } else {
      // Si no es final ni tiene seccionId, buscar examen de sección
      url += '?tipo=seccion';
    }

    const response = await fetch(url, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return { examen: data.examen || data };
    }

    let data = null;
    let mensaje = null;
    try {
      data = await response.json();
      mensaje = data.error;
    } catch (error) {
      data = null;
      mensaje = null;
    }

    if (response.status === 404) {
      return { examen: null, error: mensaje || 'No se encontró examen para esta sección.' };
    }

    if (response.status === 403) {
      return {
        examen: null,
        error: mensaje || 'Completa los módulos requeridos antes de rendir el examen.',
        diploma: data?.diploma || null
      };
    }

    return { examen: null, error: mensaje || 'No fue posible obtener el examen.' };
  } catch (error) {
    console.error('Error al obtener examen:', error);
    return { examen: null, error: 'Error de conexión al obtener el examen.' };
  }
}

// Enviar examen
async function enviarExamen(cursoId, examenId, respuestas) {
  try {
    const response = await fetch(`${API_BASE_URL}/examenes/${examenId}/enviar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        cursoId,
        respuestas
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al enviar examen:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Obtener resultados de exámenes del usuario
async function obtenerResultadosExamenes(cursoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/examenes/curso/${cursoId}/resultados`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    return [];
  }
}

// Exportar funciones
window.examenesAPI = {
  obtenerExamen,
  enviarExamen,
  obtenerResultadosExamenes
};

