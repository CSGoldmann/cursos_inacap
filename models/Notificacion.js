// models/Notificacion.js
const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['diploma', 'curso', 'mensaje', 'tarea', 'sistema'],
    default: 'sistema'
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaLeida: Date,
  link: String, // URL opcional para redirigir al hacer clic
  datos: mongoose.Schema.Types.Mixed // Datos adicionales flexibles
});

// Índice para búsquedas eficientes
NotificacionSchema.index({ usuario: 1, leida: 1, fechaCreacion: -1 });

module.exports = mongoose.model('Notificacion', NotificacionSchema);

