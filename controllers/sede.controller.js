const Sede = require('../models/Sede');
const Cliente = require('../models/Cliente');
const Servicio = require('../models/Servicio');

// =====================
// CREATE
// =====================
async function crear(req, res) {

    try {

        const nombre = req.body.nombre;
        const categoria = req.body.categoria;
        const departamento = req.body.departamento;
        const municipio = req.body.municipio;
        const vereda = req.body.vereda;
        const autoridadAmbiental = req.body.autoridadAmbiental;
        const clienteId = req.body.clienteId;

        // Coordinates arrive as three fields and we build the object
        const coordenadas = {
            x: req.body.coordX,
            y: req.body.coordY,
            z: req.body.coordZ
        };

        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre de la sede es obligatorio' });
        }

        if (clienteId === undefined || clienteId === '') {
            return res.status(400).json({ mensaje: 'El cliente es obligatorio' });
        }

        // The client must exist and must not be deleted
        const clienteExistente = await Cliente.findById(clienteId);

        if (clienteExistente === null) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        if (clienteExistente.activo === false) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        // The code SD-001 is created by the hook in the model
        const sedeNueva = new Sede({
            nombre: nombre,
            categoria: categoria,
            departamento: departamento,
            municipio: municipio,
            vereda: vereda,
            autoridadAmbiental: autoridadAmbiental,
            coordenadas: coordenadas,
            cliente: clienteId,
            creadoPor: req.usuario.userId
        });

        const sedeGuardada = await sedeNueva.save();

        return res.status(201).json({
            mensaje: 'Sede creada correctamente',
            sede: sedeGuardada
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// LIST
// =====================
async function listar(req, res) {

    try {

        // Only sedes that were not deleted
        const filtro = { activo: true };

        // Optional filter: GET /api/sedes?clienteId=xxx
        if (req.query.clienteId !== undefined) {
            filtro.cliente = req.query.clienteId;
        }

        const sedes = await Sede.find(filtro)
            .populate('cliente', 'razonSocial nit')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            total: sedes.length,
            sedes: sedes
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// GET ONE
// =====================
async function verUno(req, res) {

    try {

        const id = req.params.id;

        const sede = await Sede.findById(id)
            .populate('cliente', 'razonSocial nit email telefono');

        if (sede === null) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        if (sede.activo === false) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        return res.status(200).json({ sede: sede });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// EDIT
// =====================
async function editar(req, res) {

    try {

        const id = req.params.id;

        const sede = await Sede.findById(id);

        if (sede === null) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        if (sede.activo === false) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        // Each field changes only if it came in the body.
        // The client and the code are not editable
        if (req.body.nombre !== undefined) { sede.nombre = req.body.nombre; }
        if (req.body.categoria !== undefined) { sede.categoria = req.body.categoria; }
        if (req.body.departamento !== undefined) { sede.departamento = req.body.departamento; }
        if (req.body.municipio !== undefined) { sede.municipio = req.body.municipio; }
        if (req.body.vereda !== undefined) { sede.vereda = req.body.vereda; }
        if (req.body.autoridadAmbiental !== undefined) { sede.autoridadAmbiental = req.body.autoridadAmbiental; }
        if (req.body.coordX !== undefined) { sede.coordenadas.x = req.body.coordX; }
        if (req.body.coordY !== undefined) { sede.coordenadas.y = req.body.coordY; }
        if (req.body.coordZ !== undefined) { sede.coordenadas.z = req.body.coordZ; }

        const sedeActualizada = await sede.save();

        return res.status(200).json({
            mensaje: 'Sede actualizada correctamente',
            sede: sedeActualizada
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// DELETE (soft delete)
// =====================
async function eliminar(req, res) {

    try {

        const id = req.params.id;

        const sede = await Sede.findById(id);

        if (sede === null) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        if (sede.activo === false) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        // Count the active services of this sede
        const serviciosActivos = await Servicio.countDocuments({ sede: id, activo: true });

        // 409 Conflict: the request is valid, but the current data does not allow it
        if (serviciosActivos > 0) {
            return res.status(409).json({
                mensaje: 'No se puede eliminar: la sede tiene servicios activos'
            });
        }

        sede.activo = false;
        await sede.save();

        return res.status(200).json({ mensaje: 'Sede eliminada correctamente' });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

module.exports = {
    crear: crear,
    listar: listar,
    verUno: verUno,
    editar: editar,
    eliminar: eliminar
};