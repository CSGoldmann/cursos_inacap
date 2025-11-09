// models/Examen.js
const mongoose = require('mongoose');

const OpcionSchema = new mongoose.Schema({
  texto: {
    type: String,
    required: true
  },
  esCorrecta: {
    type: Boolean,
    default: false
  }
});

const PreguntaSchema = new mongoose.Schema({
  pregunta: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['opcion_multiple', 'verdadero_falso', 'texto'],
    default: 'opcion_multiple'
  },
  opciones: [OpcionSchema],
  puntos: {
    type: Number,
    default: 1
  },
  orden: {
    type: Number,
    required: true
  }
});

const ExamenSchema = new mongoose.Schema({
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  seccion: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // null para examen final
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: String,
  tipo: {
    type: String,
    enum: ['seccion', 'final'],
    default: 'seccion'
  },
  tiempoLimite: {
    type: Number, // en minutos, 0 = sin límite
    default: 0
  },
  intentosPermitidos: {
    type: Number,
    default: 2
  },
  porcentajeAprobacion: {
    type: Number,
    default: 70, // 70% para aprobar
    min: 0,
    max: 100
  },
  preguntas: [PreguntaSchema],
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Examen', ExamenSchema);

