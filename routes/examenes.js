// routes/examenes.js
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

function mezclarOpciones(opciones = []) {
  const barajadas = Array.from(opciones);
  for (let i = barajadas.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
  }
  return barajadas;
}

const RespuestaExamen = require('../models/RespuestaExamen');
const Curso = require('../models/Curso');
const Inscripcion = require('../models/Inscripcion');
const Usuario = require('../models/Usuario');
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
    const cursoIdStr = cursoId.toString();
    const { seccion, tipo } = req.query;

    const [curso, inscripcion, usuarioDoc] = await Promise.all([
      Curso.findById(cursoId),
      Inscripcion.findOne({
        usuario: req.session.usuario.id,
        curso: cursoId
      }),
      Usuario.findById(req.session.usuario.id).select('diplomas')
    ]);

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    if (!inscripcion) {
      return res.status(403).json({ error: 'Debes estar inscrito en el curso para rendir el examen.' });
    }

    const examenesCurso = Array.isArray(curso.examenes) ? curso.examenes : [];
    const seccionId = seccion ? seccion.toString() : null;

    let examen = null;
    if (tipo === 'final') {
      examen = examenesCurso.find(ex => ex.activo && ex.tipo === 'final');
    } else if (seccionId) {
      examen = examenesCurso.find(ex =>
        ex.activo &&
        ex.tipo === 'seccion' &&
        ex.seccion &&
        ex.seccion.toString() === seccionId
      );
    } else {
      examen = examenesCurso.find(ex => ex.activo && ex.tipo === 'seccion');
    }

    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const diplomaExistente = usuarioDoc?.diplomas?.find(d => d.curso && d.curso.toString() === cursoIdStr);

    if (inscripcion.estado === 'completado' || diplomaExistente) {
      return res.status(403).json({
        error: 'Ya finalizaste este curso. Descarga tu diploma en la sección de certificados.',
        diploma: diplomaExistente ? {
          id: diplomaExistente._id,
          url: diplomaExistente.archivoPublico,
          downloadUrl: `/api/diplomas/${diplomaExistente._id}/descargar`
        } : null
      });
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
    const examenParaCliente = examen.toObject ? examen.toObject() : {
      ...examen,
      _id: examen._id
    };
    examenParaCliente.preguntas = examenParaCliente.preguntas.map(p => {
      const pregunta = { ...p };
      if (Array.isArray(p.opciones) && p.opciones.length > 0) {
        const opcionesBarajadas = mezclarOpciones(p.opciones);
        pregunta.opciones = opcionesBarajadas.map(o => ({
          _id: o._id,
          opcionId: o._id,
          texto: o.esCorrecta ? `${o.texto} (correcta)` : o.texto,
          esCorrecta: false
        }));
      }
      return pregunta;
    });

    examenParaCliente.curso = curso._id;

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

    if (!cursoId) {
      return res.status(400).json({ error: 'Curso no especificado.' });
    }

    const usuarioDoc = await Usuario.findById(usuarioId);
    if (!usuarioDoc) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const cursoIdStr = cursoId.toString();

    const examenesCurso = Array.isArray(curso.examenes) ? curso.examenes : [];
    const examen = examenesCurso.find(ex => ex._id.toString() === examenId);
    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const diplomaExistente = usuarioDoc.diplomas?.find(
      diploma => diploma.curso && diploma.curso.toString() === cursoIdStr
    );

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
      const puntosPregunta = Number(pregunta.puntos) || 0;

      if (pregunta.tipo === 'opcion_multiple') {
        const valorRespuesta = resp.opcionId || resp.respuesta;
        let opcionSeleccionada = null;

        if (valorRespuesta && mongoose.Types.ObjectId.isValid(valorRespuesta)) {
          opcionSeleccionada = pregunta.opciones.find(o => o._id.toString() === valorRespuesta.toString());
        }

        if (!opcionSeleccionada) {
          const opcionIndex = parseInt(valorRespuesta, 10);
          if (!Number.isNaN(opcionIndex)) {
            opcionSeleccionada = pregunta.opciones[opcionIndex];
          }
        }

        esCorrecta = opcionSeleccionada?.esCorrecta || false;
      } else if (pregunta.tipo === 'verdadero_falso') {
        const respuestaCorrecta = pregunta.opciones.find(o => o.esCorrecta);
        if (respuestaCorrecta) {
          const valorCorrecto = respuestaCorrecta.texto.toLowerCase().includes('verdadero') ? 'true' : 'false';
          esCorrecta = (resp.respuesta || '').toString() === valorCorrecto;
        }
      }

      return {
        ...resp,
        esCorrecta,
        puntosObtenidos: esCorrecta ? puntosPregunta : 0,
        puntosPosibles: puntosPregunta
      };
    });

    const respuestaExamen = new RespuestaExamen({
      usuario: usuarioId,
      examen: examenId,
      curso: curso._id,
      respuestas: respuestasConResultado,
      intento: intentosPrevios + 1,
      fechaInicio: new Date(),
      fechaFinalizacion: new Date()
    });

    const resultado = respuestaExamen.calcularResultado();
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
        const cursoDoc = curso;

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

          const diplomaPayload = {
            curso: curso._id,
            examenId,
            archivoNombre: diplomaArchivo.archivoNombre,
            archivoRuta: diplomaArchivo.rutaRelativa,
            archivoPublico: diplomaArchivo.archivoPublico,
            porcentaje: respuestaExamen.porcentaje,
            fechaEmision: new Date(),
            metadata: {
              puntajeTotal: respuestaExamen.puntajeTotal,
              puntajeMaximo: respuestaExamen.puntajeMaximo
            }
          };

          let diplomaDoc;
          const indiceExistente = (usuarioDoc.diplomas || []).findIndex(
            d => d.curso && d.curso.toString() === cursoIdStr
          );

          if (indiceExistente >= 0) {
            usuarioDoc.diplomas[indiceExistente].set(diplomaPayload);
            diplomaDoc = usuarioDoc.diplomas[indiceExistente];
          } else {
            usuarioDoc.diplomas.push(diplomaPayload);
            diplomaDoc = usuarioDoc.diplomas[usuarioDoc.diplomas.length - 1];
          }

          await usuarioDoc.save();

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

    const resultadosDocs = await RespuestaExamen.find({
      usuario: usuarioId,
      curso: cursoId
    }).sort({ fechaFinalizacion: -1 }).lean();

    const curso = await Curso.findById(cursoId).select('examenes').lean();
    const examenesMap = new Map();
    if (curso?.examenes) {
      curso.examenes.forEach(examen => {
        examenesMap.set(examen._id.toString(), examen);
      });
    }

    const resultados = resultadosDocs.map(resultado => {
      const examenInfo = examenesMap.get(resultado.examen?.toString());
      return {
        ...resultado,
        examen: examenInfo ? { ...examenInfo, curso: cursoId } : null
      };
    });

    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

