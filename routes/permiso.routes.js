const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permiso.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.verificarToken);

// IMPORTANTE: la ruta /vencimientos debe ir ANTES de /:id
// porque Express lee las rutas de arriba hacia abajo
// si /:id va primero, Express interpreta "vencimientos" como un id

// GET    /api/v1/permisos/vencimientos  → alertas de vencimiento
// GET    /api/v1/permisos               → listar todos
// POST   /api/v1/permisos               → crear uno nuevo
// GET    /api/v1/permisos/:id           → ver uno
// PUT    /api/v1/permisos/:id           → editar uno
// DELETE /api/v1/permisos/:id           → eliminar uno

router.get('/vencimientos', permisoController.vencimientos);
router.get('/', permisoController.listar);
router.post('/', permisoController.crear);
router.get('/:id', permisoController.verUno);
router.put('/:id', permisoController.editar);
router.delete('/:id', permisoController.eliminar);

module.exports = router;