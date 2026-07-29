const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicio.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.verificarToken);

// GET    /api/v1/servicios                    → listar todos
// GET    /api/v1/servicios?clienteId=xxx      → filtrar por cliente
// GET    /api/v1/servicios?tipo=tramite       → filtrar por tipo
// GET    /api/v1/servicios?estado=activo      → filtrar por estado
// POST   /api/v1/servicios                    → crear nuevo
// GET    /api/v1/servicios/:id                → ver uno
// PUT    /api/v1/servicios/:id                → editar
// DELETE /api/v1/servicios/:id                → eliminar

router.get('/', servicioController.listar);
router.post('/', servicioController.crear);
router.get('/:id', servicioController.verUno);
router.put('/:id', servicioController.editar);
router.delete('/:id', servicioController.eliminar);

module.exports = router;