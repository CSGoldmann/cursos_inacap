// routes/cursos.js
const express = require('express');
const router = express.Router();
const Curso = require('../models/Curso');
const { uploadVideo, uploadAudio, uploadImage, uploadMultiple } = require('../config/multer');
const path = require('path');

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
router.post('/', uploadImage, async (req, res) => {
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
router.put('/:id', uploadImage, async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
router.post('/:id/secciones', async (req, res) => {
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
router.put('/:cursoId/secciones/:seccionId', async (req, res) => {
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
router.delete('/:cursoId/secciones/:seccionId', async (req, res) => {
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
router.post('/:cursoId/secciones/:seccionId/lecciones', uploadMultiple, async (req, res) => {
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

    // Asignar URLs de archivos subidos
    if (req.files) {
      if (req.files.video) {
        leccionData.urlVideo = `/uploads/videos/${req.files.video[0].filename}`;
        leccionData.tipo = 'video';
      }
      if (req.files.audio) {
        leccionData.urlAudio = `/uploads/audios/${req.files.audio[0].filename}`;
        leccionData.tipo = 'audio';
      }
    }

    seccion.lecciones.push(leccionData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId - Actualizar una lección
router.put('/:cursoId/secciones/:seccionId/lecciones/:leccionId', uploadMultiple, async (req, res) => {
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

    // Actualizar URLs de archivos si se subieron nuevos
    if (req.files) {
      if (req.files.video) {
        updateData.urlVideo = `/uploads/videos/${req.files.video[0].filename}`;
        updateData.tipo = 'video';
      }
      if (req.files.audio) {
        updateData.urlAudio = `/uploads/audios/${req.files.audio[0].filename}`;
        updateData.tipo = 'audio';
      }
    }

    Object.assign(leccion, updateData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId - Eliminar una lección
router.delete('/:cursoId/secciones/:seccionId/lecciones/:leccionId', async (req, res) => {
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

