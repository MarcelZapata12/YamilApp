const mongoose = require('mongoose');

const configuracionSitioSchema = new mongoose.Schema(
  {
    heroBackgroundImage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'ConfiguracionSitio',
  configuracionSitioSchema
);
