// models/Examen.js
// Define esquemas reutilizables para los exámenes embebidos en los cursos.
const { Schema } = require('mongoose');

const OpcionSchema = new Schema({
  texto: {
    type: String,
    required: true
  },
  esCorrecta: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const PreguntaSchema = new Schema({
  pregunta: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['opcion_multiple', 'verdadero_falso', 'texto'],
    default: 'opcion_multiple'
  },
  opciones: {
    type: [OpcionSchema],
    default: []
  },
  puntos: {
    type: Number,
    default: 1,
    min: 0
  },
  orden: {
    type: Number,
    required: true
  }
}, { _id: true });

const ExamenSchema = new Schema({
  seccion: {
    type: Schema.Types.ObjectId,
    required: false
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
    type: Number,
    default: 0
  },
  intentosPermitidos: {
    type: Number,
    default: 2,
    min: 1
  },
  porcentajeAprobacion: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  preguntas: {
    type: [PreguntaSchema],
    default: []
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

module.exports = {
  OpcionSchema,
  PreguntaSchema,
  ExamenSchema
};

