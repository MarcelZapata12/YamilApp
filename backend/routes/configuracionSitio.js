const express = require('express');
const multer = require('multer');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const controller = require('../controllers/configuracionSitioController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(null, false);
    req.fileValidationError = 'Solo se permiten imagenes';
  }
});

router.get('/', controller.obtenerConfiguracionPublica);
router.get('/portada/imagen', controller.obtenerHeroBackground);
router.put(
  '/portada/imagen',
  auth,
  role('admin'),
  upload.single('imagen'),
  controller.actualizarHeroBackground
);

router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ msg: err.message });
  }

  next();
});

module.exports = router;
