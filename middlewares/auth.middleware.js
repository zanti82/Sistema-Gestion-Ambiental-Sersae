const jwt = require('jsonwebtoken');


// MIDDLEWARE 1 - VERIFICA TOKEN

function verificarToken(req, res, next) {

    try {

       
        // Primero buscamos en la cookie
        const tokenCookie = req.cookies.authToken;

        // Si no está en la cookie buscamos en el header Authorization
        // El header viene así: "Bearer eyJhbGci..."
        let tokenHeader = null;

        if (req.headers.authorization !== undefined) {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        // Usamos el que esté disponible
        const token = tokenCookie || tokenHeader;

        // Si no hay token en ningún lado
        if (token === null || token === undefined) {
            return res.status(401).json({ mensaje: 'No autorizado. Token no encontrado' });
        }

        // PASO 2 - Verificamos que el token sea válido
        const secreto = process.env.JWT_SECRET;
        const payload = jwt.verify(token, secreto);

        // PASO 3 - Guardamos el payload en req.usuario
        // para que el controller pueda usarlo
        req.usuario = payload;

        // PASO 4 - Pasamos al siguiente middleware o controller
        next();

    } catch(error) {

        // jwt.verify lanza un error si el token es inválido o expiró
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'Token expirado. Inicie sesión nuevamente' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ mensaje: 'Token inválido' });
        }

        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

//MIDDLEWARE 2 - VERIFICA ROL

function verificarRol(rolRequerido) {

    // Devolvemos una función porque necesitamos recibir
    // el rolRequerido antes de que llegue el request
    return function(req, res, next) {

        // req.usuario lo puso el middleware verificarToken
        // por eso este middleware siempre va DESPUÉS de verificarToken
        if (req.usuario === undefined) {
            return res.status(401).json({ mensaje: 'No autorizado. Debe iniciar sesión' });
        }

        const rolDelUsuario = req.usuario.rol;

        if (rolDelUsuario !== rolRequerido) {
            return res.status(403).json({
                mensaje: 'Acceso denegado. No tenés permisos suficientes'
            });
        }

        next();
    };
}

module.exports = {
    verificarToken: verificarToken,
    verificarRol: verificarRol
};