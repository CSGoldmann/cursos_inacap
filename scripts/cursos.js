// scripts/cursos.js
// Funciones para cargar y mostrar cursos

let cursosCargados = [];

// Cargar todos los cursos desde la API
async function cargarCursos() {
  try {
    // Verificar autenticación primero
    if (!window.auth || !window.auth.estaAutenticado()) {
      window.location.href = 'login.html';
      return;
    }

    // Obtener cursos y inscripciones desde BD
    const [cursos, inscripciones] = await Promise.all([
      window.cursosAPI.getAll(),
      window.inscripcionesAPI.obtenerInscripciones()
    ]);

    cursosCargados = Array.isArray(cursos) ? cursos : [];
    inscripcionesCargadas = Array.isArray(inscripciones) ? inscripciones : [];
    renderizarCursos();
  } catch (error) {
    console.error('Error al cargar cursos:', error);
    mostrarError('Error al cargar los cursos. Por favor, recarga la página.');
  }
}

let inscripcionesCargadas = [];

function obtenerCursoId(curso) {
  if (!curso) return null;
  if (typeof curso === 'string') return curso;
  if (curso._id) return curso._id.toString();
  if (curso.id) return curso.id.toString();
  if (typeof curso.toString === 'function') return curso.toString();
  return null;
}

function actualizarInscripcionLocal(inscripcion) {
  if (!inscripcion) return;
  const cursoId = obtenerCursoId(inscripcion.curso);
  if (!cursoId) return;

  const indice = inscripcionesCargadas.findIndex(i => obtenerCursoId(i.curso) === cursoId);
  if (indice >= 0) {
    inscripcionesCargadas[indice] = {
      ...inscripcionesCargadas[indice],
      ...inscripcion,
      curso: inscripcion.curso || inscripcionesCargadas[indice].curso,
      progresoGeneral: inscripcion.progresoGeneral ?? inscripcionesCargadas[indice].progresoGeneral
    };
  } else {
    inscripcionesCargadas.push(inscripcion);
  }
}

function removerInscripcionLocal(cursoId) {
  const id = cursoId ? cursoId.toString() : null;
  if (!id) return;

  inscripcionesCargadas = (inscripcionesCargadas || []).filter(
    (inscripcion) => obtenerCursoId(inscripcion.curso) !== id
  );
}

async function recargarInscripciones(desdeDetalle = null) {
  if (!window.inscripcionesAPI || typeof window.inscripcionesAPI.obtenerInscripciones !== 'function') {
    return;
  }

  if (desdeDetalle && desdeDetalle.inscripcion) {
    actualizarInscripcionLocal(desdeDetalle.inscripcion);
    renderizarCursos();
    return;
  }

  const nuevasInscripciones = await window.inscripcionesAPI.obtenerInscripciones();
  inscripcionesCargadas = Array.isArray(nuevasInscripciones) ? nuevasInscripciones : [];
  renderizarCursos();
}

