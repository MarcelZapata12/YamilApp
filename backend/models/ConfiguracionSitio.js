const mongoose = require('mongoose');

const configuracionSitioSchema = new mongoose.Schema(
  {
    heroBackgroundImage: {
      type: String,
      default: null
    },
    heroBackgroundImageUrl: {
      type: String,
      default: null
    },
    heroBackgroundImagePublicId: {
      type: String,
      default: null
    },
    heroBackgroundImageResourceType: {
      type: String,
      default: 'image'
    },
    heroBackgroundImageFit: {
      type: String,
      enum: ['cover', 'contain', null],
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
