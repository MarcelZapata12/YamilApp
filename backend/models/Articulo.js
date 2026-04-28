const mongoose = require('mongoose');

const articuloSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  archivo: {
    type: String,
    required: true
  },
  archivoUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  cloudinaryResourceType: {
    type: String,
    default: 'raw'
  },
  cloudinaryDeliveryType: {
    type: String,
    default: 'private'
  },
  cloudinaryFormat: {
    type: String,
    default: 'pdf'
  },
  tipoArchivo: {
    type: String,
    default: 'pdf'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Articulo', articuloSchema);
