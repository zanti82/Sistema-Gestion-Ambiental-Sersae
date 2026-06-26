const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User')

// REGISTER // POST /api/v1/auth/register
// Crea un usuario nuevo en la base de datos

async function register (req,res){

    try {

        //DATOS DLE BODY
        const nombre = req.body.nombre;
        const email = req.body.email;
        const password = req.body.password;
        const rol = req.body.rol;

        // VALIDACION DE DATOS
        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        if (email === undefined || email === '') {
            return res.status(400).json({ mensaje: 'El email es obligatorio' });
        }

        if (password === undefined || password === '') {
            return res.status(400).json({ mensaje: 'El password es obligatorio' });
        }

        // VERIFICACION DE EMAIL, YA QUE LOS TENEMOS COMO UNIQUE
        const usuarioExistente = await User.findOne({ email: email });

        if (usuarioExistente !== null) {
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }

        //ENCRIPTACION DE PASSWORD

        // El numero 10 es el "salt rounds" - cuántas veces encripta
        // Más alto = más seguro pero más lento
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptado = await bcrypt.hash(password, salt);

        //CREAMOS EL USER PARA GUARDAR

        const usuarioNuevo = new User({
            nombre: nombre,
            email: email,
            password: passwordEncriptado,
            rol: rol
        })

        // GUARDAMOS EN MONGO
        const usuarioGuardado = await usuarioNuevo.save();

        // DEVOLVEMOS EL RES
        return res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {
                id: usuarioGuardado._id,
                nombre: usuarioGuardado.nombre,
                email: usuarioGuardado.email,
                rol: usuarioGuardado.rol
            }
        });

        
        
    } catch (error) {

        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
        
    }
}

// LOGIN // POST /api/v1/auth/login
// Verifica credenciales y genera JWT

function login(req, res, next) {

    passport.authenticate('local', function(error, usuario, info) {

        // Si hubo un error técnico
        if (error !== null) {
            return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
        }

        // Si las credenciales son incorrectas
        // usuario viene false cuando Passport llama done(null, false)
        if (usuario === false) {
            return res.status(401).json({ mensaje: info.mensaje });
        }

        // Todo correcto - generamos el JWT
        // El payload es la información que va dentro del token
        const payload = {
            userId: usuario._id,
            rol: usuario.rol
        };

        const secreto = process.env.JWT_SECRET;
        const opciones = { expiresIn: '1h' };

        const token = jwt.sign(payload, secreto, opciones);

        // Enviamos el token en una cookie httpOnly
        // httpOnly: true  → JavaScript del navegador NO puede leerla
        // sameSite: 'Lax' → protección contra CSRF
        // secure          → solo HTTPS en producción
        const esProduccion = process.env.NODE_ENV === 'production';

        res.cookie('authToken', token, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: esProduccion
        });

        //  Guardamos datos del usuario en la sesión
        req.session.usuario = {
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        };

        // También lo enviamos en el body para que Postman pueda verlo
        return res.status(200).json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    })(req, res, next);
}

// LOGOUT // GET /api/v1/auth/logout
// Limpia la cookie y destruye la sesión

function logout(req, res) {

    // Limpiamos la cookie del token
    res.clearCookie('authToken');

    // Si existe una sesión activa la destruimos
    if (req.session !== undefined) {
        req.session.destroy(function(error) {
            if (error !== null && error !== undefined) {
                return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
            }
            return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
        });
    } else {
        return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
    }
}

// PROFILe // GET /api/v1/profile
// Devuelve los datos del usuario logueado
// Esta ruta va a estar protegida por JWT

async function profile(req, res) {

    try {

        // req.usuario lo agrega el middleware de JWT
        // Lo vamos a crear en el Paso 7
        const usuario = await User.findById(req.usuario.userId);

        if (usuario === null) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                creadoEn: usuario.createdAt
            }
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}


// SESSION // GET /api/v1/session
// Devuelve los datos de la sesión activa

function session(req, res) {

    if (req.session !== undefined && req.session.usuario !== undefined) {
        return res.status(200).json({
            activa: true,
            usuario: req.session.usuario
        });
    }

    return res.status(200).json({
        activa: false,
        mensaje: 'No hay sesión activa'
    });
}

// GITHUB CALLBACK

// GET /api/auth/github/callback
// GitHub redirige aquí después de autenticar

function githubCallback(req, res) {

    // req.user lo pone Passport después de la estrategia
    const usuario = req.user;

    const payload = {
        userId: usuario._id,
        rol: usuario.rol
    };

    const secreto = process.env.JWT_SECRET;
    const opciones = { expiresIn: '1h' };
    const token = jwt.sign(payload, secreto, opciones);

    const esProduccion = process.env.NODE_ENV === 'production';

    // Guardamos el token en cookie
    res.cookie('authToken', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: esProduccion
    });

    // Guardamos en sesión
    req.session.usuario = {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    };

    // Redirigimos al dashboard
    return res.redirect('/dashboard.html');
}

// Exportamos todas las funciones
module.exports = {
    register: register,
    login: login,
    logout: logout,
    profile: profile,
    session: session,
    githubCallback: githubCallback
};