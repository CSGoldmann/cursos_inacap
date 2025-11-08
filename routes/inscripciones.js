// routes/inscripciones.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inscripcion = require('../models/Inscripcion');
const Curso = require('../models/Curso');
const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

// GET /api/inscripciones/usuario - Obtener inscripciones del usuario actual
router.get('/usuario', requireAuth, async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find({ usuario: req.session.usuario.id })
      .populate('curso', 'titulo imagen profesor calificacion numValoraciones nivel idioma duracionTotal secciones')
      .sort({ fechaUltimoAcceso: -1 });

    res.json({ success: true, inscripciones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inscripciones/:cursoId/estado - Obtener estado de inscripción
router.get('/:cursoId/estado', requireAuth, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    }).select('estado progresoGeneral fechaInscripcion fechaUltimoAcceso');

    if (!inscripcion) {
      return res.json({ inscrito: false });
    }

    res.json({
      inscrito: true,
      estado: inscripcion.estado,
      progresoGeneral: inscripcion.progresoGeneral,
      fechaInscripcion: inscripcion.fechaInscripcion,
      fechaUltimoAcceso: inscripcion.fechaUltimoAcceso,
      inscripcionId: inscripcion._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inscripciones/:cursoId - Verificar si está inscrito
router.get('/:cursoId', requireAuth, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    }).populate('curso');

    if (!inscripcion) {
      return res.json({ inscrito: false });
    }

    res.json({ inscrito: true, inscripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inscripciones/:cursoId - Inscribirse a un curso
router.post('/:cursoId', requireAuth, async (req, res) => {
  try {
    const cursoId = req.params.cursoId;
    const usuarioId = req.session.usuario.id;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Verificar si ya está inscrito
    const inscripcionExistente = await Inscripcion.findOne({
      usuario: usuarioId,
      curso: cursoId
    });

    if (inscripcionExistente) {
      return res.json({
        success: true,
        message: 'Ya estás inscrito en este curso',
        inscripcion: inscripcionExistente
      });
    }

    // Crear inscripción
    const inscripcion = new Inscripcion({
      usuario: usuarioId,
      curso: cursoId,
      estado: 'activo'
    });

    // Inicializar progreso de lecciones
    if (curso.secciones && curso.secciones.length > 0) {
      curso.secciones.forEach(seccion => {
        if (seccion.lecciones && seccion.lecciones.length > 0) {
          seccion.lecciones.forEach(leccion => {
            // Usar el _id de la lección si existe, sino usar un identificador temporal
            const leccionId = leccion._id || leccion.id || new mongoose.Types.ObjectId();
            inscripcion.progresoLecciones.push({
              leccionId: leccionId,
            videoCompletado: false,
              completado: false,
              progreso: 0
            });
          });
        }
      });
    }

    inscripcion.calcularProgreso();
    await inscripcion.save();

    const usuario = await Usuario.findById(usuarioId);

    if (usuario) {
      if (!usuario.cursosInscritos.some(c => c.toString() === cursoId.toString())) {
        usuario.cursosInscritos.push(cursoId);
      }

      const progresoExistente = usuario.progresoCursos.find(p => p.curso && p.curso.toString() === cursoId.toString());
      if (progresoExistente) {
        progresoExistente.progreso = inscripcion.progresoGeneral;
        progresoExistente.actualizadoEn = new Date();
      } else {
        usuario.progresoCursos.push({
          curso: cursoId,
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }
    }

    curso.estudiantesInscritos = (curso.estudiantesInscritos || 0) + 1;
    await curso.save();

    // Crear notificación de bienvenida al curso
    const notificacion = await Notificacion.create({
      usuario: usuarioId,
      titulo: 'Bienvenido al curso',
      mensaje: `Te has inscrito exitosamente al curso: ${curso.titulo}`,
      tipo: 'curso',
      link: `/curso.html?id=${cursoId}`
    });

    if (usuario) {
      usuario.notificacionesNoLeidas.push({
        notificacion: notificacion._id,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipo: notificacion.tipo,
        link: notificacion.link,
        fecha: notificacion.fechaCreacion
      });
      await usuario.save();
    }

    if (req.session.usuario && req.session.usuario.id === usuarioId.toString()) {
      if (!req.session.usuario.cursosInscritos) {
        req.session.usuario.cursosInscritos = [];
      }
      if (!req.session.usuario.cursosInscritos.includes(cursoId.toString())) {
        req.session.usuario.cursosInscritos.push(cursoId.toString());
      }

      if (!Array.isArray(req.session.usuario.progresoCursos)) {
        req.session.usuario.progresoCursos = [];
      }
      const progresoSesion = req.session.usuario.progresoCursos.find(p => p.curso === cursoId.toString());
      if (progresoSesion) {
        progresoSesion.progreso = inscripcion.progresoGeneral;
        progresoSesion.actualizadoEn = new Date();
      } else {
        req.session.usuario.progresoCursos.push({
          curso: cursoId.toString(),
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }

      if (!Array.isArray(req.session.usuario.notificacionesNoLeidas)) {
        req.session.usuario.notificacionesNoLeidas = [];
      }
      req.session.usuario.notificacionesNoLeidas.push({
        notificacion: notificacion._id.toString(),
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipo: notificacion.tipo,
        link: notificacion.link,
        fecha: notificacion.fechaCreacion
      });
    }

    res.status(201).json({
      success: true,
      message: 'Inscripción exitosa',
      inscripcion: await Inscripcion.findById(inscripcion._id).populate('curso')
    });
  } catch (error) {
    console.error('Error al inscribirse:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inscripciones/:cursoId/progreso/:leccionId - Actualizar progreso de lección
router.put('/:cursoId/progreso/:leccionId', requireAuth, async (req, res) => {
  try {
    const { leccionId } = req.params;
    const { completado, progreso, videoCompletado } = req.body || {};

    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    });

    if (!inscripcion) {
      return res.status(404).json({ error: 'No estás inscrito en este curso' });
    }

    const leccionProgreso = inscripcion.progresoLecciones.find(
      p => p.leccionId.toString() === leccionId
    );

    const marcandoVideo = videoCompletado === true;

    if (leccionProgreso) {
      if (videoCompletado !== undefined) {
        leccionProgreso.videoCompletado = Boolean(videoCompletado);
      }

      if (completado !== undefined && completado) {
        if (!(leccionProgreso.videoCompletado || marcandoVideo)) {
          return res.status(400).json({ error: 'Debes visualizar el video completo antes de marcar la lección como completada.' });
        }
      }

      if (completado !== undefined) leccionProgreso.completado = completado;
      if (progreso !== undefined) leccionProgreso.progreso = progreso;
      if (completado) leccionProgreso.fechaCompletado = new Date();
    } else {
      if (completado && !marcandoVideo) {
        return res.status(400).json({ error: 'Debes visualizar el video completo antes de marcar la lección como completada.' });
      }

      inscripcion.progresoLecciones.push({
        leccionId,
        videoCompletado: Boolean(videoCompletado),
        completado: completado || false,
        progreso: progreso || 0,
        fechaCompletado: completado ? new Date() : null
      });
    }

    inscripcion.ultimaLeccionAccedida = {
      cursoId: req.params.cursoId,
      leccionId
    };
    inscripcion.fechaUltimoAcceso = new Date();

    inscripcion.calcularProgreso();
    await inscripcion.save();

    const usuario = await Usuario.findById(req.session.usuario.id);
    if (usuario) {
      const progresoExistente = usuario.progresoCursos.find(p => p.curso && p.curso.toString() === req.params.cursoId.toString());
      if (progresoExistente) {
        progresoExistente.progreso = inscripcion.progresoGeneral;
        progresoExistente.actualizadoEn = new Date();
      } else {
        usuario.progresoCursos.push({
          curso: req.params.cursoId,
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }
      await usuario.save();
    }

    if (req.session.usuario) {
      if (!Array.isArray(req.session.usuario.progresoCursos)) {
        req.session.usuario.progresoCursos = [];
      }
      const progresoSesion = req.session.usuario.progresoCursos.find(p => p.curso === req.params.cursoId.toString());
      if (progresoSesion) {
        progresoSesion.progreso = inscripcion.progresoGeneral;
        progresoSesion.actualizadoEn = new Date();
      } else {
        req.session.usuario.progresoCursos.push({
          curso: req.params.cursoId.toString(),
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }
    }

    const inscripcionActualizada = await Inscripcion.findById(inscripcion._id);

    res.json({
      success: true,
      inscripcion: inscripcionActualizada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

