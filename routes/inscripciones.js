// routes/inscripciones.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inscripcion = require('../models/Inscripcion');
const Curso = require('../models/Curso');
const Notificacion = require('../models/Notificacion');

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
              completado: false,
              progreso: 0
            });
          });
        }
      });
    }

    inscripcion.calcularProgreso();
    await inscripcion.save();

    // Crear notificación de bienvenida al curso
    await Notificacion.create({
      usuario: usuarioId,
      titulo: 'Bienvenido al curso',
      mensaje: `Te has inscrito exitosamente al curso: ${curso.titulo}`,
      tipo: 'curso',
      link: `/curso.html?id=${cursoId}`
    });

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
    const { completado, progreso } = req.body;

    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    });

    if (!inscripcion) {
      return res.status(404).json({ error: 'No estás inscrito en este curso' });
    }

    // Actualizar o crear progreso de lección
    const leccionProgreso = inscripcion.progresoLecciones.find(
      p => p.leccionId.toString() === leccionId
    );

    if (leccionProgreso) {
      if (completado !== undefined) leccionProgreso.completado = completado;
      if (progreso !== undefined) leccionProgreso.progreso = progreso;
      if (completado) leccionProgreso.fechaCompletado = new Date();
    } else {
      inscripcion.progresoLecciones.push({
        leccionId,
        completado: completado || false,
        progreso: progreso || 0,
        fechaCompletado: completado ? new Date() : null
      });
    }

    // Actualizar última lección accedida
    inscripcion.ultimaLeccionAccedida = {
      cursoId: req.params.cursoId,
      leccionId
    };
    inscripcion.fechaUltimoAcceso = new Date();

    // Recalcular progreso general
    inscripcion.calcularProgreso();
    await inscripcion.save();

    res.json({
      success: true,
      inscripcion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

