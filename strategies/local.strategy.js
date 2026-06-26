const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User')

// Por defecto passport busca "username" y "password"
// Nosotros vamos a decilre a passport  usamos "email" en vez de "username"

const datosUser = {
    usernameField: 'email',
    passwordField: 'password'
};

// Esta funcion se ejecuta automaticamente
// cuando llamamos a passport.authenticate('local')

const estrategiaLocal = new LocalStrategy(datosUser, async function(email, password, done) {

    try {

        // USUARIO - Buscamos el usuario por email en MongoDB
        const usuario = await User.findOne({ email: email });

        // Si no existe el usuario
        if (usuario === null) {
            return done(null, false, { mensaje: 'El email no está registrado' });
        }

        // Si el usuario está desactivado
        if (usuario.activo === false) {
            return done(null, false, { mensaje: 'Usuario desactivado. Contacte al administrador' });
        }

        // Si el usuario se registró con GitHub no tiene password
        if (usuario.password === null) {
            return done(null, false, { mensaje: 'Este email está registrado con GitHub. Use ese método para ingresar' });
        }

        // PASSWORD - Comparamos el password con bcrypt
        // bcrypt.compare compara el texto plano con el hash guardado
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);

        // Si el password es incorrecto
        if (passwordCorrecto === false) {
            return done(null, false, { mensaje: 'Password incorrecto' });
        }

        // PASO 3 - Todo correcto, devolvemos el usuario
        return done(null, usuario);

    } catch(error) {
        return done(error);
    }

});

// Registramos la estrategia en Passport
passport.use(estrategiaLocal);

module.exports = passport;

