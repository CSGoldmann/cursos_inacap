const mongoose = require('mongoose');

const DiplomaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true,
    index: true
  },
  examen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examen'
  },
  archivoNombre: String,
  archivoRuta: String,
  archivoPublico: String,
  porcentaje: Number,
  fechaEmision: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

DiplomaSchema.index({ usuario: 1, curso: 1 }, { unique: true });

module.exports = mongoose.model('Diploma', DiplomaSchema);

