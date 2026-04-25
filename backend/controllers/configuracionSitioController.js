const fs = require('fs');
const path = require('path');

const ConfiguracionSitio = require('../models/ConfiguracionSitio');
const { getImageDimensionsSync } = require('../utils/imageMetadata');

const heroUploadDir = path.join(__dirname, '..', 'uploads', 'site-settings');

function resolveHeroFit(width, height) {
  if (!width || !height) {
    return 'cover';
  }

  return width / height >= 1.45 ? 'cover' : 'contain';
}

function resolveHeroFitFromFile(filePath) {
  try {
    const heroDimensions = getImageDimensionsSync(filePath);
    return resolveHeroFit(heroDimensions?.width, heroDimensions?.height);
  } catch (error) {
    console.warn('No se pudieron leer las dimensiones de la portada:', error.message);
    return 'cover';
  }
}

function buildPublicConfig(configuracion) {
  const heroFileName = configuracion?.heroBackgroundImage;
  const heroAbsolutePath = heroFileName
    ? path.resolve(path.join(heroUploadDir, heroFileName))
    : null;
  const heroUploadsRoot = `${path.resolve(heroUploadDir)}${path.sep}`;
  const hasValidHeroImage = Boolean(
    heroFileName &&
      heroAbsolutePath &&
      heroAbsolutePath.startsWith(heroUploadsRoot) &&
      fs.existsSync(heroAbsolutePath)
  );
  const updatedAt = configuracion?.updatedAt
    ? configuracion.updatedAt.toISOString()
    : null;

  return {
    heroBackgroundImageUrl: hasValidHeroImage
      ? '/api/configuracion-sitio/portada/imagen'
      : null,
    heroBackgroundImageUpdatedAt: updatedAt,
    heroBackgroundImageFit: hasValidHeroImage
      ? resolveHeroFitFromFile(heroAbsolutePath)
      : null,
  };
}

async function getOrCreateConfig() {
  const existente = await ConfiguracionSitio.findOne();

  if (existente) {
    return existente;
  }

  return ConfiguracionSitio.create({});
}

function deleteHeroImage(fileName) {
  if (!fileName) {
    return;
  }

  const absolutePath = path.resolve(path.join(heroUploadDir, fileName));
  const uploadsRoot = `${path.resolve(heroUploadDir)}${path.sep}`;

  if (!absolutePath.startsWith(uploadsRoot)) {
    return;
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

// ==========================
// OBTENER CONFIGURACION PUBLICA
// ==========================
exports.obtenerConfiguracionPublica = async (req, res) => {
  try {
    const configuracion = await ConfiguracionSitio.findOne();
    res.json(buildPublicConfig(configuracion));
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// ACTUALIZAR IMAGEN HERO
// ==========================
exports.actualizarHeroBackground = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ msg: req.fileValidationError });
    }

    if (!req.file) {
      return res.status(400).json({
        msg: 'Debes seleccionar una imagen para la portada'
      });
    }

    const configuracion = await getOrCreateConfig();
    const previousImage = configuracion.heroBackgroundImage;

    configuracion.heroBackgroundImage = req.file.filename;
    await configuracion.save();

    if (previousImage && previousImage !== req.file.filename) {
      deleteHeroImage(previousImage);
    }

    res.json({
      msg: 'Imagen de portada actualizada correctamente',
      configuracion: buildPublicConfig(configuracion)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// OBTENER IMAGEN HERO
// ==========================
exports.obtenerHeroBackground = async (req, res) => {
  try {
    const configuracion = await ConfiguracionSitio.findOne();

    if (!configuracion?.heroBackgroundImage) {
      return res.status(404).json({ msg: 'No hay imagen configurada' });
    }

    const imagePath = path.resolve(
      path.join(heroUploadDir, configuracion.heroBackgroundImage)
    );
    const uploadsRoot = `${path.resolve(heroUploadDir)}${path.sep}`;

    if (!imagePath.startsWith(uploadsRoot) || !fs.existsSync(imagePath)) {
      return res.status(404).json({ msg: 'No se encontro la imagen solicitada' });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
