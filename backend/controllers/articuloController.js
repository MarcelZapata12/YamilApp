const Articulo = require('../models/Articulo');
const {
  buildPrivateDownloadUrl,
  deleteAsset,
  uploadBuffer
} = require('../utils/cloudinaryStorage');

// ==========================
// CREAR ARTICULO
// ==========================
exports.crearArticulo = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ msg: req.fileValidationError });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Archivo requerido' });
    }

    if (!req.body.titulo || req.body.titulo.trim() === '') {
      return res.status(400).json({ msg: 'El titulo es obligatorio' });
    }

    const uploadedFile = await uploadBuffer(req.file, {
      folder: 'yamilapp/documentos',
      deliveryType: 'private',
      resourceType: 'raw'
    });

    const nuevo = new Articulo({
      titulo: req.body.titulo.trim(),
      archivo: req.file.originalname,
      archivoUrl: uploadedFile.url,
      cloudinaryPublicId: uploadedFile.publicId,
      cloudinaryResourceType: uploadedFile.resourceType,
      cloudinaryDeliveryType: uploadedFile.deliveryType,
      cloudinaryFormat: uploadedFile.format || 'pdf',
      tipoArchivo: req.file.mimetype
    });

    const saved = await nuevo.save();

    res.status(201).json({
      msg: 'Documento creado',
      articulo: saved
    });
  } catch (err) {
    console.error('Error al crear documento:', err);
    res.status(500).json({
      msg: err.message || 'Error del servidor'
    });
  }
};

// ==========================
// OBTENER TODOS
// ==========================
exports.obtenerArticulos = async (req, res) => {
  try {
    const articulos = await Articulo.find()
      .select(
        '-archivoUrl -cloudinaryPublicId -cloudinaryResourceType -cloudinaryDeliveryType -cloudinaryFormat'
      )
      .sort({ fecha: -1 });

    res.json(articulos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// ELIMINAR
// ==========================
exports.eliminarArticulo = async (req, res) => {
  try {
    const articulo = await Articulo.findById(req.params.id);

    if (!articulo) {
      return res.status(404).json({ msg: 'No encontrado' });
    }

    await deleteAsset(
      articulo.cloudinaryPublicId,
      articulo.cloudinaryResourceType || 'raw',
      articulo.cloudinaryDeliveryType || 'private'
    );

    await Articulo.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// OBTENER ARCHIVO PROTEGIDO
// ==========================
exports.obtenerArchivo = async (req, res) => {
  try {
    const articulo = await Articulo.findById(req.params.id);

    if (!articulo) {
      return res.status(404).json({ msg: 'No encontrado' });
    }

    if (!articulo.cloudinaryPublicId) {
      return res.status(404).json({ msg: 'Archivo no existe' });
    }

    const nombreSeguro = `${articulo.titulo.replace(/[^\w.-]+/g, '_')}.pdf`;
    const downloadUrl = buildPrivateDownloadUrl({
      publicId: articulo.cloudinaryPublicId,
      format: articulo.cloudinaryFormat || 'pdf',
      resourceType: articulo.cloudinaryResourceType || 'raw',
      deliveryType: articulo.cloudinaryDeliveryType || 'private',
      expiresInSeconds: 60
    });
    const cloudinaryResponse = await fetch(downloadUrl);

    if (!cloudinaryResponse.ok || !cloudinaryResponse.body) {
      return res.status(404).json({ msg: 'Archivo no existe' });
    }

    res.setHeader('Content-Type', articulo.tipoArchivo || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nombreSeguro}"`);

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
