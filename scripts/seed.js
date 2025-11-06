// scripts/seed.js
// Script para poblar la base de datos con datos iniciales
// Ejecutar desde Node.js: node scripts/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const Curso = require('../models/Curso');
const Usuario = require('../models/Usuario');
const Inscripcion = require('../models/Inscripcion');
const Notificacion = require('../models/Notificacion');
const Examen = require('../models/Examen');
const connectDB = require('../config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando poblamiento de base de datos...\n');
    
    // Conectar a la base de datos
    await connectDB();

    // Limpiar datos existentes
    console.log('🗑️  Limpiando datos existentes...');
    await Examen.deleteMany({});
    await Inscripcion.deleteMany({});
    await Notificacion.deleteMany({});
    await Curso.deleteMany({});
    await Usuario.deleteMany({}); // Limpiar usuarios para recrearlos
    console.log('✅ Datos limpiados\n');

    const cursosIniciales = [
      {
        titulo: 'Fundamentos de Ciberseguridad',
        descripcion: 'Aprende los fundamentos de la ciberseguridad: conceptos, amenazas, defensas y buenas prácticas. Este curso cubre teoría y ejercicios prácticos para entender cómo proteger sistemas y redes.',
        imagen: 'Pictures/Ciberseguridad.jpg',
        profesor: {
          nombre: 'Johnathan Fletcher',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Experto en ciberseguridad con 10+ años de experiencia en defensa y auditoría'
        },
        categoria: 'Ciberseguridad',
        nivel: 'Intermedio',
        idioma: 'Español',
        duracionTotal: 4.5,
        calificacion: 4.2,
        numValoraciones: 1200,
        precio: 0,
        activo: true,
        estudiantesInscritos: 3500,
        secciones: [
          {
            titulo: 'Introducción a la ciberseguridad',
            descripcion: 'Conceptos básicos y fundamentos de la seguridad informática',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { 
                titulo: 'Presentación del curso', 
                descripcion: 'Bienvenida al curso de Fundamentos de Ciberseguridad',
                tipo: 'texto', 
                orden: 1,
                contenido: '<h4>Bienvenida</h4><p>Este curso te introducirá a los conceptos fundamentales de la ciberseguridad. Aprenderás sobre amenazas, defensas y mejores prácticas para proteger sistemas y redes.</p><h5>Objetivos del curso:</h5><ul><li>Entender los conceptos básicos de ciberseguridad</li><li>Identificar amenazas comunes</li><li>Implementar controles de seguridad</li><li>Aplicar mejores prácticas</li></ul>'
              },
              { 
                titulo: 'Historia y contexto de la ciberseguridad', 
                descripcion: 'Evolución histórica de la seguridad informática',
                tipo: 'texto', 
                orden: 2,
                contenido: '<h4>Historia de la Ciberseguridad</h4><p>La ciberseguridad ha evolucionado significativamente desde los primeros días de la informática. Los primeros virus aparecieron en la década de 1970, y desde entonces, las amenazas han crecido en complejidad y sofisticación.</p><h5>Hitos importantes:</h5><ul><li><strong>1970s:</strong> Primeros virus informáticos (Creeper)</li><li><strong>1980s:</strong> Aparición de malware más sofisticado</li><li><strong>1990s:</strong> Internet masivo y nuevas amenazas</li><li><strong>2000s:</strong> Ataques coordinados y APTs</li><li><strong>2010s-presente:</strong> Ransomware, phishing avanzado, IoT</li></ul>'
              },
              { 
                titulo: 'Principios básicos de seguridad', 
                descripcion: 'Los principios fundamentales que rigen la seguridad',
                tipo: 'texto', 
                orden: 3,
                contenido: '<h4>Principios Básicos</h4><p>La seguridad informática se basa en varios principios fundamentales que deben ser aplicados de manera integral:</p><h5>1. Confidencialidad</h5><p>Garantizar que la información solo sea accesible para personas autorizadas.</p><h5>2. Integridad</h5><p>Asegurar que la información no sea modificada de manera no autorizada.</p><h5>3. Disponibilidad</h5><p>Garantizar que los sistemas y datos estén disponibles cuando se necesiten.</p><h5>4. Autenticación</h5><p>Verificar la identidad de usuarios y sistemas.</p><h5>5. Autorización</h5><p>Controlar el acceso a recursos según permisos establecidos.</p>'
              },
              { 
                titulo: 'Actores y amenazas en el ciberespacio', 
                descripcion: 'Quiénes son los atacantes y qué buscan',
                tipo: 'texto', 
                orden: 4,
                contenido: '<h4>Actores de Amenazas</h4><p>Existen diversos actores en el ciberespacio con diferentes motivaciones:</p><h5>Tipos de atacantes:</h5><ul><li><strong>Script Kiddies:</strong> Usuarios con conocimientos básicos que usan herramientas existentes</li><li><strong>Hackers:</strong> Personas con conocimientos técnicos avanzados</li><li><strong>Organizaciones criminales:</strong> Grupos organizados con fines económicos</li><li><strong>Nation-state actors:</strong> Actores patrocinados por gobiernos</li><li><strong>Insiders:</strong> Empleados o personas con acceso legítimo</li></ul><h5>Motivaciones comunes:</h5><ul><li>Ganancia económica (ransomware, robo de datos)</li><li>Espionaje industrial o gubernamental</li><li>Activismo (hacktivismo)</li><li>Sabotaje</li><li>Experimento o desafío personal</li></ul>'
              },
              { 
                titulo: 'Modelos de seguridad', 
                descripcion: 'Modelos y frameworks de seguridad',
                tipo: 'texto', 
                orden: 5,
                contenido: '<h4>Modelos de Seguridad</h4><p>Los modelos de seguridad proporcionan marcos conceptuales para implementar y gestionar la seguridad:</p><h5>1. Modelo de Defensa en Profundidad</h5><p>Implementar múltiples capas de seguridad para proteger los activos. Si una capa falla, otras continúan protegiendo.</p><h5>2. Modelo de Confianza Cero (Zero Trust)</h5><p>No confiar en nada por defecto, verificar todo. Asume que la red ya está comprometida.</p><h5>3. CIA Triad</h5><p>Confidencialidad, Integridad y Disponibilidad como los tres pilares fundamentales.</p><h5>4. Modelo de Seguridad por Capas</h5><p>Protección en múltiples niveles: física, de red, de aplicación, de datos, etc.</p>'
              }
            ]
          },
          {
            titulo: 'Arquitectura y modelos',
            descripcion: 'Estructura de sistemas seguros y modelos de confianza',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Capas de seguridad', tipo: 'texto', orden: 1, completado: true },
              { titulo: 'Modelos de confianza', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Arquitectura de sistemas seguros', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Amenazas y vectores',
            descripcion: 'Tipos de amenazas cibernéticas y cómo identificarlas',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Malware y tipos', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Ingeniería social', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Vulnerabilidades comunes', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Controles y mitigaciones',
            descripcion: 'Herramientas y técnicas para proteger sistemas',
            orden: 4,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Controles administrativos', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Controles técnicos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Controles físicos', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Seguridad en redes',
            descripcion: 'Protección de infraestructura de red',
            orden: 5,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Fundamentos de redes', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Seguridad en protocolos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Firewalls y segmentación', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Buenas prácticas y resumen',
            descripcion: 'Resumen del curso y mejores prácticas',
            orden: 6,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Checklist de seguridad', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Métricas y monitoreo', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Planes de respuesta a incidentes', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Ethical Hacking',
        descripcion: 'Aprende las técnicas y herramientas utilizadas por hackers éticos para identificar y corregir vulnerabilidades en sistemas. Este curso te preparará para certificaciones como CEH.',
        imagen: 'Pictures/EthicalHacking.jpg',
        profesor: {
          nombre: 'René Guerrero',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Hacker ético certificado con más de 8 años de experiencia en penetration testing'
        },
        categoria: 'Ciberseguridad',
        nivel: 'Avanzado',
        idioma: 'Español',
        duracionTotal: 6,
        calificacion: 4.5,
        numValoraciones: 850,
        precio: 0,
        activo: true,
        estudiantesInscritos: 2100,
        secciones: [
          {
            titulo: 'Fundamentos de hacking ético',
            descripcion: 'Introducción al hacking ético y marco legal',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Introducción al hacking ético', tipo: 'texto', orden: 1, completado: true },
              { titulo: 'Marco legal y ético', tipo: 'texto', orden: 2, completado: true },
              { titulo: 'Metodologías de testing', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Recolección de información',
            descripcion: 'Técnicas de footprinting y reconnaissance',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Footprinting básico', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Google Hacking', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'WHOIS y DNS enumeration', tipo: 'texto', orden: 3, completado: false },
              { titulo: 'Social engineering', tipo: 'texto', orden: 4, completado: false }
            ]
          },
          {
            titulo: 'Escaneo y enumeración',
            descripcion: 'Identificación de sistemas y servicios',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Escaneo de puertos', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Escaneo de vulnerabilidades', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Enumeración de servicios', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Pentesting',
        descripcion: 'Aprende a realizar pruebas de penetración profesionales para evaluar la seguridad de sistemas y aplicaciones. Incluye metodologías, herramientas y reportes.',
        imagen: 'Pictures/Pentesting.jpg',
        profesor: {
          nombre: 'René Guerrero',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Especialista en pruebas de penetración certificado OSCP'
        },
        categoria: 'Ciberseguridad',
        nivel: 'Avanzado',
        idioma: 'Español',
        duracionTotal: 5,
        calificacion: 4.0,
        numValoraciones: 450,
        precio: 0,
        activo: true,
        estudiantesInscritos: 1200,
        secciones: [
          {
            titulo: 'Introducción al pentesting',
            descripcion: 'Fundamentos de pruebas de penetración',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: '¿Qué es el pentesting?', tipo: 'texto', orden: 1, completado: true },
              { titulo: 'Tipos de pruebas', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Metodología PTES', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Laboratorio y herramientas',
            descripcion: 'Configuración de entorno de pruebas',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Kali Linux essentials', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Herramientas de escaneo', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Entornos virtuales', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Python para Análisis de Datos',
        descripcion: 'Domina Python y las bibliotecas esenciales para análisis de datos: NumPy, Pandas, Matplotlib y más. Ideal para científicos de datos y analistas.',
        imagen: 'Pictures/python.png',
        profesor: {
          nombre: 'Jorge Nitales',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Data Scientist con experiencia en Python y análisis de datos. PhD en Ciencias de la Computación'
        },
        categoria: 'Programación',
        nivel: 'Intermedio',
        idioma: 'Español',
        duracionTotal: 8,
        calificacion: 4.7,
        numValoraciones: 2100,
        precio: 0,
        activo: true,
        estudiantesInscritos: 5800,
        secciones: [
          {
            titulo: 'Introducción a Python',
            descripcion: 'Fundamentos del lenguaje Python',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Instalación y configuración', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Sintaxis básica', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Estructuras de datos', tipo: 'texto', orden: 3, completado: false },
              { titulo: 'Funciones y módulos', tipo: 'texto', orden: 4, completado: false }
            ]
          },
          {
            titulo: 'NumPy y Pandas',
            descripcion: 'Bibliotecas fundamentales para datos',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Introducción a NumPy', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Arrays y operaciones', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'DataFrames con Pandas', tipo: 'texto', orden: 3, completado: false },
              { titulo: 'Manipulación de datos', tipo: 'texto', orden: 4, completado: false }
            ]
          },
          {
            titulo: 'Limpieza de datos',
            descripcion: 'Preparación de datos para análisis',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Identificación de datos faltantes', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Manejo de valores atípicos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Normalización de datos', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'IA y Machine Learning',
        descripcion: 'Aprende los conceptos fundamentales de inteligencia artificial y machine learning con ejemplos prácticos. Desde regresión hasta redes neuronales.',
        imagen: 'Pictures/ai.png',
        profesor: {
          nombre: 'Rosamel Fierro',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Investigador en IA y ML con doctorado en Ciencias de la Computación. 15+ años de experiencia'
        },
        categoria: 'Inteligencia Artificial',
        nivel: 'Avanzado',
        idioma: 'Español',
        duracionTotal: 10,
        calificacion: 4.8,
        numValoraciones: 3200,
        precio: 0,
        activo: true,
        estudiantesInscritos: 8900,
        secciones: [
          {
            titulo: 'Introducción al ML',
            descripcion: 'Conceptos básicos de machine learning',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: '¿Qué es Machine Learning?', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Tipos de aprendizaje', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Aplicaciones prácticas', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Regresión',
            descripcion: 'Modelos predictivos de regresión',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Regresión lineal', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Regresión polinomial', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Métricas de evaluación', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Clasificación',
            descripcion: 'Algoritmos de clasificación',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Clasificación binaria', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Árboles de decisión', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Random Forest', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Ciencia de Datos',
        descripcion: 'Comprende el proceso completo de ciencia de datos desde la recolección hasta la visualización de resultados. Incluye proyectos prácticos.',
        imagen: 'Pictures/data-science.jpg',
        profesor: {
          nombre: 'Soila Cerda',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Data Scientist con experiencia en big data y visualización. Ex-Google, actualmente en Microsoft'
        },
        categoria: 'Ciencia de Datos',
        nivel: 'Intermedio',
        idioma: 'Español',
        duracionTotal: 12,
        calificacion: 4.6,
        numValoraciones: 1800,
        precio: 0,
        activo: true,
        estudiantesInscritos: 4200,
        secciones: [
          {
            titulo: 'Fundamentos de Ciencia de Datos',
            descripcion: 'Introducción al campo de la ciencia de datos',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: '¿Qué es la ciencia de datos?', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'El proceso de ciencia de datos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Herramientas y tecnologías', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Estadística para datos',
            descripcion: 'Estadística aplicada a análisis de datos',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Estadística descriptiva', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Distribuciones', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Pruebas de hipótesis', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Machine Learning',
            descripcion: 'Aplicación de ML en ciencia de datos',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Modelos supervisados', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Modelos no supervisados', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Validación de modelos', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      }
    ];

    // Función para agregar contenido lorem ipsum a lecciones
    const agregarContenidoALecciones = (curso) => {
      curso.secciones.forEach(seccion => {
        if (seccion.lecciones) {
          seccion.lecciones.forEach(leccion => {
            if (!leccion.contenido) {
              leccion.contenido = `
                <h4>${leccion.titulo}</h4>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <h5>Conceptos Clave</h5>
                <ul>
                  <li>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</li>
                  <li>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</li>
                  <li>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</li>
                </ul>
                <h5>Ejemplos Prácticos</h5>
                <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
                <p>Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.</p>
              `;
            }
            if (!leccion.descripcion) {
              leccion.descripcion = `Contenido sobre ${leccion.titulo.toLowerCase()}`;
            }
          });
        }
      });
    };

    // Insertar cursos
    console.log('📚 Insertando cursos...\n');
    for (const cursoData of cursosIniciales) {
      // Agregar contenido a todas las lecciones
      agregarContenidoALecciones(cursoData);
      
      const curso = await Curso.create(cursoData);
      console.log(`✅ Curso creado: ${curso.titulo}`);
      console.log(`   - Secciones: ${curso.secciones.length}`);
      const totalLecciones = curso.secciones.reduce((acc, sec) => acc + sec.lecciones.length, 0);
      console.log(`   - Lecciones: ${totalLecciones}\n`);
    }

    const totalCursos = await Curso.countDocuments();
    console.log(`\n✅ Cursos creados: ${totalCursos}\n`);

    // Crear exámenes para las secciones
    console.log('📝 Creando exámenes...\n');
    const cursosCreados = await Curso.find();
    let totalExamenes = 0;

    for (const curso of cursosCreados) {
      const secciones = curso.secciones || [];
      
      for (const seccion of secciones) {
        if (seccion.tieneExamen) {
          const examen = await Examen.create({
            curso: curso._id,
            seccion: seccion._id,
            titulo: `Examen: ${seccion.titulo}`,
            descripcion: `Examen de la sección "${seccion.titulo}" del curso "${curso.titulo}"`,
            tipo: 'seccion',
            tiempoLimite: 30, // 30 minutos
            intentosPermitidos: 3,
            porcentajeAprobacion: 70,
            preguntas: [
              {
                pregunta: `¿Cuál es el concepto principal de "${seccion.titulo}"?`,
                tipo: 'opcion_multiple',
                puntos: 2,
                orden: 1,
                opciones: [
                  { texto: 'Opción A: Concepto correcto', esCorrecta: true },
                  { texto: 'Opción B: Concepto incorrecto', esCorrecta: false },
                  { texto: 'Opción C: Concepto alternativo', esCorrecta: false },
                  { texto: 'Opción D: Ninguna de las anteriores', esCorrecta: false }
                ]
              },
              {
                pregunta: `¿El contenido de "${seccion.titulo}" es fundamental para este curso?`,
                tipo: 'verdadero_falso',
                puntos: 1,
                orden: 2,
                opciones: [
                  { texto: 'Verdadero', esCorrecta: true },
                  { texto: 'Falso', esCorrecta: false }
                ]
              },
              {
                pregunta: `Explica brevemente los puntos clave de "${seccion.titulo}"`,
                tipo: 'texto',
                puntos: 3,
                orden: 3,
                opciones: []
              }
            ]
          });
          totalExamenes++;
          console.log(`✅ Examen creado: ${examen.titulo}`);
        }
      }

      // Crear examen final para el curso
      if (secciones.length > 0) {
        const examenFinal = await Examen.create({
          curso: curso._id,
          seccion: null,
          titulo: `Examen Final: ${curso.titulo}`,
          descripcion: `Examen final del curso "${curso.titulo}"`,
          tipo: 'final',
          tiempoLimite: 60, // 60 minutos
          intentosPermitidos: 2,
          porcentajeAprobacion: 75,
          preguntas: [
            {
              pregunta: `¿Cuál es el objetivo principal del curso "${curso.titulo}"?`,
              tipo: 'opcion_multiple',
              puntos: 3,
              orden: 1,
              opciones: [
                { texto: 'Aprender los fundamentos básicos', esCorrecta: true },
                { texto: 'Dominar técnicas avanzadas solamente', esCorrecta: false },
                { texto: 'Solo teoría sin práctica', esCorrecta: false },
                { texto: 'Ninguna de las anteriores', esCorrecta: false }
              ]
            },
            {
              pregunta: `¿Has completado todas las secciones del curso "${curso.titulo}"?`,
              tipo: 'verdadero_falso',
              puntos: 2,
              orden: 2,
              opciones: [
                { texto: 'Verdadero', esCorrecta: true },
                { texto: 'Falso', esCorrecta: false }
              ]
            },
            {
              pregunta: `Describe qué has aprendido en el curso "${curso.titulo}"`,
              tipo: 'texto',
              puntos: 5,
              orden: 3,
              opciones: []
            }
          ]
        });
        totalExamenes++;
        console.log(`✅ Examen final creado: ${examenFinal.titulo}`);
      }
    }

    console.log(`\n✅ Total de exámenes creados: ${totalExamenes}\n`);

    // Crear usuarios de prueba
    console.log('👥 Creando usuarios de prueba...\n');
    
    const usuariosPrueba = [
      {
        email: 'estudiante@inacap.cl',
        password: '123456',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'estudiante'
      },
      {
        email: 'profesor@inacap.cl',
        password: '123456',
        nombre: 'María',
        apellido: 'González',
        rol: 'profesor'
      },
      {
        email: 'admin@inacap.cl',
        password: '123456',
        nombre: 'Admin',
        apellido: 'Sistema',
        rol: 'admin'
      }
    ];

    const usuariosCreados = [];
    for (const usuarioData of usuariosPrueba) {
      const usuarioExistente = await Usuario.findOne({ email: usuarioData.email });
      if (!usuarioExistente) {
        const usuario = new Usuario(usuarioData);
        await usuario.save();
        usuariosCreados.push(usuario);
        console.log(`✅ Usuario creado: ${usuario.email} (${usuario.rol})`);
      } else {
        usuariosCreados.push(usuarioExistente);
        console.log(`⏭️  Usuario ya existe: ${usuarioData.email}`);
      }
    }

    // Inscribir estudiante a algunos cursos
    const estudiante = usuariosCreados.find(u => u.rol === 'estudiante');
    if (estudiante) {
      console.log('\n📚 Inscribiendo estudiante a cursos...\n');
      const cursosParaInscribir = await Curso.find().limit(3);
      
      for (const curso of cursosParaInscribir) {
        const inscripcionExistente = await Inscripcion.findOne({
          usuario: estudiante._id,
          curso: curso._id
        });

        if (!inscripcionExistente) {
          const inscripcion = new Inscripcion({
            usuario: estudiante._id,
            curso: curso._id,
            estado: 'activo'
          });

          // Recargar el curso para obtener los _ids reales de las lecciones
          const cursoCompleto = await Curso.findById(curso._id);
          
          // Inicializar progreso de lecciones
          if (cursoCompleto && cursoCompleto.secciones) {
            cursoCompleto.secciones.forEach(seccion => {
              if (seccion.lecciones && seccion.lecciones.length > 0) {
                seccion.lecciones.forEach(leccion => {
                  if (leccion._id) {
                    inscripcion.progresoLecciones.push({
                      leccionId: leccion._id,
                      completado: false,
                      progreso: 0
                    });
                  }
                });
              }
            });
          }

          // Marcar algunas lecciones como completadas para mostrar progreso
          if (inscripcion.progresoLecciones.length > 0) {
            const leccionesACompletar = Math.floor(inscripcion.progresoLecciones.length * 0.3);
            for (let i = 0; i < leccionesACompletar; i++) {
              if (inscripcion.progresoLecciones[i]) {
                inscripcion.progresoLecciones[i].completado = true;
                inscripcion.progresoLecciones[i].progreso = 100;
                inscripcion.progresoLecciones[i].fechaCompletado = new Date();
              }
            }
          }

          inscripcion.calcularProgreso();
          await inscripcion.save();
          console.log(`✅ Inscrito a: ${curso.titulo} (${inscripcion.progresoGeneral}% completo)`);
        }
      }
    }

    // Crear algunas notificaciones de ejemplo
    if (estudiante) {
      console.log('\n🔔 Creando notificaciones de ejemplo...\n');
      const notificacionesEjemplo = [
        {
          usuario: estudiante._id,
          titulo: 'Bienvenido a la plataforma',
          mensaje: 'Te damos la bienvenida a la plataforma de cursos INACAP',
          tipo: 'sistema'
        },
        {
          usuario: estudiante._id,
          titulo: 'Nueva tarea disponible',
          mensaje: 'Se ha agregado una nueva tarea en el curso de Ciberseguridad',
          tipo: 'tarea',
          link: '/curso.html'
        }
      ];

      for (const notifData of notificacionesEjemplo) {
        const notifExistente = await Notificacion.findOne({
          usuario: notifData.usuario,
          titulo: notifData.titulo
        });

        if (!notifExistente) {
          await Notificacion.create(notifData);
          console.log(`✅ Notificación creada: ${notifData.titulo}`);
        }
      }
    }

    console.log(`\n🎉 Base de datos poblada exitosamente!`);
    console.log(`📊 Total de cursos: ${totalCursos}`);
    console.log(`👥 Total de usuarios: ${usuariosCreados.length}`);
    console.log('\n📝 Usuarios de prueba:');
    usuariosPrueba.forEach(u => {
      console.log(`   Email: ${u.email} | Contraseña: ${u.password} | Rol: ${u.rol}`);
    });
    console.log('\n✅ Listo para usar la aplicación\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();
