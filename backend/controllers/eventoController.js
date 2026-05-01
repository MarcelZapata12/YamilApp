const Evento = require('../models/Evento');
const { notifyImportantEvent } = require('../utils/emailNotifications');

function normalizeTipo(tipo) {
  const validTypes = new Set(['Legal', 'Economico', 'Otro']);
  return validTypes.has(tipo) ? tipo : 'Legal';
}

function normalizeImportante(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function normalizeDescripcion(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// ==========================
// CREAR EVENTO
// ==========================
exports.crearEvento = async (req, res) => {
  try {
    const { titulo, fecha, tipo, importante, descripcion } = req.body;

    if (!titulo || !fecha) {
      return res.status(400).json({ msg: 'Titulo y fecha son obligatorios' });
    }

    const nuevo = new Evento({
      titulo: titulo.trim(),
      fecha,
      descripcion: normalizeDescripcion(descripcion),
      tipo: normalizeTipo(tipo),
      importante: normalizeImportante(importante)
    });

    const saved = await nuevo.save();

    res.status(201).json({
      msg: 'Evento creado',
      evento: saved
    });

    if (saved.importante) {
      notifyImportantEvent(saved).catch((error) => {
        console.error('Error enviando recordatorio importante:', error.message);
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// OBTENER EVENTOS
// ==========================
exports.obtenerEventos = async (req, res) => {
  try {
    const eventos = await Evento.find().sort({ fecha: 1 });
    res.json(eventos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// EDITAR EVENTO
// ==========================
exports.editarEvento = async (req, res) => {
  try {
    const { titulo, fecha, tipo, importante, descripcion } = req.body;
    const previousEvent = await Evento.findById(req.params.id).select('importante');

    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      {
        titulo: titulo?.trim(),
        fecha,
        descripcion: normalizeDescripcion(descripcion),
        tipo: normalizeTipo(tipo),
        importante: normalizeImportante(importante)
      },
      { new: true }
    );

    if (!evento) {
      return res.status(404).json({ msg: 'Evento no encontrado' });
    }

    res.json({
      msg: 'Evento actualizado',
      evento
    });

    if (evento.importante && !previousEvent?.importante) {
      notifyImportantEvent(evento).catch((error) => {
        console.error('Error enviando recordatorio importante:', error.message);
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// ==========================
// ELIMINAR EVENTO
// ==========================
exports.eliminarEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({ msg: 'Evento no encontrado' });
    }

    await Evento.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Evento eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
