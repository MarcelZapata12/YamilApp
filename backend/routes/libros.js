const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const controller = require('../controllers/libroController');

// ==========================
// RUTAS
// ==========================
router.get('/', controller.obtenerLibros);

router.post('/', auth, role('admin'), controller.crearLibro);

router.delete('/:id', auth, role('admin'), controller.eliminarLibro);

module.exports = router;
