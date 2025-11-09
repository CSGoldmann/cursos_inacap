// scripts/diplomas-api.js
// API cliente para gestionar diplomas

if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:3000/api';
}

var API_BASE_URL = window.API_BASE_URL;

async function obtenerDiplomas() {
  try {
    const response = await fetch(`${API_BASE_URL}/diplomas`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.diplomas || [];
    }

    return [];
  } catch (error) {
    console.error('Error al obtener diplomas:', error);
    return [];
  }
}

async function obtenerDiplomaCurso(cursoId) {
  if (!cursoId) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/diplomas/curso/${cursoId}`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.diploma || null;
    }

    if (response.status === 404) {
      return null;
    }

    const errorData = await response.json().catch(() => ({}));
    console.warn('No se pudo obtener el diploma del curso:', errorData.error);
    return null;
  } catch (error) {
    console.error('Error al obtener diploma del curso:', error);
    return null;
  }
}

window.diplomasAPI = {
  obtenerDiplomas,
  obtenerDiplomaCurso
};

