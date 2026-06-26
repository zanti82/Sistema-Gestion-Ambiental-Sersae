const session = require('express-session');
const connectMongo = require('connect-mongo');

const MongoStore = connectMongo.MongoStore;

function configurarSession() {

    const opcionesSession = {

        // El secreto para firmar la cookie de sesión
        secret: process.env.SESSION_SECRET,

        // false → no guarda la sesión si no hubo cambios
        resave: false,

        // false → no crea sesión hasta que haya algo que guardar
        saveUninitialized: false,

        // Donde guardamos las sesiones → MongoDB
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions',
            ttl: 60 * 60 // 1 hora en segundos
        }),

        // Configuración de la cookie de sesión
        cookie: {
            httpOnly: true,
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 // 1 hora en milisegundos
        }
    };

    return session(opcionesSession);
}

module.exports = configurarSession;