const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const Diploma = require('../models/Diploma');

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

const formatearDiploma = (diploma) => {
  if (!diploma) return null;
  const plain = diploma.toObject ? diploma.toObject() : diploma;
  return {
    ...plain,
    url: plain.archivoPublico,
    downloadUrl: `/api/diplomas/${plain._id}/descargar`
  };
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const diplomas = await Diploma.find({ usuario: req.session.usuario.id })
      .populate('curso', 'titulo')
      .sort({ fechaEmision: -1 });

    res.json({
      success: true,
      diplomas: diplomas.map(formatearDiploma)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/curso/:cursoId', requireAuth, async (req, res) => {
  try {
    const diploma = await Diploma.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    }).populate('curso', 'titulo');

    if (!diploma) {
      return res.status(404).json({ error: 'Diploma no encontrado' });
    }

    res.json({
      success: true,
      diploma: formatearDiploma(diploma)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/descargar', requireAuth, async (req, res) => {
  try {
    const diploma = await Diploma.findOne({
      _id: req.params.id,
      usuario: req.session.usuario.id
    });

    if (!diploma) {
      return res.status(404).json({ error: 'Diploma no encontrado' });
    }

    if (!diploma.archivoRuta) {
      return res.status(404).json({ error: 'Archivo de diploma no disponible' });
    }

    const rutaAbsoluta = path.isAbsolute(diploma.archivoRuta)
      ? diploma.archivoRuta
      : path.join(__dirname, '..', diploma.archivoRuta);

    const existe = await fs.pathExists(rutaAbsoluta);
    if (!existe) {
      return res.status(404).json({ error: 'Archivo de diploma no encontrado' });
    }

    res.download(rutaAbsoluta, diploma.archivoNombre || `diploma-${diploma._id}.pdf`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

