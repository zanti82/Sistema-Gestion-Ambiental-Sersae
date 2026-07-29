const Proyecto = require('../models/Proyecto');
const Cliente = require('../models/Cliente');

// =====================
// CREAR PROYECTO
// =====================
// POST /api/proyectos

async function crear(req, res) {

    try {

        const nombre = req.body.nombre;
        const descripcion = req.body.descripcion;
        const tipoProyecto = req.body.tipoProyecto;
        const fechaInicio = req.body.fechaInicio;
        const fechaFin = req.body.fechaFin;
        const servicioId = req.body.servicioId;

        // Validaciones obligatorias
        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        if (fechaInicio === undefined || fechaInicio === '') {
            return res.status(400).json({ mensaje: 'La fecha de inicio es obligatoria' });
        }

        if (servicioId === undefined || servicioId === '') {
            return res.status(400).json({ mensaje: 'El servicio es obligatorio' });
        }

        // Verificamos que el servicio exista
        const servicioExistente = await Servicio.findById(servicioId);

        if (servicioExistente === null) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

         // Verificamos que el servicio sea de tipo tramite
         if (servicioExistente.tipo !== 'tramite') {
            return res.status(400).json({ mensaje: 'Solo los servicios de tipo trámite pueden tener proyectos' });
        }

        // El código se genera automáticamente con el hook pre-save
        const proyectoNuevo = new Proyecto({
            nombre: nombre,
            descripcion: descripcion,
            tipoProyecto: tipoProyecto,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            servicio: servicioId,
            creadoPor: req.usuario.userId
        });

        const proyectoGuardado = await proyectoNuevo.save();

        return res.status(201).json({
            mensaje: 'Proyecto creado correctamente',
            proyecto: proyectoGuardado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// LISTAR PROYECTOS
// =====================
// GET /api/proyectos

async function listar(req, res) {

    try {

        // Permite filtrar por cliente si viene en la query
        // Ejemplo: GET /api/v1/proyectos?clienteId=674abc123
        const filtro = { estado: 'activo' };

        if (req.query.clienteId !== undefined) {
            filtro.cliente = req.query.clienteId;
        }

        const proyectos = await Proyecto.find(filtro)
            .populate('cliente', 'razonSocial nit')
            .populate('creadoPor', 'nombre email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            total: proyectos.length,
            proyectos: proyectos
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// VER UN PROYECTO
// =====================
// GET /api/proyectos/:id

async function verUno(req, res) {

    try {

        const id = req.params.id;

        const proyecto = await Proyecto.findById(id)
            .populate('cliente', 'razonSocial nit email')
            .populate('creadoPor', 'nombre email');

        if (proyecto === null) {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        }

        if (proyecto.estado === 'finalizado') {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        }

        return res.status(200).json({ proyecto: proyecto });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// EDITAR PROYECTO
// =====================
// PUT /api/v1/proyectos/:id

async function editar(req, res) {

    try {

        const id = req.params.id;

        const proyecto = await Proyecto.findById(id);

        if (proyecto === null) {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        }

        if (req.body.nombre !== undefined) {
            proyecto.nombre = req.body.nombre;
        }

        if (req.body.descripcion !== undefined) {
            proyecto.descripcion = req.body.descripcion;
        }

        if (req.body.tipoProyecto !== undefined) {
            proyecto.tipoProyecto = req.body.tipoProyecto;
        }

        if (req.body.estado !== undefined) {
            proyecto.estado = req.body.estado;
        }

        if (req.body.fechaInicio !== undefined) {
            proyecto.fechaInicio = req.body.fechaInicio;
        }

        if (req.body.fechaFin !== undefined) {
            proyecto.fechaFin = req.body.fechaFin;
        }

        const proyectoActualizado = await proyecto.save();

        return res.status(200).json({
            mensaje: 'Proyecto actualizado correctamente',
            proyecto: proyectoActualizado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// ELIMINAR PROYECTO (soft delete)
// =====================
// DELETE /api/v1/proyectos/:id

async function eliminar(req, res) {

    try {

        const id = req.params.id;

        const proyecto = await Proyecto.findById(id);

        if (proyecto === null) {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        }

        // Soft delete → cambiamos estado a finalizado
        proyecto.estado = 'finalizado';
        await proyecto.save();

        return res.status(200).json({
            mensaje: 'Proyecto eliminado correctamente'
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