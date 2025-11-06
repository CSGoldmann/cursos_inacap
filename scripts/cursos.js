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

// Renderizar cursos en el dashboard
function renderizarCursos() {
  const cursosActivosContainer = document.getElementById('cursos-activos-container');
  const otrosCursosContainer = document.getElementById('otros-cursos-container');

  if (!cursosActivosContainer || !otrosCursosContainer) {
    // Si no existen los contenedores, crearlos
    crearContenedores();
    return;
  }

  // Si no hay cursos cargados, mantener los estáticos
  if (!cursosCargados || cursosCargados.length === 0) {
    return;
  }

  const cursosActivos = cursosCargados.filter(c => {
    if (!inscripcionesCargadas || inscripcionesCargadas.length === 0) return false;
    const inscripcion = inscripcionesCargadas.find(i => {
      const cursoId = i.curso._id || i.curso;
      const cursoActualId = c._id || c.id;
      return cursoId && cursoActualId && cursoId.toString() === cursoActualId.toString();
    });
    return inscripcion && inscripcion.estado === 'activo';
  });

  const cursosOtros = cursosCargados.filter(c => {
    if (!inscripcionesCargadas || inscripcionesCargadas.length === 0) return true;
    const inscripcion = inscripcionesCargadas.find(i => {
      const cursoId = i.curso._id || i.curso;
      const cursoActualId = c._id || c.id;
      return cursoId && cursoActualId && cursoId.toString() === cursoActualId.toString();
    });
    return !inscripcion || inscripcion.estado !== 'activo';
  });

  // Reemplazar contenido de contenedores
  if (cursosActivosContainer) {
    if (cursosActivos.length > 0) {
      cursosActivosContainer.innerHTML = cursosActivos.map(curso => {
        const inscripcion = inscripcionesCargadas.find(i => {
          const cursoId = i.curso._id || i.curso;
          const cursoActualId = curso._id || curso.id;
          return cursoId && cursoActualId && cursoId.toString() === cursoActualId.toString();
        });
        return crearTarjetaCurso(curso, true, inscripcion);
      }).join('');
    } else {
      cursosActivosContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No tienes cursos inscritos aún. ¡Inscríbete a uno de los cursos disponibles!</p></div>';
    }
  }

  if (otrosCursosContainer) {
    if (cursosOtros.length > 0) {
      otrosCursosContainer.innerHTML = cursosOtros.map(curso => crearTarjetaCurso(curso, false)).join('');
    } else {
      otrosCursosContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No hay más cursos disponibles.</p></div>';
    }
  }
}

// Crear contenedores si no existen
function crearContenedores() {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  // Buscar el contenedor de "Mis cursos"
  const misCursosSection = dashboardContent.querySelector('.row.row-cols-1.row-cols-md-3.g-4');
  if (misCursosSection) {
    misCursosSection.id = 'cursos-activos-container';
  }

  // Buscar el contenedor de "Otros Cursos"
  const otrosCursosSection = document.querySelector('.row.row-cols-1.row-cols-md-3.g-4');
  if (otrosCursosSection && otrosCursosSection !== misCursosSection) {
    otrosCursosSection.id = 'otros-cursos-container';
  }
}

// Crear tarjeta de curso
function crearTarjetaCurso(curso, esActivo, inscripcion = null) {
  const progreso = inscripcion ? inscripcion.progresoGeneral : calcularProgreso(curso);
  const estrellas = generarEstrellas(curso.calificacion || 0);
  const imagenUrl = curso.imagen || 'Pictures/default-course.jpg';
  const cursoId = curso._id || curso.id;

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="position-relative">
          <a href="curso.html?id=${cursoId}">
            <img src="${imagenUrl}" class="card-img-top" alt="${curso.titulo}" onerror="this.src='Pictures/default-course.jpg'">
          </a>
          <div class="dropdown position-absolute top-0 end-0 m-2">
            <button class="btn btn-light rounded-0 border dropdown-toggle p-1" type="button" 
                    data-bs-toggle="dropdown" aria-expanded="false" aria-label="menu"></button>
            <ul class="dropdown-menu dropdown-menu-end">
              ${esActivo ? `
                <li><a class="dropdown-item" href="#"><img src="Pictures/restart.png" style="width: 16px; height: 16px; margin-right: 8px;">Reiniciar Curso</a></li>
                <li><a class="dropdown-item" href="#"><img src="Pictures/heart.png" style="width: 16px; height: 16px; margin-right: 8px;">Favorito</a></li>
                <li><a class="dropdown-item" href="#"><img src="Pictures/save-file.png" style="width: 16px; height: 16px; margin-right: 8px;">Archivar</a></li>
              ` : `
                <li><a class="dropdown-item" href="curso.html?id=${cursoId}"><img src="Pictures/play.png" style="width: 16px; height: 16px; margin-right: 8px;">Iniciar Curso</a></li>
                <li><a class="dropdown-item" href="#"><img src="Pictures/heart.png" style="width: 16px; height: 16px; margin-right: 8px;">Favorito</a></li>
                <li><a class="dropdown-item" href="#"><img src="Pictures/blind.png" style="width: 16px; height: 16px; margin-right: 8px;">No Mostrar Más</a></li>
              `}
              <li><a class="dropdown-item" href="#"><img src="Pictures/share.png" style="width: 16px; height: 16px; margin-right: 8px;">Compartir</a></li>
            </ul>
          </div>
        </div>
        <div class="card-body py-2">
          <h6 class="card-title mb-1">
            <a href="curso.html?id=${cursoId}" class="text-decoration-none text-dark">${curso.titulo}</a>
          </h6>
          <p class="text-muted small mb-2">Profesor: ${curso.profesor?.nombre || 'Sin especificar'}</p>
          ${esActivo ? `
            <div class="progress" style="height:6px;">
              <div class="progress-bar" role="progressbar" style="width:${progreso}%" aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 small text-secondary">
              <div class="text-warning">${estrellas}</div>
              <div>${progreso}% complete</div>
            </div>
          ` : `
            <div class="d-flex justify-content-between align-items-center mt-2 small text-secondary">
              <div class="text-warning">${estrellas}</div>
              <div>${curso.nivel || 'Intermedio'}</div>
            </div>
          `}
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

