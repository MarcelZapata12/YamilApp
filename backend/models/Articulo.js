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