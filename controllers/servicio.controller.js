const Servicio = require('../models/Servicio');
const Cliente = require('../models/Cliente');

// =====================
// CREAR SERVICIO
// =====================
async function crear(req, res) {

    try {

        const tipo = req.body.tipo;
        const nombre = req.body.nombre;
        const descripcion = req.body.descripcion;
        const precio = req.body.precio;
        const clienteId = req.body.clienteId;

        if (tipo === undefined || tipo === '') {
            return res.status(400).json({ mensaje: 'El tipo de servicio es obligatorio' });
        }

        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        if (clienteId === undefined || clienteId === '') {
            return res.status(400).json({ mensaje: 'El cliente es obligatorio' });
        }

        const clienteExistente = await Cliente.findById(clienteId);

        if (clienteExistente === null) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        if (clienteExistente.activo === false) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        const servicioNuevo = new Servicio({
            tipo: tipo,
            nombre: nombre,
            descripcion: descripcion,
            precio: precio,
            cliente: clienteId,
            creadoPor: req.usuario.userId
        });

        const servicioGuardado = await servicioNuevo.save();

        return res.status(201).json({
            mensaje: 'Servicio creado correctamente',
            servicio: servicioGuardado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// LISTAR SERVICIOS
// =====================
async function listar(req, res) {

    try {

        const filtro = {};

        // Filtrar por cliente
        if (req.query.clienteId !== undefined) {
            filtro.cliente = req.query.clienteId;
        }

        // Filtrar por tipo
        if (req.query.tipo !== undefined) {
            filtro.tipo = req.query.tipo;
        }

        // Filtrar por estado
        if (req.query.estado !== undefined) {
            filtro.estado = req.query.estado;
        }

        const servicios = await Servicio.find(filtro)
            .populate('cliente', 'razonSocial nit')
            .populate('creadoPor', 'nombre email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            total: servicios.length,
            servicios: servicios
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// VER UN SERVICIO
// =====================
async function verUno(req, res) {

    try {

        const id = req.params.id;

        const servicio = await Servicio.findById(id)
            .populate('cliente', 'razonSocial nit email')
            .populate('creadoPor', 'nombre email');

        if (servicio === null) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

        return res.status(200).json({ servicio: servicio });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// EDITAR SERVICIO
// =====================
async function editar(req, res) {

    try {

        const id = req.params.id;

        const servicio = await Servicio.findById(id);

        if (servicio === null) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

        if (req.body.nombre !== undefined) {
            servicio.nombre = req.body.nombre;
        }

        if (req.body.descripcion !== undefined) {
            servicio.descripcion = req.body.descripcion;
        }

        if (req.body.precio !== undefined) {
            servicio.precio = req.body.precio;
        }

        if (req.body.estado !== undefined) {
            servicio.estado = req.body.estado;
        }

        const servicioActualizado = await servicio.save();

        return res.status(200).json({
            mensaje: 'Servicio actualizado correctamente',
            servicio: servicioActualizado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// ELIMINAR SERVICIO (soft delete)
// =====================
async function eliminar(req, res) {

    try {

        const id = req.params.id;

        const servicio = await Servicio.findById(id);

        if (servicio === null) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

        servicio.estado = 'finalizado';
        await servicio.save();

        return res.status(200).json({
            mensaje: 'Servicio eliminado correctamente'
        });

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