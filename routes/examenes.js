// routes/examenes.js
const express = require('express');
const router = express.Router();
const Examen = require('../models/Examen');
const RespuestaExamen = require('../models/RespuestaExamen');
const Curso = require('../models/Curso');

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
router.post('/:examenId/enviar', requireAuth, async (req, res) => {
  try {
    const { examenId } = req.params;
    const { cursoId, respuestas } = req.body;
    const usuarioId = req.session.usuario.id;

    // Obtener examen con respuestas correctas
    const examen = await Examen.findById(examenId);
    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    // Verificar intentos
    const intentosPrevios = await RespuestaExamen.countDocuments({
      usuario: usuarioId,
      examen: examenId
    });

    if (intentosPrevios >= examen.intentosPermitidos) {
      return res.status(400).json({ 
        error: `Has alcanzado el límite de intentos (${examen.intentosPermitidos})` 
      });
    }

    // Calcular resultados
    const preguntasOrdenadas = [...examen.preguntas].sort((a, b) => a.orden - b.orden);
    const respuestasConResultado = respuestas.map(resp => {
      const pregunta = preguntasOrdenadas.find(p => p._id.toString() === resp.preguntaId);
      
      if (!pregunta) return resp;

      let esCorrecta = false;

      if (pregunta.tipo === 'opcion_multiple') {
        const opcionIndex = parseInt(resp.respuesta);
        esCorrecta = pregunta.opciones[opcionIndex]?.esCorrecta || false;
      } else if (pregunta.tipo === 'verdadero_falso') {
        const respuestaCorrecta = pregunta.opciones.find(o => o.esCorrecta);
        if (respuestaCorrecta) {
          const valorCorrecto = respuestaCorrecta.texto.toLowerCase().includes('verdadero') ? 'true' : 'false';
          esCorrecta = resp.respuesta === valorCorrecto;
        }
      } else {
        // Para texto, se puede evaluar manualmente después
        esCorrecta = false; // Por defecto, requiere revisión manual
      }

      return {
        ...resp,
        esCorrecta,
        puntosObtenidos: esCorrecta ? pregunta.puntos : 0
      };
    });

    // Crear respuesta de examen
    const respuestaExamen = new RespuestaExamen({
      usuario: usuarioId,
      examen: examenId,
      curso: cursoId,
      respuestas: respuestasConResultado,
      intento: intentosPrevios + 1,
      fechaInicio: new Date(),
      fechaFinalizacion: new Date()
    });

    // Calcular resultado
    const resultado = respuestaExamen.calcularResultado();
    respuestaExamen.puntajeTotal = resultado.puntosTotal;
    respuestaExamen.puntajeMaximo = resultado.puntosMaximo;
    respuestaExamen.porcentaje = resultado.porcentaje;
    respuestaExamen.aprobado = resultado.porcentaje >= examen.porcentajeAprobacion;

    await respuestaExamen.save();

    res.json({
      success: true,
      aprobado: respuestaExamen.aprobado,
      porcentaje: respuestaExamen.porcentaje,
      puntajeTotal: respuestaExamen.puntajeTotal,
      puntajeMaximo: respuestaExamen.puntajeMaximo,
      porcentajeAprobacion: examen.porcentajeAprobacion,
      intento: respuestaExamen.intento,
      intentosPermitidos: examen.intentosPermitidos
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

