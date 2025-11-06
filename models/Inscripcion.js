// models/Inscripcion.js
const mongoose = require('mongoose');

const ProgresoLeccionSchema = new mongoose.Schema({
  leccionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completado: {
    type: Boolean,
    default: false
  },
  fechaCompletado: Date,
  progreso: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

const InscripcionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  fechaInscripcion: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['activo', 'completado', 'pausado', 'cancelado'],
    default: 'activo'
  },
  progresoGeneral: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  ultimaLeccionAccedida: {
    cursoId: mongoose.Schema.Types.ObjectId,
    seccionId: mongoose.Schema.Types.ObjectId,
    leccionId: mongoose.Schema.Types.ObjectId
  },
  progresoLecciones: [ProgresoLeccionSchema],
  fechaUltimoAcceso: {
    type: Date,
    default: Date.now
  }
});

// Índice único para evitar inscripciones duplicadas
InscripcionSchema.index({ usuario: 1, curso: 1 }, { unique: true });

// Calcular progreso general automáticamente
InscripcionSchema.methods.calcularProgreso = function() {
  // Este método se puede llamar después de actualizar lecciones
  const totalLecciones = this.progresoLecciones.length;
  const completadas = this.progresoLecciones.filter(l => l.completado).length;
  this.progresoGeneral = totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0;
  return this.progresoGeneral;
};

module.exports = mongoose.model('Inscripcion', InscripcionSchema);

