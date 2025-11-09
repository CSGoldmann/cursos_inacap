const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const Usuario = require('../models/Usuario');

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
  const cursoValor = plain.curso && plain.curso._id ? plain.curso._id : plain.curso;
  return {
    ...plain,
    cursoId: cursoValor ? cursoValor.toString() : null,
    url: plain.archivoPublico,
    downloadUrl: `/api/diplomas/${plain._id}/descargar`
  };
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id)
      .populate('diplomas.curso', 'titulo')
      .select('diplomas');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const diplomasOrdenados = [...(usuario.diplomas || [])].sort(
      (a, b) => new Date(b.fechaEmision || 0) - new Date(a.fechaEmision || 0)
    );

    res.json({
      success: true,
      diplomas: diplomasOrdenados.map(formatearDiploma)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/curso/:cursoId', requireAuth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id)
      .populate('diplomas.curso', 'titulo')
      .select('diplomas');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const diploma = (usuario.diplomas || []).find(d => {
      const cursoValor = d.curso && d.curso._id ? d.curso._id : d.curso;
      return cursoValor && cursoValor.toString() === req.params.cursoId;
    });

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
    const usuario = await Usuario.findById(req.session.usuario.id).select('diplomas');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const diploma = usuario.diplomas.id(req.params.id);

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

