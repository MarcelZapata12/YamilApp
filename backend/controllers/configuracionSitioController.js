const ConfiguracionSitio = require('../models/ConfiguracionSitio');
const {
  buildPrivateDownloadUrl,
  deleteAsset,
  uploadBuffer
} = require('../utils/cloudinaryStorage');
const { getImageDimensions } = require('../utils/imageMetadata');

function resolveHeroFit(width, height) {
  if (!width || !height) {
    return 'cover';
  }

  return width / height >= 1.45 ? 'cover' : 'contain';
}

function resolveHeroFitFromBuffer(buffer) {
  try {
    const heroDimensions = getImageDimensions(buffer);
    return resolveHeroFit(heroDimensions?.width, heroDimensions?.height);
  } catch (error) {
    console.warn('No se pudieron leer las dimensiones de la portada:', error.message);
    return 'cover';
  }
}

function buildPublicConfig(configuracion) {
  const heroImageUrl = configuracion?.heroBackgroundImageUrl;
  const updatedAt = configuracion?.updatedAt
    ? configuracion.updatedAt.toISOString()
    : null;

  return {
    heroBackgroundImageUrl: heroImageUrl
      ? '/api/configuracion-sitio/portada/imagen'
      : null,
    heroBackgroundImageUpdatedAt: updatedAt,
    heroBackgroundImageFit: heroImageUrl
      ? configuracion.heroBackgroundImageFit || 'cover'
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
    const previousPublicId = configuracion.heroBackgroundImagePublicId;
    const previousResourceType = configuracion.heroBackgroundImageResourceType;
    const previousDeliveryType = configuracion.heroBackgroundImageDeliveryType;
    const uploadedImage = await uploadBuffer(req.file, {
      folder: 'yamilapp/site-settings',
      deliveryType: 'private',
      resourceType: 'image'
    });

    configuracion.heroBackgroundImage = req.file.originalname;
    configuracion.heroBackgroundImageUrl = uploadedImage.url;
    configuracion.heroBackgroundImagePublicId = uploadedImage.publicId;
    configuracion.heroBackgroundImageResourceType = uploadedImage.resourceType;
    configuracion.heroBackgroundImageDeliveryType = uploadedImage.deliveryType;
    configuracion.heroBackgroundImageFormat = uploadedImage.format;
    configuracion.heroBackgroundImageFit = resolveHeroFitFromBuffer(req.file.buffer);
    await configuracion.save();

    if (previousPublicId && previousPublicId !== uploadedImage.publicId) {
      await deleteAsset(
        previousPublicId,
        previousResourceType || 'image',
        previousDeliveryType || 'private'
      );
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

    if (!configuracion?.heroBackgroundImageUrl) {
      return res.status(404).json({ msg: 'No hay imagen configurada' });
    }

    const downloadUrl = buildPrivateDownloadUrl({
      publicId: configuracion.heroBackgroundImagePublicId,
      format: configuracion.heroBackgroundImageFormat,
      resourceType: configuracion.heroBackgroundImageResourceType || 'image',
      deliveryType: configuracion.heroBackgroundImageDeliveryType || 'private',
      expiresInSeconds: 60
    });
    const cloudinaryResponse = await fetch(downloadUrl);

    if (!cloudinaryResponse.ok || !cloudinaryResponse.body) {
      return res.status(404).json({ msg: 'No se encontro la imagen solicitada' });
    }

    res.setHeader(
      'Content-Type',
      cloudinaryResponse.headers.get('content-type') || 'application/octet-stream'
    );

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
