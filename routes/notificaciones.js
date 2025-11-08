// routes/notificaciones.js
const express = require('express');
const router = express.Router();
const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

// GET /api/notificaciones - Obtener notificaciones del usuario
router.get('/', requireAuth, async (req, res) => {
  try {
    const { leidas, limite = 50 } = req.query;
    const query = { usuario: req.session.usuario.id };

    if (leidas !== undefined) {
      query.leida = leidas === 'true';
    }

    const [notificaciones, usuario] = await Promise.all([
      Notificacion.find(query)
        .sort({ fechaCreacion: -1 })
        .limit(parseInt(limite)),
      Usuario.findById(req.session.usuario.id).select('notificacionesNoLeidas')
    ]);

    const pendientes = usuario?.notificacionesNoLeidas || [];

    res.json({
      notificaciones,
      noLeidas: pendientes.length,
      pendientes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notificaciones/:id/leer - Marcar como leída
router.put('/:id/leer', requireAuth, async (req, res) => {
  try {
    const notificacion = await Notificacion.findOne({
      _id: req.params.id,
      usuario: req.session.usuario.id
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    notificacion.leida = true;
    notificacion.fechaLeida = new Date();
    await notificacion.save();

    await Usuario.findByIdAndUpdate(
      req.session.usuario.id,
      { $pull: { notificacionesNoLeidas: { notificacion: notificacion._id } } }
    );

    if (req.session.usuario) {
      req.session.usuario.notificacionesNoLeidas = (req.session.usuario.notificacionesNoLeidas || []).filter(
        n => n.notificacion !== notificacion._id.toString()
      );
    }

    res.json({ success: true, notificacion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notificaciones/leer-todas - Marcar todas como leídas
router.put('/leer-todas', requireAuth, async (req, res) => {
  try {
    await Notificacion.updateMany(
      {
        usuario: req.session.usuario.id,
        leida: false
      },
      {
        $set: {
          leida: true,
          fechaLeida: new Date()
        }
      }
    );
    await Usuario.findByIdAndUpdate(
      req.session.usuario.id,
      { $set: { notificacionesNoLeidas: [] } }
    );

    if (req.session.usuario) {
      req.session.usuario.notificacionesNoLeidas = [];
    }

    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notificaciones/:id - Eliminar notificación
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndDelete({
      _id: req.params.id,
      usuario: req.session.usuario.id
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await Usuario.findByIdAndUpdate(
      req.session.usuario.id,
      { $pull: { notificacionesNoLeidas: { notificacion: notificacion._id } } }
    );

    if (req.session.usuario) {
      req.session.usuario.notificacionesNoLeidas = (req.session.usuario.notificacionesNoLeidas || []).filter(
        n => n.notificacion !== notificacion._id.toString()
      );
    }

    res.json({ success: true, message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

