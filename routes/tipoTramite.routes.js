const express = require('express');
const router = express.Router();
const tipoTramiteController = require('../controllers/tipoTramite.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Everyone logged in can read
router.use(authMiddleware.verificarToken);

router.get('/', tipoTramiteController.listar);

// Only an admin can create: two middlewares in a row, then the controller
router.post('/', authMiddleware.verificarRol('admin'), tipoTramiteController.crear);

module.exports = router;