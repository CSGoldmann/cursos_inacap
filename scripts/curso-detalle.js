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

  document.title = `${cursoActual.titulo} | Plataforma de Cursos`;

  // Actualizar imagen
  const imagen = document.getElementById('curso-imagen');
  if (imagen) {
    imagen.src = cursoActual.imagen || 'Pictures/default-course.jpg';
    imagen.alt = cursoActual.titulo;
    imagen.onerror = function() { this.src = 'Pictures/default-course.jpg'; };
  }

  // Actualizar título
  const titulo = document.getElementById('curso-titulo');
  if (titulo) titulo.textContent = cursoActual.titulo;

  // Actualizar información del profesor
  const profesorInfo = document.getElementById('curso-metadata');
  if (profesorInfo) {
    const estrellas = generarEstrellas(cursoActual.calificacion || 0);
    const valoraciones = Number(cursoActual.numValoraciones || 0).toLocaleString('es-CL');
    profesorInfo.innerHTML = `Profesor: ${cursoActual.profesor?.nombre || 'Sin especificar'} • 
      <span class="text-warning">${estrellas}</span> • 
      ${valoraciones} valoraciones`;
  }

  // Actualizar descripción
  const descripcion = document.getElementById('curso-descripcion');
  if (descripcion) {
    descripcion.textContent = cursoActual.descripcion || 'Descripción no disponible por el momento.';
  }

  const tagsContainer = document.getElementById('curso-tags');
  if (tagsContainer) {
    const etiquetas = [
      cursoActual.categoria ? { texto: cursoActual.categoria, clase: 'badge bg-light text-dark border' } : null,
      cursoActual.nivel ? { texto: `Nivel ${cursoActual.nivel}`, clase: 'badge bg-primary-subtle text-primary' } : null,
      cursoActual.idioma ? { texto: cursoActual.idioma, clase: 'badge bg-secondary-subtle text-secondary' } : null,
    ].filter(Boolean);

    if (etiquetas.length > 0) {
      tagsContainer.innerHTML = etiquetas.map(tag => `<span class="${tag.clase} rounded-pill px-3 py-1">${tag.texto}</span>`).join('');
    } else {
      tagsContainer.innerHTML = '';
    }
  }

  // Actualizar información del instructor
  const instructorNombre = document.getElementById('instructor-nombre');
  if (instructorNombre) {
    instructorNombre.textContent = cursoActual.profesor?.nombre || 'Sin especificar';
  }

  const instructorDesc = document.getElementById('instructor-bio');
  if (instructorDesc && cursoActual.profesor?.descripcion) {
    instructorDesc.textContent = cursoActual.profesor.descripcion;
  }

  const instructorAvatar = document.getElementById('instructor-avatar');
  if (instructorAvatar) {
    instructorAvatar.src = cursoActual.profesor?.avatar || 'Pictures/profile-icon.png';
    instructorAvatar.alt = cursoActual.profesor?.nombre || 'Instructor del curso';
  }

  // Actualizar detalles del curso
  const detallesList = document.getElementById('curso-detalles-list');
  if (detallesList) {
    detallesList.innerHTML = `
      <li>Duración: ${cursoActual.duracionTotal || 0} h</li>
      <li>Nivel: ${cursoActual.nivel || 'Intermedio'}</li>
      <li>Idioma: ${cursoActual.idioma || 'Español'}</li>
      <li>Estudiantes inscritos: ${Number(cursoActual.estudiantesInscritos || 0).toLocaleString('es-CL')}</li>
    `;
  }

  const resumenSidebar = document.getElementById('curso-resumen-sidebar');
  if (resumenSidebar) {
    resumenSidebar.textContent = `Obtén acceso completo a ${cursoActual.secciones?.length || 0} secciones, evaluaciones y recursos diseñados para dominar ${cursoActual.titulo.toLowerCase()}.`;
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

    const btnPrimario = document.getElementById('btn-cta-primario');
    const btnSecundario = document.getElementById('btn-cta-secundario');
    const btnGuardar = document.getElementById('btn-guardar-favorito');

    if (btnSecundario) {
      btnSecundario.addEventListener('click', () => {
        const curriculum = document.getElementById('curriculum');
        if (curriculum) {
          curriculum.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (btnGuardar) {
      btnGuardar.addEventListener('click', () => {
        alert('Estamos trabajando en la funcionalidad de favoritos. ¡Gracias por tu interés!');
      });
    }

    const sincronizarTextoCTA = (textoBoton) => {
      if (btnPrimario) btnPrimario.textContent = textoBoton;
    };

    const btnEmpezar = document.getElementById("btn-empezar-ahora");
    if (btnEmpezar) {
      const configurarBoton = async () => {
        if (window.auth) {
          await window.auth.init();
          
          if (!window.auth.estaAutenticado()) {
            btnEmpezar.textContent = 'Iniciar sesión para comenzar';
            sincronizarTextoCTA('Iniciar sesión para comenzar');
            btnEmpezar.onclick = () => window.location.href = 'login.html';
            if (btnPrimario) btnPrimario.onclick = btnEmpezar.onclick;
            return;
          }

          const params = new URLSearchParams(window.location.search);
          const cursoId = params.get('id');
          
          if (!cursoId || cursoId.startsWith('static-')) {
            btnEmpezar.disabled = true;
            btnEmpezar.textContent = 'Curso de demostración';
            sincronizarTextoCTA('Curso de demostración');
            if (btnPrimario) btnPrimario.disabled = true;
            return;
          }

          const estaInscrito = await window.inscripcionesAPI.estaInscrito(cursoId);
          
          if (estaInscrito) {
            const continuar = () => window.location.href = `curso-vista.html?id=${cursoId}`;
            btnEmpezar.textContent = 'Continuar curso';
            btnEmpezar.className = 'btn btn-success w-100 mb-2';
            sincronizarTextoCTA('Continuar curso');
            btnEmpezar.onclick = continuar;
            if (btnPrimario) {
              btnPrimario.className = 'btn btn-success px-4';
              btnPrimario.onclick = continuar;
            }
          } else {
            const inscribir = async () => {
              btnEmpezar.disabled = true;
              btnEmpezar.textContent = 'Inscribiendo...';
              sincronizarTextoCTA('Inscribiendo...');
              
              const resultado = await window.inscripcionesAPI.inscribirse(cursoId);
              
              if (resultado.success) {
                btnEmpezar.textContent = 'Continuar curso';
                btnEmpezar.className = 'btn btn-success w-100 mb-2';
                sincronizarTextoCTA('Continuar curso');

                if (window.notificacionesAPI) {
                  await window.notificacionesAPI.cargarNotificaciones();
                }

                setTimeout(() => {
                  window.location.href = `curso-vista.html?id=${cursoId}`;
                }, 800);
              } else {
                alert('Error: ' + (resultado.error || 'No se pudo inscribir'));
                btnEmpezar.disabled = false;
                btnEmpezar.textContent = 'Empezar ahora';
                sincronizarTextoCTA('Empezar ahora');
              }
            };

            btnEmpezar.onclick = inscribir;
            if (btnPrimario) {
              btnPrimario.onclick = inscribir;
              btnPrimario.textContent = 'Empezar ahora';
              btnPrimario.className = 'btn btn-primary px-4';
            }
          }
        }
      };

      configurarBoton();
    }
  }
});

// Exportar funciones globales
window.cargarDetalleCurso = cargarDetalleCurso;

