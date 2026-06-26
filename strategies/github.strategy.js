const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const opcionesGithub = {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
};

const estrategiaGithub = new GitHubStrategy(opcionesGithub, async function(accessToken, refreshToken, profile, done) {

    try {

        // Extraemos el email del perfil de GitHub
        // GitHub puede devolver varios emails, buscamos el principal
        let email = null;

        if (profile.emails !== undefined && profile.emails.length > 0) {
            email = profile.emails[0].value;
        }

        //Buscamos si ya existe un usuario con ese githubId
        const usuarioExistente = await User.findOne({ githubId: profile.id });

        // Si ya existe lo devolvemos directamente
        if (usuarioExistente !== null) {
            return done(null, usuarioExistente);
        }

        // Si no existe, verificamos si hay un usuario
        // con el mismo email (se registró antes con password)
        let usuarioPorEmail = null;

        if (email !== null) {
            usuarioPorEmail = await User.findOne({ email: email });
        }

        // Si existe un usuario con ese email lo vinculamos con GitHub
        if (usuarioPorEmail !== null) {
            usuarioPorEmail.githubId = profile.id;
            await usuarioPorEmail.save();
            return done(null, usuarioPorEmail);
        }

        // Si no existe de ninguna forma, creamos usuario nuevo
        const usuarioNuevo = new User({
            nombre: profile.displayName || profile.username,
            email: email,
            password: null,
            githubId: profile.id,
            rol: 'asistente'
        });

        const usuarioGuardado = await usuarioNuevo.save();

        return done(null, usuarioGuardado);

    } catch(error) {
        return done(error);
    }

});

passport.use(estrategiaGithub);

module.exports = passport;