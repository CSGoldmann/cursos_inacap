// scripts/app.js

console.log("✅ app.js cargado correctamente");

// =========================
// 🔌 Conexión con Socket.IO (solo si está disponible)
// =========================
let socket = null;

if (typeof io !== 'undefined') {
  socket = io("http://localhost:3000");

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
    if (socket) {
      socket.emit("diploma_emitido", { mensaje: "Diploma disponible para descarga" });
    }
  };

  window.nuevoCurso = function () {
    if (socket) {
      socket.emit("nuevo_curso", { titulo: "Curso de Node.js avanzado" });
    }
  };
} else {
  console.log("⚠️ Socket.IO no está disponible en esta página");
}

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
window.toggleNotificaciones = async function () {
  const panel = document.getElementById("contenedor-notificaciones");
  if (!panel) return;
  panel.classList.toggle("visible");
  
  // Usar API de BD si está disponible
  if (window.notificacionesAPI && window.auth && window.auth.estaAutenticado()) {
    await window.notificacionesAPI.cargarNotificaciones();
  } else {
    cargarNotificaciones();
  }
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
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        // Mostrar loading
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Iniciando sesión...";

        // Intentar login
        const messageDiv = document.getElementById("auth-message");
        if (messageDiv) messageDiv.innerHTML = "";
        
        const resultado = await window.auth.login(email, password);
        
        if (resultado.success) {
          console.log('✅ Login exitoso, usuario:', resultado.usuario);
          
          // Esperar un momento para que la cookie de sesión se establezca completamente
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar una vez más antes de redirigir
          const verificado = await window.auth.init();
          if (verificado) {
            console.log('✅ Sesión verificada, redirigiendo...');
            window.location.href = "index.html";
          } else {
            console.error('⚠️ Sesión no verificada después del login');
            // Intentar de todos modos después de un delay
            setTimeout(() => {
              window.location.href = "index.html";
            }, 500);
          }
        } else {
          if (messageDiv) {
            messageDiv.innerHTML = `<div class="alert alert-danger">${resultado.error || "Credenciales inválidas"}</div>`;
          } else {
            alert("Error: " + (resultado.error || "Credenciales inválidas"));
          }
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = document.getElementById("reg-nombre").value;
        const apellido = document.getElementById("reg-apellido").value;
        const email = document.getElementById("reg-email").value;
        const password = document.getElementById("reg-password").value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        const messageDiv = document.getElementById("auth-message");
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Registrando...";
        if (messageDiv) messageDiv.innerHTML = "";
        
        const resultado = await window.auth.register(email, password, nombre, apellido);
        
        if (resultado.success) {
          if (messageDiv) {
            messageDiv.innerHTML = `<div class="alert alert-success">¡Registro exitoso! Redirigiendo...</div>`;
          }
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1000);
        } else {
          if (messageDiv) {
            messageDiv.innerHTML = `<div class="alert alert-danger">${resultado.error || "Error al registrar usuario"}</div>`;
          } else {
            alert("Error: " + (resultado.error || "Error al registrar usuario"));
          }
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

    // -- Logout --
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await window.auth.logout();
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

// Cargar notificaciones al iniciar (usando API de BD si está disponible)
document.addEventListener("DOMContentLoaded", async () => {
  // Solo cargar notificaciones si no estamos en login.html
  if (window.location.pathname.includes('login.html')) {
    return;
  }
  
  // Esperar a que auth esté disponible
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Si existe la API de notificaciones de BD, usarla
  if (window.notificacionesAPI && window.auth) {
    try {
      const autenticado = await window.auth.init();
      if (autenticado) {
        await window.notificacionesAPI.cargarNotificaciones();
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      // Fallback a localStorage
      if (typeof cargarNotificaciones === 'function') {
        cargarNotificaciones();
      }
    }
  } else {
    // Fallback a localStorage
    if (typeof cargarNotificaciones === 'function') {
      cargarNotificaciones();
    }
  }
});