// Renderizar cursos en el dashboard
function renderizarCursos() {
  let cursosActivosContainer = document.getElementById('cursos-activos-container');
  let cursosCompletadosContainer = document.getElementById('cursos-completados-container');
  let otrosCursosContainer = document.getElementById('otros-cursos-container');

  if (!cursosActivosContainer || !cursosCompletadosContainer || !otrosCursosContainer) {
    crearContenedores();
    cursosActivosContainer = document.getElementById('cursos-activos-container');
    cursosCompletadosContainer = document.getElementById('cursos-completados-container');
    otrosCursosContainer = document.getElementById('otros-cursos-container');
  }

  if (!cursosActivosContainer || !cursosCompletadosContainer || !otrosCursosContainer) {
    console.warn('No se encontraron contenedores para renderizar cursos.');
    return;
  }

  const hayCursos = Array.isArray(cursosCargados) && cursosCargados.length > 0;

  if (!hayCursos) {
    cursosActivosContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center mb-0">
          Aún no hay cursos disponibles. Vuelve más tarde o contacta a un administrador.
        </div>
      </div>
    `;

    cursosCompletadosContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-secondary text-center mb-0">
          Sin cursos finalizados por ahora. Completa un curso para verlo aquí.
        </div>
      </div>
    `;

    otrosCursosContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-secondary text-center mb-0">
          Sin cursos publicados por el momento.
        </div>
      </div>
    `;
    return;
  }

  const mapaInscripciones = new Map();
  (inscripcionesCargadas || []).forEach((inscripcion) => {
    const cursoId = obtenerCursoId(inscripcion?.curso);
    if (cursoId) {
      mapaInscripciones.set(cursoId, inscripcion);
    }
  });

  const obtenerInscripcionCurso = (curso) => {
    const cursoId = obtenerCursoId(curso);
    if (!cursoId) return null;
    return mapaInscripciones.get(cursoId) || null;
  };

  const cursosActivos = [];
  const cursosCompletados = [];
  const cursosOtros = [];

  cursosCargados.forEach((curso) => {
    const inscripcion = obtenerInscripcionCurso(curso);

    if (inscripcion?.estado === 'activo') {
      cursosActivos.push({ curso, inscripcion });
      return;
    }

    if (inscripcion?.estado === 'completado') {
      cursosCompletados.push({ curso, inscripcion });
      return;
    }

    if (!inscripcion || (inscripcion.estado !== 'activo' && inscripcion.estado !== 'completado')) {
      cursosOtros.push({ curso, inscripcion });
    }
  });

  cursosActivosContainer.innerHTML = cursosActivos.length > 0
    ? cursosActivos
        .map(({ curso, inscripcion }) => crearTarjetaCurso(curso, 'activo', inscripcion))
        .join('')
    : '<div class="col-12"><p class="text-center text-muted">No tienes cursos inscritos aún. ¡Inscríbete a uno de los cursos disponibles!</p></div>';

  cursosCompletadosContainer.innerHTML = cursosCompletados.length > 0
    ? cursosCompletados
        .map(({ curso, inscripcion }) => crearTarjetaCurso(curso, 'completado', inscripcion))
        .join('')
    : '<div class="col-12"><p class="text-center text-muted">Aún no has completado ningún curso. Termina uno para verlo aquí.</p></div>';

  otrosCursosContainer.innerHTML = cursosOtros.length > 0
    ? cursosOtros
        .map(({ curso }) => crearTarjetaCurso(curso, 'explorar'))
        .join('')
    : '<div class="col-12"><p class="text-center text-muted">No hay más cursos disponibles.</p></div>';
}

// Crear contenedores si no existen
function crearContenedores() {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  if (!document.getElementById('cursos-activos-container')) {
    const activos = dashboardContent.querySelector('[data-role="cursos-activos"]');
    if (activos) activos.id = 'cursos-activos-container';
  }

  if (!document.getElementById('cursos-completados-container')) {
    const completados = dashboardContent.querySelector('[data-role="cursos-completados"]');
    if (completados) completados.id = 'cursos-completados-container';
  }

  if (!document.getElementById('otros-cursos-container')) {
    const explorar = dashboardContent.querySelector('[data-role="cursos-explorar"]');
    if (explorar) explorar.id = 'otros-cursos-container';
  }
}

// Crear tarjeta de curso
function crearTarjetaCurso(curso, estado = 'explorar', inscripcion = null) {
  const esActivo = estado === 'activo';
  const esCompletado = estado === 'completado';
  const progresoCalculado = inscripcion && typeof inscripcion.progresoGeneral === 'number'
    ? Math.round(inscripcion.progresoGeneral)
    : calcularProgreso(curso);
  const progreso = esCompletado ? 100 : Math.min(100, Math.max(0, progresoCalculado));
  const estrellas = generarEstrellas(curso.calificacion || 0);
  const imagenUrl = curso.imagen || 'Pictures/default-course.jpg';
  const cursoId = curso._id || curso.id;
  const estadoBadge = esCompletado
    ? '<span class="badge bg-success position-absolute top-0 start-0 m-2">Completado</span>'
    : esActivo
      ? '<span class="badge bg-primary position-absolute top-0 start-0 m-2">En curso</span>'
      : '';

  const dropdownItems = [];

  if (esActivo) {
    dropdownItems.push(`
              <li>
                <button type="button"
                        class="dropdown-item"
                        data-action="reiniciar-curso"
                        data-curso-id="${cursoId}">
                  <i class="bi bi-arrow-counterclockwise me-2"></i>Reiniciar curso
                </button>
              </li>
            `);
    dropdownItems.push(`
              <li>
                <button type="button"
                        class="dropdown-item text-danger"
                        data-action="desinscribir-curso"
                        data-curso-id="${cursoId}">
                  <i class="bi bi-box-arrow-left me-2"></i>Salir del curso
                </button>
              </li>
            `);
    dropdownItems.push('<li><hr class="dropdown-divider"></li>');
    dropdownItems.push(`
              <li><a class="dropdown-item" href="#"><i class="bi bi-heart me-2"></i>Agregar a favoritos</a></li>
            `);
    dropdownItems.push(`
              <li><a class="dropdown-item" href="#"><i class="bi bi-archive me-2"></i>Archivar</a></li>
            `);
  } else if (esCompletado) {
    dropdownItems.push('<li><hr class="dropdown-divider"></li>');
    dropdownItems.push(`
              <li><a class="dropdown-item" href="curso-vista.html?id=${cursoId}"><i class="bi bi-play-circle me-2"></i>Repasar contenido</a></li>
            `);
    dropdownItems.push(`
              <li><a class="dropdown-item" href="curso.html?id=${cursoId}"><i class="bi bi-journal-text me-2"></i>Ver detalles</a></li>
            `);
    dropdownItems.push(`
              <li><a class="dropdown-item" href="curso-vista.html?id=${cursoId}#diploma-sidebar-container"><i class="bi bi-award me-2"></i>Ver diploma</a></li>
            `);
  } else {
    dropdownItems.push(`
              <li><a class="dropdown-item" href="curso.html?id=${cursoId}"><i class="bi bi-play-circle me-2"></i>Iniciar curso</a></li>
            `);
    dropdownItems.push(`
              <li><a class="dropdown-item" href="#"><i class="bi bi-heart me-2"></i>Agregar a favoritos</a></li>
            `);
    dropdownItems.push(`
              <li><a class="dropdown-item" href="#"><i class="bi bi-eye-slash me-2"></i>No mostrar</a></li>
            `);
  }

  dropdownItems.push('<li><hr class="dropdown-divider"></li>');
  dropdownItems.push('<li><a class="dropdown-item" href="#"><i class="bi bi-share me-2"></i>Compartir</a></li>');

  const dropdownHtml = dropdownItems.join('');

  const bloqueProgreso = (esActivo || esCompletado)
    ? `
            <div class="progress" style="height:6px;">
              <div class="progress-bar" role="progressbar" style="width:${progreso}%"
                  aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 small text-secondary">
              <div class="text-warning">${estrellas}</div>
              <div>${esCompletado ? 'Finalizado' : `${progreso}% completado`}</div>
            </div>
          `
    : `
            <div class="d-flex justify-content-between align-items-center mt-2 small text-secondary">
              <div class="text-warning">${estrellas}</div>
              <div>${curso.nivel || 'Intermedio'}</div>
            </div>
          `;

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="position-relative">
          <a href="curso.html?id=${cursoId}">
            <img src="${imagenUrl}" class="card-img-top" alt="${curso.titulo}" onerror="this.src='Pictures/default-course.jpg'">
          </a>
          ${estadoBadge}
          <div class="dropdown position-absolute top-0 end-0 m-2">
            <button class="btn btn-light rounded-0 border dropdown-toggle p-1" type="button" 
                    data-bs-toggle="dropdown" aria-expanded="false" aria-label="menu"></button>
            <ul class="dropdown-menu dropdown-menu-end">
              ${dropdownHtml}
            </ul>
          </div>
        </div>
        <div class="card-body py-2">
          <h6 class="card-title mb-1">
            <a href="curso.html?id=${cursoId}" class="text-decoration-none text-dark">${curso.titulo}</a>
          </h6>
          <p class="text-muted small mb-2">Profesor: ${curso.profesor?.nombre || 'Sin especificar'}</p>
          ${bloqueProgreso}
        </div>
        <div class="card-footer bg-transparent border-0 pb-3 pt-0">
          <div class="dropdown">
            <a class="small dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Detalles</a>
            <ul class="dropdown-menu">
              ${curso.secciones?.map((seccion, idx) => 
                `<li><a class="dropdown-item">${idx + 1}. ${seccion.titulo}</a></li>`
              ).join('') || '<li><a class="dropdown-item">Sin secciones</a></li>'}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Calcular progreso del curso
function calcularProgreso(curso) {
  if (!curso.secciones || curso.secciones.length === 0) return 0;
  
  let totalLecciones = 0;
  let leccionesCompletadas = 0;

  curso.secciones.forEach(seccion => {
    if (seccion.lecciones) {
      totalLecciones += seccion.lecciones.length;
      leccionesCompletadas += seccion.lecciones.filter(l => l.completado).length;
    }
  });

  return totalLecciones > 0 ? Math.round((leccionesCompletadas / totalLecciones) * 100) : 0;
}

// Generar estrellas de calificación
function generarEstrellas(calificacion) {
  const fullStars = Math.floor(calificacion);
  const hasHalfStar = calificacion % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
}

// Mostrar error
function mostrarError(mensaje) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${mensaje}</p>
        <button class="btn btn-primary" onclick="location.reload()">Recargar</button>
      </div>
    `;
  }
}

