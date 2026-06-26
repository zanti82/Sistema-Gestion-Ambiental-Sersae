const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas de clientes requieren token JWT
// El middleware se aplica a todas las rutas de este router

router.use(authMiddleware.verificarToken);

// GET    /api/clientes        → listar todos
// POST   /api/clientes        → crear uno nuevo
// GET    /api/clientes/:id    → ver uno
// PUT    /api/clientes/:id    → editar uno
// DELETE /api/clientes/:id    → eliminar uno

router.get('/', clienteController.listar);
router.post('/', clienteController.crear);
router.get('/:id', clienteController.verUno);
router.put('/:id', clienteController.editar);
router.delete('/:id', clienteController.eliminar);

module.exports = router;