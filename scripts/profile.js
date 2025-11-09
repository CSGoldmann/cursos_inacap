// scripts/profile.js
(function () {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
  let perfilActual = null;
  const estadosEdicion = {};

  const formatearFechaLegible = (valor) => {
    if (!valor) return 'No especificada';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'No especificada';
    return fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatearFechaISO = (valor) => {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    const tzOffset = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - tzOffset).toISOString().slice(0, 10);
  };

  const resolverFotoPerfil = (ruta) => {
    if (!ruta) return 'Pictures/profile.png';
    if (ruta.startsWith('http') || ruta.startsWith('data:')) return ruta;
    if (ruta.startsWith('/')) return ruta;
    return ruta;
  };

  const obtenerFeedback = () => document.getElementById('profile-feedback');

  const mostrarFeedback = (tipo, mensaje) => {
    const box = obtenerFeedback();
    if (!box) {
      if (tipo === 'danger') alert(mensaje);
      return;
    }
    box.className = `alert alert-${tipo}`;
    box.textContent = mensaje;
    box.classList.remove('d-none');
  };

  const ocultarFeedback = () => {
    const box = obtenerFeedback();
    if (box) box.classList.add('d-none');
  };

  const renderPerfil = () => {
    if (!perfilActual) return;

    const preview = document.getElementById('profile-pic-preview');
    if (preview) {
      preview.src = resolverFotoPerfil(perfilActual.fotoPerfil);
    }

    const displayBirthday = document.getElementById('display-birthday');
    const inputBirthday = document.getElementById('input-birthday');
    if (displayBirthday) {
      displayBirthday.textContent = formatearFechaLegible(perfilActual.fechaNacimiento);
    }
    if (inputBirthday) {
      inputBirthday.value = formatearFechaISO(perfilActual.fechaNacimiento);
      inputBirthday.classList.add('d-none');
    }

    const displayAddress = document.getElementById('display-address');
    const inputAddress = document.getElementById('input-address');
    if (displayAddress) {
      displayAddress.textContent = perfilActual.direccion || 'Sin especificar';
    }
    if (inputAddress) {
      inputAddress.value = perfilActual.direccion || '';
      inputAddress.classList.add('d-none');
    }

    const passwordArea = document.getElementById('edit-password-area');
    if (passwordArea) {
      passwordArea.classList.add('d-none');
      passwordArea.querySelectorAll('input').forEach((input) => { input.value = ''; });
    }

    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.dataset.mode = 'view';
      btn.textContent = 'Editar';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-primary');
    });

    Object.values(estadosEdicion).forEach(({ cancelBtn }) => cancelBtn && cancelBtn.remove());
    Object.keys(estadosEdicion).forEach((key) => delete estadosEdicion[key]);
  };

  const guardarCambios = async (cambios, opciones = {}) => {
    const esFormData = typeof FormData !== 'undefined' && cambios instanceof FormData;
    const requestOptions = {
      method: 'PUT',
      credentials: 'include'
    };

    if (esFormData) {
      requestOptions.body = cambios;
    } else {
      requestOptions.headers = { 'Content-Type': 'application/json' };
      requestOptions.body = JSON.stringify(cambios);
    }

    const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, requestOptions);
    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok || !data.success) {
      throw new Error(data.error || 'No se pudieron guardar los cambios');
    }

    perfilActual = data.usuario;
    await window.auth.init();
    renderPerfil();

    if (opciones.mensajeExito) {
      mostrarFeedback('success', opciones.mensajeExito);
    } else {
      ocultarFeedback();
    }
  };

  const cancelarEdicion = (field, btn) => {
    if (estadosEdicion[field] && estadosEdicion[field].cancelBtn) {
      estadosEdicion[field].cancelBtn.remove();
    }
    delete estadosEdicion[field];
    btn.dataset.mode = 'view';
    btn.textContent = 'Editar';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-primary');
    renderPerfil();
  };

  const manejarEdicion = async (btn) => {
    const field = btn.dataset.field;
    if (!field) return;

    if (btn.dataset.mode !== 'editing') {
      btn.dataset.mode = 'editing';
      btn.textContent = 'Guardar';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success');

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-link btn-sm text-secondary ms-2';
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.addEventListener('click', () => cancelarEdicion(field, btn));
      btn.parentElement.appendChild(cancelBtn);
      estadosEdicion[field] = { cancelBtn };

      if (field === 'birthday') {
        document.getElementById('display-birthday')?.classList.add('d-none');
        const input = document.getElementById('input-birthday');
        if (input) {
          input.value = formatearFechaISO(perfilActual.fechaNacimiento);
          input.classList.remove('d-none');
          input.focus();
        }
      }

      if (field === 'address') {
        document.getElementById('display-address')?.classList.add('d-none');
        const input = document.getElementById('input-address');
        if (input) {
          input.value = perfilActual.direccion || '';
          input.classList.remove('d-none');
          input.focus();
        }
      }

      if (field === 'password') {
        const area = document.getElementById('edit-password-area');
        if (area) {
          area.classList.remove('d-none');
          area.querySelector('input')?.focus();
        }
      }

      return;
    }

    try {
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      if (field === 'birthday') {
        const value = document.getElementById('input-birthday')?.value || '';
        await guardarCambios({ fechaNacimiento: value }, { mensajeExito: 'Fecha de nacimiento actualizada.' });
        cancelarEdicion(field, btn);
      } else if (field === 'address') {
        const value = document.getElementById('input-address')?.value || '';
        await guardarCambios({ direccion: value }, { mensajeExito: 'Dirección actualizada.' });
        cancelarEdicion(field, btn);
      } else if (field === 'password') {
        const actual = document.getElementById('current-password')?.value || '';
        const nueva = document.getElementById('new-password')?.value || '';
        if (!actual || !nueva) {
          throw new Error('Debes completar la contraseña actual y la nueva contraseña.');
        }
        if (nueva.length < 6) {
          throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
        }
        await guardarCambios(
          { passwordActual: actual, passwordNueva: nueva },
          { mensajeExito: 'Contraseña actualizada correctamente.' }
        );
        cancelarEdicion(field, btn);
      }
    } catch (error) {
      mostrarFeedback('danger', error.message || 'No se pudieron guardar los cambios.');
      btn.dataset.mode = 'editing';
      btn.textContent = 'Guardar';
    } finally {
      btn.disabled = false;
    }
  };

  const manejarCambioFoto = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarFeedback('danger', 'Selecciona un archivo de imagen válido.');
      event.target.value = '';
      return;
    }

    const preview = document.getElementById('profile-pic-preview');
    if (preview) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append('fotoPerfil', file);

    try {
      await guardarCambios(formData, { mensajeExito: 'Foto de perfil actualizada.' });
    } catch (error) {
      mostrarFeedback('danger', error.message || 'No se pudo actualizar la foto de perfil.');
    } finally {
      event.target.value = '';
    }
  };

  const manejarEliminarFoto = async (event) => {
    event.preventDefault();
    if (!perfilActual || !perfilActual.fotoPerfil || perfilActual.fotoPerfil === 'Pictures/profile.png') {
      mostrarFeedback('info', 'Actualmente estás usando la foto por defecto.');
      return;
    }

    const confirmar = confirm('¿Deseas eliminar tu foto de perfil y volver a la imagen por defecto?');
    if (!confirmar) return;

    try {
      await guardarCambios({ eliminarFoto: true }, { mensajeExito: 'Foto de perfil eliminada.' });
    } catch (error) {
      mostrarFeedback('danger', error.message || 'No se pudo eliminar la foto de perfil.');
    }
  };

  const configurarEventos = () => {
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => manejarEdicion(btn));
    });

    const fileInput = document.getElementById('profile-pic-input');
    if (fileInput) {
      fileInput.addEventListener('change', manejarCambioFoto);
    }

    const editBtn = document.getElementById('edit-picture');
    if (editBtn && fileInput) {
      editBtn.addEventListener('click', () => fileInput.click());
    }

    const removeBtn = document.getElementById('remove-photo');
    if (removeBtn) {
      removeBtn.addEventListener('click', manejarEliminarFoto);
    }
  };

  const cargarPerfil = async () => {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
        credentials: 'include'
      });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo cargar el perfil.');
      }
      perfilActual = data.usuario;
      renderPerfil();
      ocultarFeedback();
    } catch (error) {
      mostrarFeedback('danger', error.message || 'No se pudo cargar la información del perfil.');
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth) return;
    const autenticado = await window.auth.init();
    if (!autenticado) {
      window.location.href = 'login.html';
      return;
    }
    await cargarPerfil();
    configurarEventos();
  });
})();