// Cargar cursos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  // Solo cargar si estamos en index.html
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Esperar a que auth.js esté completamente cargado
    let intentos = 0;
    while (!window.auth && intentos < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      intentos++;
    }
    
    if (!window.auth) {
      console.error('Auth no disponible después de esperar');
      window.location.href = 'login.html';
      return;
    }
    
    // Verificar autenticación con múltiples intentos
    let autenticado = false;
    console.log('🔍 Iniciando verificación de autenticación...');
    
    for (let i = 0; i < 5; i++) {
      try {
        console.log(`🔍 Intento ${i + 1} de verificación...`);
        autenticado = await window.auth.init();
        if (autenticado) {
          console.log('✅ Autenticación verificada exitosamente');
          break;
        } else {
          console.log(`❌ Intento ${i + 1} falló - no autenticado`);
        }
      } catch (error) {
        console.error(`❌ Intento ${i + 1} de verificación falló con error:`, error);
      }
      
      if (!autenticado && i < 4) {
        console.log(`⏳ Esperando 500ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!autenticado) {
      console.log('❌ No autenticado después de todos los intentos, redirigiendo a login...');
      alert('Tu sesión expiró o no se pudo verificar. Por favor, inicia sesión nuevamente.');
      window.location.href = 'login.html';
      return;
    }
    
    // Cargar cursos solo si está autenticado
    cargarCursos();
  }
});

// Exportar funciones globales
window.cargarCursos = cargarCursos;
window.renderizarCursos = renderizarCursos;

window.addEventListener('inscripcion:cambio', async (event) => {
  const detalle = event.detail || {};
  if (detalle.inscripcion) {
    actualizarInscripcionLocal(detalle.inscripcion);
    renderizarCursos();
  } else {
    await recargarInscripciones(detalle);
  }
});

async function manejarAccionTarjeta(event) {
  const boton = event.target.closest('[data-action="reiniciar-curso"], [data-action="desinscribir-curso"]');
  if (!boton) return;

  const accion = boton.dataset.action;
  const cursoId = boton.dataset.cursoId;
  if (!accion || !cursoId) return;

  event.preventDefault();
  event.stopPropagation();

  try {
    const dropdownToggle = boton.closest('.dropdown')?.querySelector('[data-bs-toggle="dropdown"]');
    if (dropdownToggle && window.bootstrap?.Dropdown) {
      const dropdown = window.bootstrap.Dropdown.getInstance(dropdownToggle) || new window.bootstrap.Dropdown(dropdownToggle);
      dropdown.hide();
    }
  } catch (error) {
    console.debug('No se pudo cerrar el menú desplegable:', error);
  }

  if (accion === 'reiniciar-curso') {
    const confirmar = window.confirm('¿Quieres reiniciar tu progreso en este curso? Esta acción restablecerá todas las lecciones.');
    if (!confirmar) return;

    boton.classList.add('disabled');

    try {
      const resultado = await window.inscripcionesAPI?.reiniciarCurso?.(cursoId);
      if (resultado?.success && resultado.inscripcion) {
        actualizarInscripcionLocal(resultado.inscripcion);
        renderizarCursos();
        toast?.success?.(resultado.message || 'Tu progreso fue reiniciado.');
      } else {
        toast?.error?.(resultado?.error || 'No se pudo reiniciar el curso.');
      }
    } catch (error) {
      console.error('Error al reiniciar curso:', error);
      toast?.error?.('Ocurrió un error al reiniciar el curso.');
    } finally {
      boton.classList.remove('disabled');
    }
    return;
  }

  if (accion === 'desinscribir-curso') {
    const confirmar = window.confirm('¿Deseas salir de este curso? Se eliminará tu progreso y dejarás de verlo en tu listado.');
    if (!confirmar) return;

    boton.classList.add('disabled');

    try {
      const resultado = await window.inscripcionesAPI?.desinscribirse?.(cursoId);
      if (resultado?.success) {
        removerInscripcionLocal(cursoId);
        renderizarCursos();
        toast?.info?.(resultado.message || 'Se canceló la inscripción del curso.');
      } else {
        toast?.error?.(resultado?.error || 'No se pudo cancelar la inscripción.');
      }
    } catch (error) {
      console.error('Error al cancelar inscripción:', error);
      toast?.error?.('Ocurrió un error al cancelar la inscripción.');
    } finally {
      boton.classList.remove('disabled');
    }
  }
}

document.addEventListener('click', manejarAccionTarjeta);

