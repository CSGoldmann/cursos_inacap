// scripts/curso-detalle.js
// Cargar y mostrar detalles de un curso

let cursoActual = null;

// Obtener ID del curso desde la URL
function obtenerCursoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Cargar detalles del curso
async function cargarDetalleCurso() {
  const cursoId = obtenerCursoId();
  
  if (!cursoId) {
    // Si no hay ID, intentar mostrar curso estático por defecto
    console.warn('No se especificó ID de curso, mostrando curso estático');
    mostrarCursoEstatico();
    return;
  }

  // Si es un curso estático, mostrar datos estáticos
  if (cursoId.startsWith('static-')) {
    mostrarCursoEstatico(cursoId);
    return;
  }

  // Intentar cargar desde la API
  try {
    cursoActual = await window.cursosAPI.getById(cursoId);
    renderizarDetalleCurso();
  } catch (error) {
    console.error('Error al cargar curso desde API:', error);
    console.log('Intentando mostrar curso estático...');
    // Si falla, intentar mostrar curso estático
    mostrarCursoEstatico(cursoId);
  }
}

// Mostrar curso estático (cuando no hay BD o falla la carga)
function mostrarCursoEstatico(cursoId = null) {
  // Datos estáticos del curso de Ciberseguridad
  const cursoEstatico = {
    titulo: 'Fundamentos de Ciberseguridad',
    descripcion: 'Aprende los fundamentos de la ciberseguridad: conceptos, amenazas, defensas y buenas prácticas. Este curso cubre teoría y ejercicios prácticos para entender cómo proteger sistemas y redes.',
    imagen: 'Pictures/Ciberseguridad.jpg',
    profesor: {
      nombre: 'Johnathan Fletcher',
      descripcion: 'Experto en ciberseguridad con 10+ años de experiencia en defensa y auditoría'
    },
    nivel: 'Intermedio',
    idioma: 'Español',
    duracionTotal: 4.5,
    calificacion: 4.2,
    numValoraciones: 1200,
    secciones: [
      {
        titulo: 'Introducción a la ciberseguridad',
        descripcion: 'Conceptos básicos y fundamentos',
        orden: 1,
        tieneExamen: true,
        lecciones: [
          { titulo: 'Presentación', orden: 1 },
          { titulo: 'Historia y contexto', orden: 2 },
          { titulo: 'Principios básicos', orden: 3 },
          { titulo: 'Actores y amenazas', orden: 4 },
          { titulo: 'Modelos de seguridad', orden: 5 }
        ]
      },
      {
        titulo: 'Arquitectura y modelos',
        descripcion: 'Estructura de sistemas seguros',
        orden: 2,
        tieneExamen: true,
        lecciones: [
          { titulo: 'Capas de seguridad', orden: 1 },
          { titulo: 'Modelos de confianza', orden: 2 },
          { titulo: 'Arquitectura de sistemas seguros', orden: 3 }
        ]
      },
      {
        titulo: 'Amenazas y vectores',
        descripcion: 'Tipos de amenazas cibernéticas',
        orden: 3,
        tieneExamen: true,
        lecciones: [
          { titulo: 'Malware y tipos', orden: 1 },
          { titulo: 'Ingeniería social', orden: 2 },
          { titulo: 'Vulnerabilidades comunes', orden: 3 }
        ]
      },
      {
        titulo: 'Controles y mitigaciones',
        descripcion: 'Herramientas y técnicas para proteger sistemas',
        orden: 4,
        tieneExamen: true,
        lecciones: [
          { titulo: 'Controles administrativos', orden: 1 },
          { titulo: 'Controles técnicos', orden: 2 },
          { titulo: 'Controles físicos', orden: 3 }
        ]
      },
      {
        titulo: 'Seguridad en redes',
        descripcion: 'Protección de infraestructura de red',
        orden: 5,
        tieneExamen: true,
        lecciones: [
          { titulo: 'Fundamentos de redes', orden: 1 },
          { titulo: 'Seguridad en protocolos', orden: 2 },
          { titulo: 'Firewalls y segmentación', orden: 3 }
        ]
      },
      {
        titulo: 'Buenas prácticas y resumen',
        descripcion: 'Resumen del curso y mejores prácticas',
        orden: 6,
        tieneExamen: true,
        lecciones: [
          { titulo: 'Checklist de seguridad', orden: 1 },
          { titulo: 'Métricas y monitoreo', orden: 2 },
          { titulo: 'Planes de respuesta a incidentes', orden: 3 }
        ]
      }
    ]
  };

  cursoActual = cursoEstatico;
  renderizarDetalleCurso();
  
  // Mostrar mensaje informativo si no hay BD
  const container = document.getElementById('curso-detalle-container');
  if (container) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'alert alert-info alert-dismissible fade show';
    infoDiv.innerHTML = `
      <strong>⚠️ Modo de demostración:</strong> Estás viendo datos estáticos. 
      Para ver cursos completos desde la base de datos, asegúrate de que MongoDB esté corriendo y ejecuta: <code>npm run seed</code>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.insertBefore(infoDiv, container.firstChild);
  }
}

// Renderizar detalles del curso
function renderizarDetalleCurso() {
  if (!cursoActual) return;

  const container = document.getElementById('curso-detalle-container');
  if (!container) return;

  // Actualizar imagen
  const imagen = document.querySelector('.course-hero img');
  if (imagen) {
    imagen.src = cursoActual.imagen || 'Pictures/default-course.jpg';
    imagen.alt = cursoActual.titulo;
    imagen.onerror = function() { this.src = 'Pictures/default-course.jpg'; };
  }

  // Actualizar título
  const titulo = document.querySelector('h1.h3');
  if (titulo) titulo.textContent = cursoActual.titulo;

  // Actualizar información del profesor
  const profesorInfo = document.querySelector('.text-muted.mb-2');
  if (profesorInfo) {
    const estrellas = generarEstrellas(cursoActual.calificacion || 0);
    profesorInfo.innerHTML = `Profesor: ${cursoActual.profesor?.nombre || 'Sin especificar'} • 
      <span class="text-warning">${estrellas}</span> • 
      ${cursoActual.numValoraciones || 0} valoraciones`;
  }

  // Actualizar descripción
  const descripcion = document.querySelector('.text-secondary');
  if (descripcion && cursoActual.descripcion) {
    descripcion.textContent = cursoActual.descripcion;
  }

  // Actualizar información del instructor
  const instructorNombre = document.querySelector('.fw-semibold');
  if (instructorNombre) {
    instructorNombre.textContent = cursoActual.profesor?.nombre || 'Sin especificar';
  }

  const instructorDesc = document.querySelector('.small.text-secondary');
  if (instructorDesc && cursoActual.profesor?.descripcion) {
    instructorDesc.textContent = cursoActual.profesor.descripcion;
  }

  // Actualizar detalles del curso
  const detallesList = document.querySelector('.list-unstyled.small');
  if (detallesList) {
    detallesList.innerHTML = `
      <li>Duración: ${cursoActual.duracionTotal || 0}h</li>
      <li>Nivel: ${cursoActual.nivel || 'Intermedio'}</li>
      <li>Idioma: ${cursoActual.idioma || 'Español'}</li>
    `;
  }

  // Renderizar secciones
  renderizarSecciones();
}

// Renderizar secciones del curso
function renderizarSecciones() {
  const accordion = document.getElementById('curriculum');
  if (!accordion || !cursoActual.secciones) return;

  accordion.innerHTML = cursoActual.secciones
    .sort((a, b) => a.orden - b.orden)
    .map((seccion, index) => {
      const isFirst = index === 0;
      const collapseId = `collapse${index}`;
      const headingId = `heading${index}`;

      return `
        <div class="accordion-item">
          <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button ${isFirst ? '' : 'collapsed'}" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                    aria-expanded="${isFirst}" aria-controls="${collapseId}">
              ${index + 1}. ${seccion.titulo}
            </button>
          </h2>
          <div id="${collapseId}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" 
               aria-labelledby="${headingId}" data-bs-parent="#curriculum">
            <div class="accordion-body small">
              ${seccion.descripcion ? `<p>${seccion.descripcion}</p>` : ''}
              ${seccion.lecciones && seccion.lecciones.length > 0 ? `
                <ol class="mb-2">
                  ${seccion.lecciones
                    .sort((a, b) => a.orden - b.orden)
                    .map((leccion, lecIndex) => `
                      <li>
                        ${leccion.titulo}
                        ${leccion.urlVideo ? ` <span class="badge bg-primary">Video</span>` : ''}
                        ${leccion.urlAudio ? ` <span class="badge bg-info">Audio</span>` : ''}
                      </li>
                    `).join('')}
                </ol>
              ` : '<p>No hay lecciones en esta sección.</p>'}
              ${seccion.tieneExamen ? `
                <div class="mt-2">
                  <strong>Examen:</strong> 
                  ${index === cursoActual.secciones.length - 1 ? 'Examen Final' : `Cuestionario de la sección ${index + 1}`}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
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
  const main = document.querySelector('main');
  if (main) {
    main.innerHTML = `
      <div class="container">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Error</h4>
          <p>${mensaje}</p>
          <a href="index.html" class="btn btn-primary">Volver al inicio</a>
        </div>
      </div>
    `;
  }
}

// Cargar curso cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('curso.html')) {
    cargarDetalleCurso();
  }
});

// Exportar funciones globales
window.cargarDetalleCurso = cargarDetalleCurso;

