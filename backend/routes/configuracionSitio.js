const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const controller = require('../controllers/configuracionSitioController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'site-settings');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `hero-${Date.now()}${extension}`);
  }
});

const upload = multer({
  storage,
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
