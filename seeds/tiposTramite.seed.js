// Load the .env file first, because we need MONGO_URI
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const TipoTramite = require('../models/TipoTramite');

// The starting list
const tiposIniciales = [
    { nombre: 'Permiso de vertimientos', tipoFecha: 'vencimiento' },
    { nombre: 'Concesión de aguas', tipoFecha: 'vencimiento' },
    { nombre: 'Ocupación de cauce', tipoFecha: 'vencimiento' },
    { nombre: 'Requerimiento', tipoFecha: 'plazo' },
    { nombre: 'RUA', tipoFecha: 'plazo' }
];

async function cargarTipos() {

    try {

        // Connect to the database
        await mongoose.connect(process.env.MONGO_URI);

        // Go through the list one by one
        for (let posicion = 0; posicion < tiposIniciales.length; posicion++) {

            const tipo = tiposIniciales[posicion];

            // Check if it already exists, so we can run the script many times
            const existente = await TipoTramite.findOne({ nombre: tipo.nombre });

            if (existente === null) {
                await TipoTramite.create(tipo);
                console.log('Created: ' + tipo.nombre);
            } else {
                console.log('Already exists: ' + tipo.nombre);
            }
        }

    } catch(error) {
        console.log('Seed error: ' + error.message);
    }

    // Close the connection so the script can finish
    await mongoose.disconnect();
}

cargarTipos();