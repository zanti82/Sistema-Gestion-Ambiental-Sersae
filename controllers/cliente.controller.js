const Cliente = require('../models/Cliente');

// =====================
// CREAR CLIENTE
// =====================
// POST /api/clientes

async function crear(req, res) {

    try {

        const razonSocial = req.body.razonSocial;
        const nit = req.body.nit;
        const email = req.body.email;
        const telefono = req.body.telefono;
        const direccion = req.body.direccion;
        const sector = req.body.sector;

        // Validaciones obligatorias
        if (razonSocial === undefined || razonSocial === '') {
            return res.status(400).json({ mensaje: 'La razón social es obligatoria' });
        }

        if (nit === undefined || nit === '') {
            return res.status(400).json({ mensaje: 'El nit es obligatorio' });
        }

        if (email === undefined || email === '') {
            return res.status(400).json({ mensaje: 'El email es obligatorio' });
        }

        // Verificamos que el nit no exista
        const clienteExistente = await Cliente.findOne({ nit : nit });

        if (clienteExistente !== null) {
            return res.status(400).json({ mensaje: 'Ya existe un cliente con ese NIT' });
        }

        // req.usuario lo pone el middleware verificarToken
        const clienteNuevo = new Cliente({
            razonSocial: razonSocial,
            nit: nit,
            email: email,
            telefono: telefono,
            direccion: direccion,
            sector: sector,
            creadoPor: req.usuario.userId
        });

        const clienteGuardado = await clienteNuevo.save();

        return res.status(201).json({
            mensaje: 'Cliente creado correctamente',
            cliente: clienteGuardado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// LISTAR CLIENTES
// =====================
// GET /api/clientes

async function listar(req, res) {

    try {

        // Solo traemos los clientes activos
        // populate trae los datos del usuario que lo creó
        const clientes = await Cliente.find({ activo: true })
            .populate('creadoPor', 'nombre email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            total: clientes.length,
            clientes: clientes
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// VER UN CLIENTE
// =====================
// GET /api/v1/clientes/:id

async function verUno(req, res) {

    try {

        const id = req.params.id;

        const cliente = await Cliente.findById(id)
            .populate('creadoPor', 'nombre email');

        if (cliente === null) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        if (cliente.activo === false) {
            return res.status(404).json({ mensaje: 'Cliente inactivo' });
        }

        return res.status(200).json({ cliente: cliente });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// EDITAR CLIENTE
// =====================
// PUT /api/v1/clientes/:id

async function editar(req, res) {

    try {

        const id = req.params.id;

        const cliente = await Cliente.findById(id);

        if (cliente === null) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        if (cliente.activo === false) {
            return res.status(404).json({ mensaje: 'Cliente incativo' });
        }

        // Solo actualizamos los campos que vienen en el body
        // Si no vienen, dejamos el valor actual
        if (req.body.razonSocial !== undefined) {
            cliente.razonSocial = req.body.razonSocial;
        }

        if (req.body.email !== undefined) {
            cliente.email = req.body.email;
        }

        if (req.body.telefono !== undefined) {
            cliente.telefono = req.body.telefono;
        }

        if (req.body.direccion !== undefined) {
            cliente.direccion = req.body.direccion;
        }

        if (req.body.sector !== undefined) {
            cliente.sector = req.body.sector;
        }

        const clienteActualizado = await cliente.save();

        return res.status(200).json({
            mensaje: 'Cliente actualizado correctamente',
            cliente: clienteActualizado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// ELIMINAR CLIENTE (soft delete)
// =====================
// DELETE /api/v1/clientes/:id

async function eliminar(req, res) {

    try {

        const id = req.params.id;

        const cliente = await Cliente.findById(id);

        if (cliente === null) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        if (cliente.activo === false) {
            return res.status(404).json({ mensaje: 'Cliente incativo' });
        }

        // Soft delete — no borramos, desactivamos
        cliente.activo = false;
        await cliente.save();

        return res.status(200).json({
            mensaje: 'Cliente inactivado correctamente'
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