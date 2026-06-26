const dotenv = require('dotenv');

dotenv.config();
const express = require('express');

const cookieParser = require('cookie-parser')
const connectDB = require('./config/database')
const passport = require('./strategies/local.strategy');
require('./strategies/github.strategy'); 
const configurarSession = require('./config/session');
const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/cliente.routes');     // 👈 nuevo
const proyectoRoutes = require('./routes/proyecto.routes');   // 👈 nuevo
const permisoRoutes = require('./routes/permiso.routes');  

// Carga las variables del archivo .env
//dotenv.config();

// Creamos la aplicación Express
const app = express();

//conexion db
connectDB();

//configuracion de middlewares

app.use(express.json()); // Permite que Express entienda JSON en el body de las requests
app.use(express.urlencoded({extended: true})); // Permite que Express entienda formularios HTML (application/x-www-form-urlencoded)
app.use(cookieParser()); //leer cookies de los req

// Sirve los archivos de la carpeta public
app.use(express.static('public'));

app.use(configurarSession()); // session con mongodb
app.use(passport.initialize()); //inicia el la auntenticacion son passport usando bcrypt

// =====================
// RUTAS
// =====================
app.use('/api/auth', authRoutes); //ruta sin veririfaciones PUBLICAS
app.use('/api/', authRoutes); // todas las rutas que necesitan verificacino
app.use('/api/clientes', clienteRoutes);     // 👈 nuevo
app.use('/api/proyectos', proyectoRoutes);   // 👈 nuevo
app.use('/api/permisos', permisoRoutes);     // 👈 nuevo


//ruta prueba

app.get('/api/health', function(req, res){
    res.json({
        status: 'ok',
        message: 'Servido funcionanando'
    })
} );

//levandatno el serviodr

const PORT = process.env.PORT;

app.listen(PORT, function(){
    console.log(`Server running in port:${PORT}`)
});


