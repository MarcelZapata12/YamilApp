const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    fecha: {
      type: String,
      required: true
    },
    tipo: {
      type: String,
      enum: ['Legal', 'Economico', 'Otro'],
      default: 'Legal'
    },
    importante: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Evento', EventoSchema);
