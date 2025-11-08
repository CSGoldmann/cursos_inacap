// scripts/curso-vista.js
// Vista completa del curso con reproductor de lecciones

let cursoActual = null;
let inscripcionActual = null;
let leccionActual = null;
let seccionActual = null;
let indiceSeccionActual = 0;
let indiceLeccionActual = 0;

const MEDIA_MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.oga': 'audio/ogg'
};

function resolverMediaUrl(url, tipo) {
  if (!url) return null;
  if (url.startsWith('/api/media/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  if (tipo === 'video' && url.startsWith('/uploads/videos/')) {
    return url.replace('/uploads/videos/', '/api/media/videos/');
  }

  if (tipo === 'audio' && url.startsWith('/uploads/audios/')) {
    return url.replace('/uploads/audios/', '/api/media/audios/');
  }

  return url;
}

function obtenerMimeDesdeUrl(url, tipoPorDefecto) {
  if (!url) return tipoPorDefecto;
  const match = url.match(/\.[a-z0-9]+$/i);
  if (!match) return tipoPorDefecto;

  const extension = match[0].toLowerCase();
  return MEDIA_MIME_TYPES[extension] || tipoPorDefecto;
}

function obtenerProgresoLeccionActual() {
  if (!inscripcionActual || !leccionActual) return null;
  return inscripcionActual.progresoLecciones?.find(
    p => p.leccionId.toString() === (leccionActual._id || leccionActual.id).toString()
  ) || null;
}

async function recargarInscripcionActual() {
  if (!cursoActual) return;
  const cursoId = cursoActual._id || cursoActual.id;
  const inscripciones = await window.inscripcionesAPI.obtenerInscripciones();
  inscripcionActual = Array.isArray(inscripciones)
    ? inscripciones.find(i => {
        const cursoIdInsc = i.curso._id || i.curso;
        return cursoIdInsc && cursoIdInsc.toString() === cursoId.toString();
      })
    : null;
}

async function registrarVideoCompletado() {
  if (!cursoActual || !leccionActual) return;

  try {
    const cursoId = cursoActual._id || cursoActual.id;
    const resultado = await window.inscripcionesAPI.actualizarProgreso(
      cursoId,
      leccionActual._id,
      {
        videoCompletado: true,
        progreso: 100
      }
    );

    if (resultado) {
      await recargarInscripcionActual();
      renderizarSidebar();
      actualizarNavegacion();
    }
  } catch (error) {
    console.error('Error al registrar video completado:', error);
  }
}

// Obtener ID del curso desde la URL
function obtenerCursoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Cargar curso y mostrar contenido
async function cargarCursoVista() {
  const cursoId = obtenerCursoId();
  
  if (!cursoId || cursoId.startsWith('static-')) {
    mostrarError('No se especificó un curso válido');
    return;
  }

  // Verificar autenticación
  if (!window.auth || !window.auth.estaAutenticado()) {
    alert('Debes iniciar sesión para ver el curso');
    window.location.href = 'login.html';
    return;
  }

  try {
    // Cargar curso y verificar inscripción
    const [curso, inscripcion] = await Promise.all([
      window.cursosAPI.getById(cursoId),
      window.inscripcionesAPI.estaInscrito(cursoId).then(async (inscrito) => {
        if (inscrito) {
          const inscripciones = await window.inscripcionesAPI.obtenerInscripciones();
          return inscripciones.find(i => {
            const cursoIdInsc = i.curso._id || i.curso;
            return cursoIdInsc.toString() === cursoId;
          });
        }
        return null;
      })
    ]);

    if (!inscripcion) {
      alert('No estás inscrito en este curso. Serás redirigido...');
      window.location.href = `curso.html?id=${cursoId}`;
      return;
    }

    cursoActual = curso;
    inscripcionActual = inscripcion;
    
    renderizarSidebar();
    
    // Cargar primera lección o última accedida
    if (inscripcion.ultimaLeccionAccedida && inscripcion.ultimaLeccionAccedida.leccionId) {
      cargarLeccionPorId(inscripcion.ultimaLeccionAccedida.leccionId);
    } else {
      cargarPrimeraLeccion();
    }
  } catch (error) {
    console.error('Error al cargar curso:', error);
    mostrarError('Error al cargar el curso');
  }
}

// Renderizar sidebar con secciones
function renderizarSidebar() {
  const tituloSidebar = document.getElementById('curso-titulo-sidebar');
  const progresoSidebar = document.getElementById('progreso-sidebar');
  const progresoBar = document.getElementById('progreso-bar');
  const seccionesLista = document.getElementById('secciones-lista');

  if (!cursoActual || !inscripcionActual) return;

  // Actualizar título y progreso
  if (tituloSidebar) tituloSidebar.textContent = cursoActual.titulo;
  if (progresoSidebar) progresoSidebar.textContent = `${inscripcionActual.progresoGeneral}% completado`;
  if (progresoBar) {
    progresoBar.style.width = `${inscripcionActual.progresoGeneral}%`;
    progresoBar.setAttribute('aria-valuenow', inscripcionActual.progresoGeneral);
  }

  // Renderizar secciones
  if (!seccionesLista) return;

  const seccionesOrdenadas = [...(cursoActual.secciones || [])].sort((a, b) => a.orden - b.orden);
  
  seccionesLista.innerHTML = seccionesOrdenadas.map((seccion, seccionIdx) => {
    const lecciones = (seccion.lecciones || []).sort((a, b) => a.orden - b.orden);
    const leccionesCompletadas = lecciones.filter(lec => {
      const progreso = inscripcionActual.progresoLecciones.find(
        p => p.leccionId.toString() === lec._id.toString()
      );
      return progreso && progreso.completado;
    }).length;

    return `
      <div class="mb-3">
        <div class="px-3 py-2 bg-light fw-semibold small">
          ${seccionIdx + 1}. ${seccion.titulo}
          <span class="text-muted float-end">${leccionesCompletadas}/${lecciones.length}</span>
        </div>
        <div class="list-group list-group-flush">
          ${lecciones.map((leccion, lecIdx) => {
            const progreso = inscripcionActual.progresoLecciones.find(
              p => p.leccionId.toString() === leccion._id.toString()
            );
            const completada = progreso && progreso.completado;
            const claseEstado = completada ? 'lesson-completed' : '';
            
            return `
              <a href="#" class="list-group-item list-group-item-action ${claseEstado}" 
                 data-seccion="${seccionIdx}" data-leccion="${lecIdx}" 
                 onclick="cargarLeccion(${seccionIdx}, ${lecIdx}); return false;">
                <div class="d-flex align-items-center">
                  <i class="bi ${completada ? 'bi-check-circle-fill text-success' : 'bi-circle'} me-2"></i>
                  <div class="flex-grow-1">
                    <div class="small">${leccion.titulo}</div>
                    ${leccion.tipo === 'video' ? '<span class="badge bg-primary">Video</span>' : ''}
                    ${leccion.tipo === 'audio' ? '<span class="badge bg-info">Audio</span>' : ''}
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
        ${seccion.tieneExamen ? `
          <button class="btn btn-sm btn-outline-warning w-100 mt-2" 
                  data-seccion-id="${seccion._id}" onclick="window.abrirExamen('${seccion._id}')">
            <i class="bi bi-file-earmark-text"></i> Examen de Sección
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  // Agregar examen final si existe
  if (seccionesOrdenadas.length > 0) {
    const ultimaSeccion = seccionesOrdenadas[seccionesOrdenadas.length - 1];
    if (ultimaSeccion.tieneExamen) {
      seccionesLista.innerHTML += `
        <div class="border-top pt-3 mt-3">
          <button class="btn btn-warning w-100" onclick="window.abrirExamen(null, true)">
            <i class="bi bi-trophy"></i> Examen Final
          </button>
        </div>
      `;
    }
  }
}

// Cargar lección por índice
async function cargarLeccion(seccionIdx, leccionIdx) {
  if (!cursoActual) return;

  const secciones = [...(cursoActual.secciones || [])].sort((a, b) => a.orden - b.orden);
  const seccion = secciones[seccionIdx];
  
  if (!seccion) return;

  const lecciones = [...(seccion.lecciones || [])].sort((a, b) => a.orden - b.orden);
  const leccion = lecciones[leccionIdx];

  if (!leccion) return;

  seccionActual = seccion;
  leccionActual = leccion;
  indiceSeccionActual = seccionIdx;
  indiceLeccionActual = leccionIdx;

  mostrarLeccion(leccion);
  actualizarNavegacion();
  actualizarEstadoLeccionActual();
  
  // Actualizar última lección accedida
  await actualizarUltimaLeccion(leccion._id);
}

// Cargar lección por ID
async function cargarLeccionPorId(leccionId) {
  if (!cursoActual) return;

  const secciones = [...(cursoActual.secciones || [])].sort((a, b) => a.orden - b.orden);
  
  for (let seccionIdx = 0; seccionIdx < secciones.length; seccionIdx++) {
    const seccion = secciones[seccionIdx];
    const lecciones = [...(seccion.lecciones || [])].sort((a, b) => a.orden - b.orden);
    
    for (let leccionIdx = 0; leccionIdx < lecciones.length; leccionIdx++) {
      if (lecciones[leccionIdx]._id.toString() === leccionId.toString()) {
        await cargarLeccion(seccionIdx, leccionIdx);
        return;
      }
    }
  }
  
  // Si no se encuentra, cargar primera
  cargarPrimeraLeccion();
}

// Cargar primera lección
function cargarPrimeraLeccion() {
  if (!cursoActual || !cursoActual.secciones || cursoActual.secciones.length === 0) return;
  
  const primeraSeccion = [...cursoActual.secciones].sort((a, b) => a.orden - b.orden)[0];
  if (primeraSeccion.lecciones && primeraSeccion.lecciones.length > 0) {
    const primeraLeccion = [...primeraSeccion.lecciones].sort((a, b) => a.orden - b.orden)[0];
    const seccionIdx = cursoActual.secciones.findIndex(s => s._id.toString() === primeraSeccion._id.toString());
    const leccionIdx = primeraSeccion.lecciones.findIndex(l => l._id.toString() === primeraLeccion._id.toString());
    cargarLeccion(seccionIdx, leccionIdx);
  }
}

// Mostrar contenido de la lección
function mostrarLeccion(leccion) {
  const contenido = document.getElementById('contenido-leccion');
  if (!contenido) return;

  let html = `
    <h3>${leccion.titulo}</h3>
    ${leccion.descripcion ? `<p class="text-muted">${leccion.descripcion}</p>` : ''}
  `;

  let videoSrc = null;

  if (leccion.tipo === 'video') {
    videoSrc = resolverMediaUrl(leccion.urlVideo, 'video');
    if (videoSrc) {
      const mimeType = obtenerMimeDesdeUrl(videoSrc, 'video/mp4');
      html += `
        <div class="mt-4">
          <video class="video-player" controls preload="metadata">
            <source src="${videoSrc}" type="${mimeType}">
            Tu navegador no soporta el elemento de video.
          </video>
        </div>
      `;
    } else {
      html += `
        <div class="alert alert-warning mt-4">
          <i class="bi bi-exclamation-triangle"></i> No se encontró el video asociado a esta lección.
        </div>
      `;
    }
  } else if (leccion.tipo === 'audio') {
    const audioSrc = resolverMediaUrl(leccion.urlAudio, 'audio');
    if (audioSrc) {
      const mimeType = obtenerMimeDesdeUrl(audioSrc, 'audio/mpeg');
      html += `
        <div class="mt-4">
          <audio class="audio-player" controls preload="metadata">
            <source src="${audioSrc}" type="${mimeType}">
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      `;
    }
  } else if (leccion.tipo === 'texto') {
    if (leccion.contenido) {
      html += `<div class="mt-4">${leccion.contenido}</div>`;
    } else {
      html += `
        <div class="mt-4">
          <h4>${leccion.titulo}</h4>
          <p>Esta lección profundiza en "${leccion.titulo}" como parte de la sección "${seccionActual?.titulo || ''}". Usa los recursos descargables para poner en práctica cada concepto.</p>
        </div>
      `;
    }
  } else {
    html += `
      <div class="alert alert-info mt-4">
        <i class="bi bi-info-circle"></i> Contenido de la lección: ${leccion.titulo}
      </div>
    `;
  }

  if (leccion.tipo !== 'texto' && leccion.contenido) {
    html += `<div class="mt-4">${leccion.contenido}</div>`;
  }

  contenido.innerHTML = html;

  if (leccion.tipo === 'video') {
    const videoElement = contenido.querySelector('video');
    if (videoElement) {
      videoElement.dataset.reported = videoElement.dataset.reported || '';
      const marcarFinalizado = () => {
        if (videoElement.dataset.reported === 'done') return;
        videoElement.dataset.reported = 'done';
        registrarVideoCompletado();
      };

      videoElement.addEventListener('ended', marcarFinalizado);
      videoElement.addEventListener('timeupdate', () => {
        if (!videoElement.duration) return;
        const porcentaje = videoElement.currentTime / videoElement.duration;
        if (porcentaje >= 0.95) {
          marcarFinalizado();
        }
      });
    }
  }

  // Mostrar navegación
  const nav = document.getElementById('navegacion-lecciones');
  if (nav) nav.style.display = 'flex';
}

// Actualizar navegación entre lecciones
function actualizarNavegacion() {
  const btnAnterior = document.getElementById('btn-leccion-anterior');
  const btnSiguiente = document.getElementById('btn-leccion-siguiente');
  const btnMarcar = document.getElementById('btn-marcar-completada');

  if (!cursoActual) return;

  const secciones = [...(cursoActual.secciones || [])].sort((a, b) => a.orden - b.orden);
  
  // Verificar si hay lección anterior
  let tieneAnterior = false;
  if (indiceLeccionActual > 0) {
    tieneAnterior = true;
  } else if (indiceSeccionActual > 0) {
    const seccionAnterior = secciones[indiceSeccionActual - 1];
    tieneAnterior = seccionAnterior.lecciones && seccionAnterior.lecciones.length > 0;
  }

  // Verificar si hay lección siguiente
  let tieneSiguiente = false;
  const seccionActual = secciones[indiceSeccionActual];
  if (seccionActual && indiceLeccionActual < seccionActual.lecciones.length - 1) {
    tieneSiguiente = true;
  } else if (indiceSeccionActual < secciones.length - 1) {
    const seccionSiguiente = secciones[indiceSeccionActual + 1];
    tieneSiguiente = seccionSiguiente.lecciones && seccionSiguiente.lecciones.length > 0;
  }

  if (btnAnterior) {
    btnAnterior.disabled = !tieneAnterior;
    if (tieneAnterior) {
      btnAnterior.onclick = () => {
        if (indiceLeccionActual > 0) {
          cargarLeccion(indiceSeccionActual, indiceLeccionActual - 1);
        } else if (indiceSeccionActual > 0) {
          const seccionAnterior = secciones[indiceSeccionActual - 1];
          const ultimaLeccion = seccionAnterior.lecciones.length - 1;
          cargarLeccion(indiceSeccionActual - 1, ultimaLeccion);
        }
      };
    }
  }

  if (btnSiguiente) {
    btnSiguiente.disabled = !tieneSiguiente;
    if (tieneSiguiente) {
      btnSiguiente.onclick = () => {
        if (indiceLeccionActual < seccionActual.lecciones.length - 1) {
          cargarLeccion(indiceSeccionActual, indiceLeccionActual + 1);
        } else if (indiceSeccionActual < secciones.length - 1) {
          cargarLeccion(indiceSeccionActual + 1, 0);
        }
      };
    }
  }

  // Botón marcar como completada
  if (btnMarcar && leccionActual) {
    const progreso = inscripcionActual.progresoLecciones.find(
      p => p.leccionId.toString() === leccionActual._id.toString()
    );
    const completada = progreso && progreso.completado;
    const videoVisto = progreso && progreso.videoCompletado;

    btnMarcar.innerHTML = completada 
      ? '<i class="bi bi-check-circle-fill"></i> Completada'
      : '<i class="bi bi-check-circle"></i> Marcar como Completada';
    btnMarcar.className = completada ? 'btn btn-success' : 'btn btn-outline-success';
    btnMarcar.disabled = !completada && !videoVisto;
    if (!completada && !videoVisto) {
      btnMarcar.title = 'Debes visualizar el video para habilitar esta acción.';
    } else {
      btnMarcar.removeAttribute('title');
    }
    
    btnMarcar.onclick = async () => {
      await marcarLeccionCompletada(!completada);
    };
  }
}

// Actualizar estado visual de lección actual
function actualizarEstadoLeccionActual() {
  // Remover clase "current" de todas
  document.querySelectorAll('.lesson-current').forEach(el => {
    el.classList.remove('lesson-current');
  });

  // Agregar a la actual
  const leccionElement = document.querySelector(
    `[data-seccion="${indiceSeccionActual}"][data-leccion="${indiceLeccionActual}"]`
  );
  if (leccionElement) {
    leccionElement.classList.add('lesson-current');
  }
}

// Marcar lección como completada
async function marcarLeccionCompletada(completado) {
  if (!leccionActual || !cursoActual) return;

  try {
    const cursoId = cursoActual._id || cursoActual.id;
    const progreso = obtenerProgresoLeccionActual();

    if (completado) {
      if (!progreso || !progreso.videoCompletado) {
        alert('Debes visualizar el video completo antes de marcar la lección como completada.');
        return;
      }
    }

    const resultado = await window.inscripcionesAPI.actualizarProgreso(
      cursoId,
      leccionActual._id,
      {
        completado,
        progreso: completado ? 100 : 0
      }
    );

    if (resultado) {
      await recargarInscripcionActual();
      renderizarSidebar();
      actualizarNavegacion();
    }
  } catch (error) {
    console.error('Error al marcar lección:', error);
    alert('Error al actualizar el progreso');
  }
}

// Actualizar última lección accedida
async function actualizarUltimaLeccion(leccionId) {
  if (!cursoActual || !inscripcionActual) return;

  try {
    const cursoId = cursoActual._id || cursoActual.id;
    await window.inscripcionesAPI.actualizarProgreso(cursoId, leccionId, {});
  } catch (error) {
    console.error('Error al actualizar última lección:', error);
  }
}

// Abrir examen
async function abrirExamen(seccionId, esFinal = false) {
  if (!cursoActual) return;

  try {
    const cursoId = cursoActual._id || cursoActual.id;
    const examen = await window.examenesAPI.obtenerExamen(cursoId, seccionId, esFinal);
    
    if (!examen) {
      alert('No hay examen disponible para esta sección');
      return;
    }

    mostrarExamen(examen);
    const modal = new bootstrap.Modal(document.getElementById('modalExamen'));
    modal.show();
  } catch (error) {
    console.error('Error al cargar examen:', error);
    alert('Error al cargar el examen');
  }
}

// Mostrar examen
function mostrarExamen(examen) {
  const tituloExamen = document.getElementById('tituloExamen');
  const contenidoExamen = document.getElementById('contenido-examen');

  if (tituloExamen) tituloExamen.textContent = examen.titulo;
  if (!contenidoExamen) return;

  const preguntasOrdenadas = [...(examen.preguntas || [])].sort((a, b) => a.orden - b.orden);

  contenidoExamen.innerHTML = preguntasOrdenadas.map((pregunta, idx) => {
    let opcionesHTML = '';

    if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
      opcionesHTML = pregunta.opciones.map((opcion, opcIdx) => `
        <div class="form-check">
          <input class="form-check-input" type="radio" 
                 name="pregunta_${pregunta._id}" 
                 id="opcion_${pregunta._id}_${opcIdx}" 
                 value="${opcIdx}">
          <label class="form-check-label" for="opcion_${pregunta._id}_${opcIdx}">
            ${opcion.texto}
          </label>
        </div>
      `).join('');
    } else if (pregunta.tipo === 'verdadero_falso') {
      opcionesHTML = `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pregunta_${pregunta._id}" id="vf_${pregunta._id}_true" value="true">
          <label class="form-check-label" for="vf_${pregunta._id}_true">Verdadero</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pregunta_${pregunta._id}" id="vf_${pregunta._id}_false" value="false">
          <label class="form-check-label" for="vf_${pregunta._id}_false">Falso</label>
        </div>
      `;
    } else {
      opcionesHTML = `
        <textarea class="form-control" name="pregunta_${pregunta._id}" rows="3" placeholder="Escribe tu respuesta"></textarea>
      `;
    }

    return `
      <div class="mb-4">
        <h6>${idx + 1}. ${pregunta.pregunta} <span class="badge bg-secondary">${pregunta.puntos} punto(s)</span></h6>
        ${opcionesHTML}
        <input type="hidden" name="pregunta_id_${idx}" value="${pregunta._id}">
      </div>
    `;
  }).join('');

  // Configurar botón enviar
  const btnEnviar = document.getElementById('btn-enviar-examen');
  if (btnEnviar) {
    btnEnviar.onclick = () => enviarExamen(examen);
  }
}

// Enviar examen
async function enviarExamen(examen) {
  if (!cursoActual) return;

  try {
    const respuestas = [];
    const preguntas = [...(examen.preguntas || [])].sort((a, b) => a.orden - b.orden);

    preguntas.forEach((pregunta) => {
      const respuestaInput = document.querySelector(`[name="pregunta_${pregunta._id}"]:checked`) || 
                            document.querySelector(`[name="pregunta_${pregunta._id}"]`);
      
      if (respuestaInput) {
        let respuesta = respuestaInput.value || respuestaInput.textContent;
        let esCorrecta = false;

        // Verificar si es correcta
        if (pregunta.tipo === 'opcion_multiple') {
          const opcionIndex = parseInt(respuesta);
          esCorrecta = pregunta.opciones[opcionIndex]?.esCorrecta || false;
        } else if (pregunta.tipo === 'verdadero_falso') {
          const respuestaCorrecta = pregunta.opciones.find(o => o.esCorrecta);
          esCorrecta = respuesta === (respuestaCorrecta?.texto === 'Verdadero' ? 'true' : 'false');
        }

        respuestas.push({
          preguntaId: pregunta._id,
          respuesta: respuesta,
          esCorrecta: esCorrecta,
          puntosObtenidos: esCorrecta ? pregunta.puntos : 0
        });
      }
    });

    const resultado = await window.examenesAPI.enviarExamen(
      cursoActual._id || cursoActual.id,
      examen._id,
      respuestas
    );

    if (resultado.success) {
      mostrarResultadoExamen(resultado);
    } else {
      alert('Error al enviar el examen: ' + (resultado.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al enviar examen:', error);
    alert('Error al enviar el examen');
  }
}

// Mostrar resultado del examen
function mostrarResultadoExamen(resultado) {
  const contenidoExamen = document.getElementById('contenido-examen');
  const btnEnviar = document.getElementById('btn-enviar-examen');
  const modalTitle = document.getElementById('tituloExamen');

  if (!contenidoExamen) return;

  const aprobado = resultado.aprobado;
  const mensaje = aprobado 
    ? `<div class="alert alert-success"><h5><i class="bi bi-check-circle-fill"></i> ¡Aprobado!</h5></div>`
    : `<div class="alert alert-danger"><h5><i class="bi bi-x-circle-fill"></i> No Aprobado</h5></div>`;

  contenidoExamen.innerHTML = `
    ${mensaje}
    <div class="text-center my-4">
      <h3>${resultado.porcentaje}%</h3>
      <p>Puntaje: ${resultado.puntajeTotal} / ${resultado.puntajeMaximo}</p>
      <p>Porcentaje mínimo para aprobar: ${resultado.porcentajeAprobacion}%</p>
    </div>
    <div class="alert alert-info">
      <strong>Intento:</strong> ${resultado.intento} de ${resultado.intentosPermitidos}
    </div>
  `;

  if (btnEnviar) {
    btnEnviar.textContent = 'Cerrar';
    btnEnviar.onclick = () => {
      bootstrap.Modal.getInstance(document.getElementById('modalExamen')).hide();
      // Recargar sidebar para actualizar progreso
      renderizarSidebar();
    };
  }
}

// Mostrar error
function mostrarError(mensaje) {
  const contenido = document.getElementById('contenido-leccion');
  if (contenido) {
    contenido.innerHTML = `
      <div class="alert alert-danger">
        <h4>Error</h4>
        <p>${mensaje}</p>
        <a href="index.html" class="btn btn-primary">Volver al inicio</a>
      </div>
    `;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  if (window.auth) {
    const autenticado = await window.auth.init();
    if (!autenticado) {
      window.location.href = 'login.html';
      return;
    }
  }

  // Cargar curso
  await cargarCursoVista();
});

// Exportar funciones globales
window.cargarCursoVista = cargarCursoVista;
window.cargarLeccion = cargarLeccion;
window.abrirExamen = abrirExamen;

