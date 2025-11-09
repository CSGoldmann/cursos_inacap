const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const Usuario = require('../models/Usuario');
const { upload } = require('../config/multer');

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

const uploadFotoPerfil = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('fotoPerfil')(req, res, next);
  }
  return next();
};

const limpiarUsuario = (usuario) => {
  if (!usuario) return null;
  const plano = usuario.toObject ? usuario.toObject() : { ...usuario };
  delete plano.password;
  return plano;
};

router.get('/me', requireAuth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true, usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', requireAuth, uploadFotoPerfil, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const {
      nombre,
      apellido,
      direccion,
      fechaNacimiento,
      passwordActual,
      passwordNueva,
      eliminarFoto
    } = req.body || {};

    if (nombre !== undefined) {
      usuario.nombre = nombre.trim() || usuario.nombre;
    }

    if (apellido !== undefined) {
      usuario.apellido = apellido.trim() || usuario.apellido;
    }

    if (direccion !== undefined) {
      usuario.direccion = direccion.trim();
    }

    if (fechaNacimiento !== undefined) {
      if (fechaNacimiento === '' || fechaNacimiento === null) {
        usuario.fechaNacimiento = null;
      } else {
        const fecha = new Date(fechaNacimiento);
        if (Number.isNaN(fecha.getTime())) {
          return res.status(400).json({ error: 'La fecha de nacimiento no es válida.' });
        }
        usuario.fechaNacimiento = fecha;
      }
    }

    if (passwordActual || passwordNueva) {
      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva contraseña.' });
      }

      const coincide = await usuario.comparePassword(passwordActual);
      if (!coincide) {
        return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
      }

      usuario.password = passwordNueva;
    }

    const solicitarEliminarFoto = typeof eliminarFoto !== 'undefined' &&
      ['true', '1', 'sí', 'si', 'on'].includes(String(eliminarFoto).toLowerCase());

    if (solicitarEliminarFoto && !req.file) {
      if (usuario.fotoPerfil && usuario.fotoPerfil.startsWith('/uploads/images/')) {
        try {
          const rutaAnterior = path.join(__dirname, '..', usuario.fotoPerfil);
          if (await fs.pathExists(rutaAnterior)) {
            await fs.remove(rutaAnterior);
          }
        } catch (error) {
          console.warn('No se pudo eliminar la foto anterior:', error.message);
        }
      }
      usuario.fotoPerfil = 'Pictures/profile.png';
    }

    if (req.file) {
      const rutaPublica = `/uploads/images/${req.file.filename}`;

      if (usuario.fotoPerfil && usuario.fotoPerfil.startsWith('/uploads/images/') && usuario.fotoPerfil !== rutaPublica) {
        try {
          const rutaAnterior = path.join(__dirname, '..', usuario.fotoPerfil);
          if (await fs.pathExists(rutaAnterior)) {
            await fs.remove(rutaAnterior);
          }
        } catch (error) {
          console.warn('No se pudo eliminar la foto anterior:', error.message);
        }
      }

      usuario.fotoPerfil = rutaPublica;
    }

    await usuario.save();

    if (req.session.usuario) {
      req.session.usuario.nombre = usuario.nombre;
      req.session.usuario.apellido = usuario.apellido;
      req.session.usuario.nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
      req.session.usuario.fotoPerfil = usuario.fotoPerfil;
    }

    const usuarioLimpio = limpiarUsuario(usuario);
    res.json({ success: true, usuario: usuarioLimpio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

