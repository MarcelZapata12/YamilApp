const express = require('express');
const router = express.Router();
const multer = require('multer');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const controller = require('../controllers/articuloController');

// ==========================
// MULTER CONFIG
// ==========================
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
      req.fileValidationError = 'Solo se permiten archivos PDF';
    }
  }
});

// ==========================
// RUTAS
// ==========================
router.post(
  '/',
  auth,
  role('admin'),
  upload.single('archivo'),
  controller.crearArticulo
);

router.get('/', controller.obtenerArticulos);

router.get('/:id/archivo', auth, controller.obtenerArchivo);

router.delete('/:id', auth, role('admin'), controller.eliminarArticulo);

// ==========================
// MANEJO DE ERRORES
// ==========================
router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ msg: err.message });
  }
  next();
});

module.exports = router;
