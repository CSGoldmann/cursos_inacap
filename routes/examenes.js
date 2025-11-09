// routes/examenes.js
const express = require('express');
const router = express.Router();
const Examen = require('../models/Examen');
const RespuestaExamen = require('../models/RespuestaExamen');
const Curso = require('../models/Curso');
const Inscripcion = require('../models/Inscripcion');
const Usuario = require('../models/Usuario');
const Diploma = require('../models/Diploma');
const Notificacion = require('../models/Notificacion');
const generarDiploma = require('../utils/diplomaGenerator');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

// GET /api/examenes/curso/:cursoId - Obtener examen de una sección o final
router.get('/curso/:cursoId', requireAuth, async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { seccion, tipo } = req.query;

    let query = { curso: cursoId, activo: true };

    if (tipo === 'final') {
      query.tipo = 'final';
    } else if (seccion) {
      query.seccion = seccion;
      query.tipo = 'seccion';
    } else {
      // Por defecto, buscar examen de sección
      query.tipo = 'seccion';
    }

    const examen = await Examen.findOne(query);

    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: cursoId
    });

    if (!inscripcion) {
      return res.status(403).json({ error: 'Debes estar inscrito en el curso para rendir el examen.' });
    }

  const diploma = await Diploma.findOne({
    usuario: req.session.usuario.id,
    curso: cursoId
  }).select('_id archivoPublico');

  if (inscripcion.estado === 'completado' || diploma) {
    return res.status(403).json({
      error: 'Ya finalizaste este curso. Descarga tu diploma en la sección de certificados.',
      diploma: diploma ? {
        id: diploma._id,
        url: diploma.archivoPublico,
        downloadUrl: `/api/diplomas/${diploma._id}/descargar`
      } : null
    });
  }

    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const leccionesCompletadas = new Set(
      inscripcion.progresoLecciones
        .filter(l => l.completado)
        .map(l => l.leccionId.toString())
    );

    const esExamenFinal = tipo === 'final' || examen.tipo === 'final';

    if (esExamenFinal) {
      const todasLasLecciones = [];
      (curso.secciones || []).forEach(sec => {
        (sec.lecciones || []).forEach(lec => {
          if (lec?._id) {
            todasLasLecciones.push(lec._id.toString());
          }
        });
      });

      const leccionesPendientes = todasLasLecciones.filter(id => !leccionesCompletadas.has(id));

      if (leccionesPendientes.length > 0) {
        return res.status(403).json({
          error: 'Debes completar todas las secciones antes de rendir el examen final.'
        });
      }
    } else {
      const seccionId = seccion || (examen.seccion ? examen.seccion.toString() : null);

      if (!seccionId) {
        return res.status(400).json({ error: 'Sección no especificada para el examen.' });
      }

      const seccionCurso = curso.secciones.id(seccionId) ||
        (curso.secciones || []).find(sec => sec._id.toString() === seccionId);

      if (!seccionCurso) {
        return res.status(404).json({ error: 'Sección no encontrada' });
      }

      const leccionesPendientes = (seccionCurso.lecciones || []).filter(lec => {
        if (!lec?._id) return false;
        return !leccionesCompletadas.has(lec._id.toString());
      });

      if (leccionesPendientes.length > 0) {
        return res.status(403).json({
          error: 'Completa todas las lecciones de la sección antes de realizar el examen.'
        });
      }
    }

    // No enviar respuestas correctas al cliente
    const examenParaCliente = examen.toObject();
    examenParaCliente.preguntas = examenParaCliente.preguntas.map(p => {
      const pregunta = { ...p };
      if (p.opciones) {
        pregunta.opciones = p.opciones.map(o => ({
          texto: o.texto,
          esCorrecta: false // No enviar la respuesta correcta
        }));
      }
      return pregunta;
    });

    res.json({ examen: examenParaCliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/examenes/:examenId/enviar - Enviar examen
const reiniciarCurso = async (usuarioId, cursoId) => {
  const inscripcion = await Inscripcion.findOne({ usuario: usuarioId, curso: cursoId });
  if (!inscripcion) return false;

  inscripcion.progresoLecciones.forEach(leccion => {
    leccion.videoCompletado = false;
    leccion.completado = false;
    leccion.progreso = 0;
    leccion.fechaCompletado = null;
  });

  inscripcion.progresoGeneral = 0;
  inscripcion.estado = 'activo';
  inscripcion.ultimaLeccionAccedida = null;
  inscripcion.fechaUltimoAcceso = new Date();
  await inscripcion.save();
  return true;
};

router.post('/:examenId/enviar', requireAuth, async (req, res) => {
  try {
    const { examenId } = req.params;
    const { cursoId, respuestas } = req.body;
    const usuarioId = req.session.usuario.id;

    const examen = await Examen.findById(examenId);
    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const diplomaExistente = await Diploma.findOne({
      usuario: usuarioId,
      curso: cursoId
    }).select('_id');

    if (diplomaExistente) {
      return res.status(403).json({
        success: false,
        error: 'Ya finalizaste este curso. Tu diploma está disponible para descarga.'
      });
    }

    const intentosPrevios = await RespuestaExamen.countDocuments({
      usuario: usuarioId,
      examen: examenId
    });

    if (intentosPrevios >= examen.intentosPermitidos) {
      return res.status(400).json({
        error: `Has alcanzado el límite de intentos (${examen.intentosPermitidos})`
      });
    }

    const preguntasOrdenadas = [...examen.preguntas].sort((a, b) => a.orden - b.orden);
    const respuestasConResultado = respuestas.map(resp => {
      const pregunta = preguntasOrdenadas.find(p => p._id.toString() === resp.preguntaId);
      if (!pregunta) return resp;

      let esCorrecta = false;
      if (pregunta.tipo === 'opcion_multiple') {
        const opcionIndex = parseInt(resp.respuesta, 10);
        esCorrecta = pregunta.opciones[opcionIndex]?.esCorrecta || false;
      } else if (pregunta.tipo === 'verdadero_falso') {
        const respuestaCorrecta = pregunta.opciones.find(o => o.esCorrecta);
        if (respuestaCorrecta) {
          const valorCorrecto = respuestaCorrecta.texto.toLowerCase().includes('verdadero') ? 'true' : 'false';
          esCorrecta = resp.respuesta === valorCorrecto;
        }
      }

      return {
        ...resp,
        esCorrecta,
        puntosObtenidos: esCorrecta ? pregunta.puntos : 0
      };
    });

    const respuestaExamen = new RespuestaExamen({
      usuario: usuarioId,
      examen: examenId,
      curso: cursoId,
      respuestas: respuestasConResultado,
      intento: intentosPrevios + 1,
      fechaInicio: new Date(),
      fechaFinalizacion: new Date()
    });

    const resultado = respuestaExamen.calcularResultado();
    respuestaExamen.puntajeTotal = resultado.puntosTotal;
    respuestaExamen.puntajeMaximo = resultado.puntosMaximo;
    respuestaExamen.porcentaje = resultado.porcentaje;
    respuestaExamen.aprobado = resultado.porcentaje >= examen.porcentajeAprobacion;

    await respuestaExamen.save();

    let intentosRestantes = Math.max(examen.intentosPermitidos - respuestaExamen.intento, 0);
    let cursoReiniciado = false;

    if (!respuestaExamen.aprobado && intentosRestantes === 0) {
      cursoReiniciado = await reiniciarCurso(usuarioId, cursoId);
      intentosRestantes = examen.intentosPermitidos;
      await RespuestaExamen.deleteMany({ usuario: usuarioId, curso: cursoId });
    }

    let diplomaInfo = null;

    if (respuestaExamen.aprobado && examen.tipo === 'final') {
      try {
        const [usuarioDoc, cursoDoc] = await Promise.all([
          Usuario.findById(usuarioId),
          Curso.findById(cursoId)
        ]);

        if (usuarioDoc && cursoDoc) {
          await Inscripcion.findOneAndUpdate(
            { usuario: usuarioId, curso: cursoId },
            {
              $set: {
                estado: 'completado',
                progresoGeneral: 100,
                fechaUltimoAcceso: new Date()
              }
            }
          );

          const progresoCurso = usuarioDoc.progresoCursos?.find(
            p => p.curso && p.curso.toString() === cursoId.toString()
          );
          if (progresoCurso) {
            progresoCurso.progreso = 100;
            progresoCurso.actualizadoEn = new Date();
          } else {
            usuarioDoc.progresoCursos.push({
              curso: cursoId,
              progreso: 100,
              actualizadoEn: new Date()
            });
          }
          await usuarioDoc.save();

          if (req.session.usuario) {
            if (!Array.isArray(req.session.usuario.progresoCursos)) {
              req.session.usuario.progresoCursos = [];
            }
            const progresoSesion = req.session.usuario.progresoCursos.find(
              p => p.curso === cursoId.toString()
            );
            if (progresoSesion) {
              progresoSesion.progreso = 100;
              progresoSesion.actualizadoEn = new Date();
            } else {
              req.session.usuario.progresoCursos.push({
                curso: cursoId.toString(),
                progreso: 100,
                actualizadoEn: new Date()
              });
            }
          }

          const diplomaArchivo = await generarDiploma({
            usuario: usuarioDoc,
            curso: cursoDoc,
            porcentaje: respuestaExamen.porcentaje,
            fecha: new Date()
          });

          const diplomaDoc = await Diploma.findOneAndUpdate(
            { usuario: usuarioId, curso: cursoId },
            {
              usuario: usuarioId,
              curso: cursoId,
              examen: examenId,
              archivoNombre: diplomaArchivo.archivoNombre,
              archivoRuta: diplomaArchivo.rutaRelativa,
              archivoPublico: diplomaArchivo.archivoPublico,
              porcentaje: respuestaExamen.porcentaje,
              fechaEmision: new Date(),
              metadata: {
                puntajeTotal: respuestaExamen.puntajeTotal,
                puntajeMaximo: respuestaExamen.puntajeMaximo
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          const mensajeNotificacion = `¡Felicitaciones! Has aprobado el curso "${cursoDoc.titulo}". Tu diploma ya está disponible para descarga.`;
          const notificacion = await Notificacion.create({
            usuario: usuarioId,
            titulo: 'Diploma disponible',
            mensaje: mensajeNotificacion,
            tipo: 'diploma',
            link: diplomaDoc.archivoPublico
          });

          await Usuario.findByIdAndUpdate(usuarioId, {
            $push: {
              notificacionesNoLeidas: {
                notificacion: notificacion._id,
                titulo: notificacion.titulo,
                mensaje: notificacion.mensaje,
                tipo: notificacion.tipo,
                link: notificacion.link,
                fecha: notificacion.fechaCreacion
              }
            }
          });

          if (req.session.usuario) {
            const notif = {
              notificacion: notificacion._id.toString(),
              titulo: notificacion.titulo,
              mensaje: notificacion.mensaje,
              tipo: notificacion.tipo,
              link: notificacion.link,
              fecha: notificacion.fechaCreacion
            };
            req.session.usuario.notificacionesNoLeidas = [
              ...(req.session.usuario.notificacionesNoLeidas || []),
              notif
            ];
          }

          const io = req.app.get('io');
          if (io) {
            io.emit('notificacion_diploma', {
              usuarioId,
              cursoId,
              curso: cursoDoc.titulo,
              link: diplomaDoc.archivoPublico,
              mensaje: mensajeNotificacion
            });
          }

          diplomaInfo = {
            id: diplomaDoc._id,
            url: diplomaDoc.archivoPublico,
            downloadUrl: `/api/diplomas/${diplomaDoc._id}/descargar`,
            nombreArchivo: diplomaDoc.archivoNombre,
            fechaEmision: diplomaDoc.fechaEmision
          };
        }
      } catch (error) {
        console.error('Error al generar diploma:', error);
      }
    }

    res.json({
      success: true,
      aprobado: respuestaExamen.aprobado,
      porcentaje: respuestaExamen.porcentaje,
      puntajeTotal: respuestaExamen.puntajeTotal,
      puntajeMaximo: respuestaExamen.puntajeMaximo,
      porcentajeAprobacion: examen.porcentajeAprobacion,
      intento: respuestaExamen.intento,
      intentosPermitidos: examen.intentosPermitidos,
      intentosRestantes,
      reiniciado: cursoReiniciado,
      diploma: diplomaInfo
    });
  } catch (error) {
    console.error('Error al enviar examen:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/examenes/curso/:cursoId/resultados - Obtener resultados de exámenes
router.get('/curso/:cursoId/resultados', requireAuth, async (req, res) => {
  try {
    const { cursoId } = req.params;
    const usuarioId = req.session.usuario.id;

    const resultados = await RespuestaExamen.find({
      usuario: usuarioId,
      curso: cursoId
    }).populate('examen').sort({ fechaFinalizacion: -1 });

    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

