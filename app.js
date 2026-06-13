const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')
const connectDB = require('./config/database')

// Carga las variables del archivo .env
dotenv.config();

// Creamos la aplicación Express
const app = express();

//conexion db
connectDB();

//configuracion de middlewares

app.use(express.json()); // Permite que Express entienda JSON en el body de las requests
app.use(express.urlencoded({extended: true})); // Permite que Express entienda formularios HTML (application/x-www-form-urlencoded)
app.use(cookieParser()); //leer cookies de los req

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


