const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  enlaceCompra: {
    type: String,
    required: true,
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Libro', libroSchema);
