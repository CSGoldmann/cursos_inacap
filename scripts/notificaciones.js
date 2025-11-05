// --- conexión con el servidor ---
const socket = io();

// --- funciones de notificación ---
function agregarNotificacion(mensaje) {
  const notificaciones = JSON.parse(localStorage.getItem("notificaciones")) || [];
  notificaciones.push({ mensaje, fecha: new Date().toLocaleString() });
  localStorage.setItem("notificaciones", JSON.stringify(notificaciones));
  actualizarCampanita();
}

function cargarNotificaciones() {
  const notificaciones = JSON.parse(localStorage.getItem("notificaciones")) || [];
  const notifList = document.getElementById("notif-list");
  const notifCount = document.getElementById("notif-count");

  if (!notifList) return;

  notifList.innerHTML = notificaciones.length
    ? notificaciones.map(n => `<div class="px-3 py-2 border-bottom small">${n.mensaje}<br><span class="text-muted">${n.fecha}</span></div>`).join("")
    : '<div class="px-3 py-3 text-center text-secondary small">No hay notificaciones</div>';

  if (notifCount) {
    notifCount.textContent = notificaciones.length || '';
    notifCount.classList.toggle('d-none', notificaciones.length === 0);
  }
}

function actualizarCampanita() {
  const notificaciones = JSON.parse(localStorage.getItem("notificaciones")) || [];
  const notifCount = document.getElementById("notif-count");
  if (notifCount) {
    notifCount.textContent = notificaciones.length || '';
    notifCount.classList.toggle('d-none', notificaciones.length === 0);
  }
}

// --- eventos Socket.IO ---
socket.on("notificacion_diploma", (data) => {
  console.log("🎓 Notificación diploma:", data);
  alert("🎓 Diploma emitido: " + data.mensaje);
  console.log("Guardando notificación en localStorage...");
  agregarNotificacion("🎓 " + data.mensaje);
});

socket.on("notificacion_admin", (data) => {
  console.log("📚 Notificación admin:", data);
  alert("📚 Nuevo curso publicado: " + data.titulo);
  agregarNotificacion("📚 " + data.titulo);
});

// --- cargar al inicio ---
document.addEventListener('DOMContentLoaded', () => {
  cargarNotificaciones();
});

// --- función accesible desde la consola ---
window.emitirDiploma = function() {
  const data = { mensaje: "Se ha emitido un nuevo diploma" };
  socket.emit("notificacion_diploma", data);
};