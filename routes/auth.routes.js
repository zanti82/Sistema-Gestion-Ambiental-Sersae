const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const passport = require('../strategies/github.strategy');


// RUTAS PUBLICAS
// No necesitan token


// Registro de usuario nuevo
// POST /api/auth/register
router.post('/register', authController.register);

// Login con usuario y password
// POST /api/auth/login
router.post('/login', authController.login);

// Logout
// GET /api/auth/logout
router.get('/logout', authController.logout);


// RUTAS GITHUB OAUTH

//Redirige al usuario a GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

//GitHub redirige aquí con el code
router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login-error' }),
    authController.githubCallback
);


// RUTAS PROTEGIDAS
// Necesitan token JWT válido


// Ver perfil del usuario logueado
// GET /api/profile
router.get('/profile', authMiddleware.verificarToken, authController.profile);

// Ver sesión activa
// GET /api/session
router.get('/session', authMiddleware.verificarToken, authController.session);


// RUTA SOLO ADMIN
// Necesita token JWT + rol admin


// Panel de administración
// GET /api/admin
router.get('/admin', authMiddleware.verificarToken, authMiddleware.verificarRol('admin'), function(req, res) {
    return res.status(200).json({
        mensaje: 'Bienvenido al panel de administración',
        usuario: req.usuario
    });
});

module.exports = router;
