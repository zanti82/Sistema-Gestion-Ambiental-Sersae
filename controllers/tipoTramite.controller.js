const TipoTramite = require('../models/TipoTramite');

// List only the active types, in alphabetical order
async function listar(req, res) {

    try {

        const tipos = await TipoTramite.find({ activo: true }).sort({ nombre: 1 });

        return res.status(200).json({
            total: tipos.length,
            tipos: tipos
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// Create a new type (admin only, the route checks it)
async function crear(req, res) {

    try {

        const nombre = req.body.nombre;
        var tipoFecha = req.body.tipoFecha;

        if (nombre === undefined || nombre.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        // If it did not come, we use the schema default
        if (tipoFecha === undefined || tipoFecha === '') {
            tipoFecha = 'vencimiento';
        }

        // Validate here, so a wrong value gives a clear 400 and not a 500
        if (tipoFecha !== 'vencimiento' && tipoFecha !== 'plazo') {
            return res.status(400).json({ mensaje: 'tipoFecha debe ser vencimiento o plazo' });
        }

        const existente = await TipoTramite.findOne({ nombre: nombre.trim() });

        if (existente !== null) {
            return res.status(400).json({ mensaje: 'Ya existe un tipo de trámite con ese nombre' });
        }

        const tipoNuevo = await TipoTramite.create({
            nombre: nombre.trim(),
            tipoFecha: tipoFecha
        });

        return res.status(201).json({
            mensaje: 'Tipo de trámite creado correctamente',
            tipo: tipoNuevo
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

module.exports = {
    listar: listar,
    crear: crear
};