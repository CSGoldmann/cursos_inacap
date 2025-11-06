// scripts/notificaciones-api.js
// API para notificaciones desde base de datos

const API_BASE_URL = 'http://localhost:3000/api';

// Obtener notificaciones
async function obtenerNotificaciones(leidas = null) {
  try {
    let url = `${API_BASE_URL}/notificaciones`;
    if (leidas !== null) {
      url += `?leidas=${leidas}`;
    }

    const response = await fetch(url, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { notificaciones: [], noLeidas: 0 };
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return { notificaciones: [], noLeidas: 0 };
  }
}

// Marcar como leída
async function marcarComoLeida(notificacionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/leer`, {
      method: 'PUT',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    return false;
  }
}

// Marcar todas como leídas
async function marcarTodasComoLeidas() {
  try {
    const response = await fetch(`${API_BASE_URL}/notificaciones/leer-todas`, {
      method: 'PUT',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    return false;
  }
}

// Eliminar notificación
async function eliminarNotificacion(notificacionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return false;
  }
}

// Cargar y mostrar notificaciones
async function cargarNotificaciones() {
  const data = await obtenerNotificaciones();
  const list = document.getElementById("notif-list");
  const countEl = document.getElementById("notif-count");
  
  if (!list || !countEl) return;

  list.innerHTML = "";

  if (data.notificaciones.length === 0) {
    list.innerHTML = '<div class="px-3 py-3 text-center text-secondary small">No hay notificaciones</div>';
    countEl.classList.add("d-none");
    return;
  }

  data.notificaciones.forEach((n) => {
    const li = document.createElement("li");
    li.className = `notification-item px-3 py-2 border-bottom small ${n.leida ? '' : 'fw-bold'}`;
    
    const fecha = new Date(n.fechaCreacion).toLocaleString('es-ES');
    li.innerHTML = `
      <div>
        <b>${n.titulo}</b><br>
        <span class="text-muted">${n.mensaje}</span><br>
        <small class="text-muted">${fecha}</small>
      </div>
    `;
    
    if (n.link) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        window.location.href = n.link;
        marcarComoLeida(n._id);
      });
    }
    
    list.appendChild(li);
  });

  countEl.textContent = data.noLeidas;
  if (data.noLeidas > 0) {
    countEl.classList.remove("d-none");
  } else {
    countEl.classList.add("d-none");
  }
}

// Marcar todas como leídas (botón)
window.marcarTodasNotificacionesLeidas = async function() {
  await marcarTodasComoLeidas();
  await cargarNotificaciones();
};

// Exportar funciones
window.notificacionesAPI = {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  cargarNotificaciones
};

// Cargar notificaciones al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar si el usuario está autenticado
  if (window.auth && await window.auth.init()) {
    await cargarNotificaciones();
    // Recargar notificaciones cada 30 segundos
    setInterval(cargarNotificaciones, 30000);
  }
});

