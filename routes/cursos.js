// routes/cursos.js
const express = require('express');
const router = express.Router();
const Curso = require('../models/Curso');
const { uploadVideo, uploadAudio, uploadImage, uploadMultiple } = require('../config/multer');

const formatVideoPath = (filename) => `/api/media/videos/${filename}`;
const formatAudioPath = (filename) => `/api/media/audios/${filename}`;

const normalizarRutaMedia = (url, tipo) => {
  if (!url || typeof url !== 'string') return url;
  if (tipo === 'video' && url.startsWith('/uploads/videos/')) {
    return url.replace('/uploads/videos/', '/api/media/videos/');
  }
  if (tipo === 'audio' && url.startsWith('/uploads/audios/')) {
    return url.replace('/uploads/audios/', '/api/media/audios/');
  }
  return url;
};

const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.session.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
};

// GET /api/cursos - Obtener todos los cursos
router.get('/', async (req, res) => {
  try {
    const cursos = await Curso.find({ activo: true }).sort({ fechaCreacion: -1 });
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cursos/:id - Obtener un curso por ID
router.get('/:id', async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cursos - Crear un nuevo curso
router.post('/', requireAdmin, uploadImage, async (req, res) => {
  try {
    const cursoData = {
      ...req.body,
      imagen: req.file ? `/uploads/images/${req.file.filename}` : req.body.imagen
    };

    // Parsear secciones si vienen como string
    if (typeof cursoData.secciones === 'string') {
      cursoData.secciones = JSON.parse(cursoData.secciones);
    }

    const curso = new Curso(cursoData);
    await curso.save();
    res.status(201).json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:id - Actualizar un curso
router.put('/:id', requireAdmin, uploadImage, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Si hay una nueva imagen, actualizar la ruta
    if (req.file) {
      updateData.imagen = `/uploads/images/${req.file.filename}`;
    }

    // Parsear secciones si vienen como string
    if (typeof updateData.secciones === 'string') {
      updateData.secciones = JSON.parse(updateData.secciones);
    }

    const curso = await Curso.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:id - Eliminar un curso (soft delete)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const curso = await Curso.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json({ message: 'Curso eliminado exitosamente', curso });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cursos/:id/secciones - Agregar una sección a un curso
router.post('/:id/secciones', requireAdmin, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    curso.secciones.push(req.body);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:cursoId/secciones/:seccionId - Actualizar una sección
router.put('/:cursoId/secciones/:seccionId', requireAdmin, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    Object.assign(seccion, req.body);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:cursoId/secciones/:seccionId - Eliminar una sección
router.delete('/:cursoId/secciones/:seccionId', requireAdmin, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    curso.secciones.id(req.params.seccionId).remove();
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/cursos/:cursoId/secciones/:seccionId/lecciones - Agregar una lección
router.post('/:cursoId/secciones/:seccionId/lecciones', requireAdmin, uploadMultiple, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const leccionData = { ...req.body };
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    if (videoFile) {
      leccionData.urlVideo = formatVideoPath(videoFile.filename);
    } else if (leccionData.urlVideo) {
      leccionData.urlVideo = normalizarRutaMedia(leccionData.urlVideo, 'video');
    }

    if (!leccionData.urlVideo) {
      return res.status(400).json({
        error: 'Cada módulo requiere un video. Adjunta un archivo MP4, WebM, OGG o MOV.'
      });
    }

    leccionData.tipo = 'video';

    if (audioFile) {
      leccionData.urlAudio = formatAudioPath(audioFile.filename);
    } else if (leccionData.urlAudio) {
      leccionData.urlAudio = normalizarRutaMedia(leccionData.urlAudio, 'audio');
    }

    seccion.lecciones.push(leccionData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId - Actualizar una lección
router.put('/:cursoId/secciones/:seccionId/lecciones/:leccionId', requireAdmin, uploadMultiple, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const leccion = seccion.lecciones.id(req.params.leccionId);
    if (!leccion) {
      return res.status(404).json({ error: 'Lección no encontrada' });
    }

    const updateData = { ...req.body };
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    if (videoFile) {
      updateData.urlVideo = formatVideoPath(videoFile.filename);
    } else if (updateData.urlVideo) {
      updateData.urlVideo = normalizarRutaMedia(updateData.urlVideo, 'video');
    }

    const urlVideoFinal = updateData.urlVideo || leccion.urlVideo;
    if (!urlVideoFinal) {
      return res.status(400).json({
        error: 'Las lecciones deben conservar un video asociado.'
      });
    }

    updateData.tipo = 'video';

    if (audioFile) {
      updateData.urlAudio = formatAudioPath(audioFile.filename);
    } else if (updateData.urlAudio) {
      updateData.urlAudio = normalizarRutaMedia(updateData.urlAudio, 'audio');
    }

    Object.assign(leccion, updateData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId - Eliminar una lección
router.delete('/:cursoId/secciones/:seccionId/lecciones/:leccionId', requireAdmin, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    seccion.lecciones.id(req.params.leccionId).remove();
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

