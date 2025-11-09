const { Schema } = require('mongoose');

const DiplomaSchema = new Schema({
  curso: {
    type: Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  examenId: {
    type: Schema.Types.ObjectId
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
    type: Schema.Types.Mixed,
    default: {}
  },
  numeroCertificado: String
}, {
  _id: true,
  timestamps: true
});

module.exports = DiplomaSchema;

