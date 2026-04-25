const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const controller = require('../controllers/eventoController');


// ==========================
// RUTAS
// ==========================

//  OBTENER TODOS
router.get('/', controller.obtenerEventos);


//  CREAR (SOLO ADMIN)
router.post(
  '/',
  auth,
  role('admin'),
  controller.crearEvento
);


//  EDITAR (SOLO ADMIN)
router.put(
  '/:id',
  auth,
  role('admin'),
  controller.editarEvento
);


//  ELIMINAR (SOLO ADMIN)
router.delete(
  '/:id',
  auth,
  role('admin'),
  controller.eliminarEvento
);


module.exports = router;