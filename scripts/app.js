// scripts/app.js

console.log("✅ app.js cargado correctamente");

// =========================
// 🔌 Conexión con Socket.IO
// =========================
const socket = io("http://localhost:3000");

// Cuando el cliente se conecta correctamente
socket.on("connect", () => {
  console.log("🟢 Conectado al servidor con ID:", socket.id);
});

// Escuchar notificaciones desde el servidor
socket.on("notificacion_diploma", (data) => {
  console.log("🎓 Notificación diploma:", data);
  alert("🎓 Diploma emitido: " + data.mensaje);
  agregarNotificacion("🎓 " + data.mensaje);
});

socket.on("notificacion_admin", (data) => {
  console.log("📚 Notificación admin:", data);
  alert("📚 Nuevo curso publicado: " + data.titulo);
  agregarNotificacion("📚 " + data.titulo);
});

// Funciones para emitir eventos hacia el servidor (pueden llamarse desde consola o botones)
window.emitirDiploma = function () {
  socket.emit("diploma_emitido", { mensaje: "Diploma disponible para descarga" });
};

window.nuevoCurso = function () {
  socket.emit("nuevo_curso", { titulo: "Curso de Node.js avanzado" });
};

// ===============================
// 💾 Manejo de notificaciones
// ===============================

// Guarda una notificación en localStorage
function guardarNotificacion(texto) {
  const notificaciones = JSON.parse(localStorage.getItem("notificaciones") || "[]");
  notificaciones.unshift({
    mensaje: texto,
    fecha: new Date().toLocaleString(),
  });
  localStorage.setItem("notificaciones", JSON.stringify(notificaciones));
}

// Carga y muestra las notificaciones guardadas
function cargarNotificaciones() {
  const notificaciones = JSON.parse(localStorage.getItem("notificaciones") || "[]");
  const list = document.getElementById("notif-list");
  const countEl = document.getElementById("notif-count");
  if (!list || !countEl) return;

  list.innerHTML = "";

  if (notificaciones.length === 0) {
    list.innerHTML = '<div class="px-3 py-3 text-center text-secondary small">No hay notificaciones</div>';
    countEl.classList.add("d-none");
    return;
  }

  notificaciones.forEach((n) => {
    const li = document.createElement("li");
    li.className = "notification-item px-3 py-2 border-bottom small";
    li.innerHTML = `<b>${n.mensaje}</b><br><span class="text-muted">${n.fecha}</span>`;
    list.appendChild(li);
  });

  countEl.textContent = notificaciones.length;
  countEl.classList.remove("d-none");
}

// Agrega una notificación nueva
function agregarNotificacion(texto) {
  guardarNotificacion(texto);
  cargarNotificaciones();
}

// Limpia todas las notificaciones (opcional)
window.limpiarNotificaciones = function () {
  localStorage.removeItem("notificaciones");
  cargarNotificaciones();
};

// ===============================
// 🔔 Mostrar/Ocultar panel
// ===============================
window.toggleNotificaciones = function () {
  const panel = document.getElementById("contenedor-notificaciones");
  if (!panel) return;
  panel.classList.toggle("visible");
  cargarNotificaciones();
};

// =============================================
// 🔧 Funcionalidad general de la aplicación web
// =============================================
(function () {
  let inited = false;

  function initApp() {
    if (inited) return;
    inited = true;

    // -- Login --
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "index.html";
      });
    }

    // -- Logout --
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "login.html";
      });
    }

    // -- Imagen de perfil --
    const profilePicInput = document.getElementById("profile-pic-input");
    const profilePicPreview = document.getElementById("profile-pic-preview");
    const removePhotoBtn = document.getElementById("remove-photo");
    const editPictureBtn = document.getElementById("edit-picture");

    if (profilePicInput && profilePicPreview) {
      if (editPictureBtn) {
        editPictureBtn.addEventListener("click", () => profilePicInput.click());
      }
      profilePicInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => (profilePicPreview.src = ev.target.result);
        reader.readAsDataURL(file);
      });
    }

    if (removePhotoBtn && profilePicPreview) {
      removePhotoBtn.addEventListener("click", () => {
        profilePicPreview.src = "Pictures/inacap.png";
        if (profilePicInput) profilePicInput.value = "";
      });
    }

    // -- Notificaciones clicadas --
    const notifList = document.getElementById("notif-list");
    const notifCountEl = document.getElementById("notif-count");

    if (notifList && notifCountEl) {
      notifList.addEventListener("click", (e) => {
        const item = e.target.closest(".notification-item");
        if (!item) return;
        item.classList.add("bg-light", "text-secondary");
        const current = parseInt(notifCountEl.textContent || "0", 10);
        const next = Math.max(0, current - 1);
        notifCountEl.textContent = String(next);
        if (next === 0) notifCountEl.classList.add("d-none");
      });
    }

    // -- Navbar activo --
    const navLinks = document.querySelectorAll(".nav-link");
    if (navLinks.length) {
      const current = location.pathname.split("/").pop() || "index.html";
      navLinks.forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (href === current) a.classList.add("bg-blue-50");
        else a.classList.remove("bg-blue-50");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initApp);
  document.addEventListener("partial-loaded", initApp);
})();

// Cargar notificaciones al iniciar
document.addEventListener("DOMContentLoaded", () => {
  cargarNotificaciones();
});