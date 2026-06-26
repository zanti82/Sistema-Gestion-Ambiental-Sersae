const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyecto.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.verificarToken);

// GET    /api/proyectos           → listar todos
// GET    /api/proyectos?clienteId → listar por cliente
// POST   /api/proyectos           → crear uno nuevo
// GET    /api/proyectos/:id       → ver uno
// PUT    /api/proyectos/:id       → editar uno
// DELETE /api/proyectos/:id       → eliminar uno

router.get('/', proyectoController.listar);
router.post('/', proyectoController.crear);
router.get('/:id', proyectoController.verUno);
router.put('/:id', proyectoController.editar);
router.delete('/:id', proyectoController.eliminar);

module.exports = router;