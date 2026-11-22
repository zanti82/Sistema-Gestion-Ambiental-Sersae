const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sede.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All sede routes need a valid token
router.use(authMiddleware.verificarToken);

router.get('/', sedeController.listar);
router.post('/', sedeController.crear);
router.get('/:id', sedeController.verUno);
router.put('/:id', sedeController.editar);
router.delete('/:id', sedeController.eliminar);

module.exports = router;