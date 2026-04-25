const Libro = require('../models/Libro');

function normalizePurchaseUrl(value = '') {
  const trimmedValue = value.trim();
  const normalizedValue = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  const parsedUrl = new URL(normalizedValue);

  if (!/^https?:$/i.test(parsedUrl.protocol)) {
    throw new Error('El enlace debe usar http o https');
  }

  return parsedUrl.toString();
}

// ==========================
// CREAR LIBRO
// ==========================
exports.crearLibro = async (req, res) => {
  try {
    const { titulo, descripcion, enlaceCompra } = req.body;

    if (!titulo?.trim() || !descripcion?.trim() || !enlaceCompra?.trim()) {
      return res.status(400).json({
        msg: 'Titulo, descripcion y enlace de compra son obligatorios'
      });
    }

    let enlaceNormalizado;

    try {
      enlaceNormalizado = normalizePurchaseUrl(enlaceCompra);
    } catch (error) {
      return res.status(400).json({
        msg: 'El enlace de compra no es valido'
      });
    }

    const nuevoLibro = new Libro({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      enlaceCompra: enlaceNormalizado
    });

    const saved = await nuevoLibro.save();

    res.status(201).json({
      msg: 'Libro recomendado creado correctamente',
      libro: saved
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// OBTENER LIBROS
// ==========================
exports.obtenerLibros = async (req, res) => {
  try {
    const libros = await Libro.find().sort({ fecha: -1 });
    res.json(libros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// ELIMINAR LIBRO
// ==========================
exports.eliminarLibro = async (req, res) => {
  try {
    const libro = await Libro.findByIdAndDelete(req.params.id);

    if (!libro) {
      return res.status(404).json({ msg: 'Libro no encontrado' });
    }

    res.json({ msg: 'Libro eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
