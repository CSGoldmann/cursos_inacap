// models/RespuestaExamen.js
const mongoose = require('mongoose');

const RespuestaPreguntaSchema = new mongoose.Schema({
  preguntaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  respuesta: {
    type: mongoose.Schema.Types.Mixed, // Puede ser texto, opción seleccionada, etc.
    required: true
  },
  esCorrecta: {
    type: Boolean,
    default: false
  },
  puntosObtenidos: {
    type: Number,
    default: 0
  }
});

const RespuestaExamenSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  examen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examen',
    required: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  respuestas: [RespuestaPreguntaSchema],
  puntajeTotal: {
    type: Number,
    default: 0
  },
  puntajeMaximo: {
    type: Number,
    default: 0
  },
  porcentaje: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  aprobado: {
    type: Boolean,
    default: false
  },
  intento: {
    type: Number,
    default: 1
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFinalizacion: Date,
  tiempoUtilizado: {
    type: Number, // en minutos
    default: 0
  }
});

RespuestaExamenSchema.methods.calcularResultado = function() {
  let correctas = 0;
  let puntosTotal = 0;
  let puntosMaximo = 0;

  this.respuestas.forEach(respuesta => {
    puntosMaximo += respuesta.puntosObtenidos || 0;
    if (respuesta.esCorrecta) {
      correctas++;
      puntosTotal += respuesta.puntosObtenidos || 1;
    }
  });

  this.puntajeTotal = puntosTotal;
  this.puntajeMaximo = puntosMaximo;
  this.porcentaje = puntosMaximo > 0 ? Math.round((puntosTotal / puntosMaximo) * 100) : 0;
  
  // Determinar si aprobó (se actualizará con el porcentaje de aprobación del examen)
  return { correctas, puntosTotal, puntosMaximo, porcentaje: this.porcentaje };
};

module.exports = mongoose.model('RespuestaExamen', RespuestaExamenSchema);

