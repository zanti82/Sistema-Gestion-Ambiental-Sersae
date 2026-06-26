const Permiso = require('../models/Permiso');
const Proyecto = require('../models/Proyecto');

// =====================
// CREAR PERMISO
// =====================
// POST /api/permisos

async function crear(req, res) {

    try {

        const nombre = req.body.nombre;
        const numero = req.body.numero;
        const tipoPermiso = req.body.tipoPermiso;
        const fechaEmision = req.body.fechaEmision;
        const fechaVencimiento = req.body.fechaVencimiento;
        const diasAlerta = req.body.diasAlerta;
        const observaciones = req.body.observaciones;
        const proyectoId = req.body.proyectoId;

        // Validaciones obligatorias
        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        if (numero === undefined || numero === '') {
            return res.status(400).json({ mensaje: 'El número de permiso es obligatorio' });
        }

        if (fechaEmision === undefined || fechaEmision === '') {
            return res.status(400).json({ mensaje: 'La fecha de emisión es obligatoria' });
        }

        if (fechaVencimiento === undefined || fechaVencimiento === '') {
            return res.status(400).json({ mensaje: 'La fecha de vencimiento es obligatoria' });
        }

        if (proyectoId === undefined || proyectoId === '') {
            return res.status(400).json({ mensaje: 'El proyecto es obligatorio' });
        }

        // Verificamos que el proyecto exista
        const proyectoExistente = await Proyecto.findById(proyectoId);

        if (proyectoExistente === null) {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        }

        // Verificamos que el número de permiso no exista
        const permisoExistente = await Permiso.findOne({ numero: numero });

        if (permisoExistente !== null) {
            return res.status(400).json({ mensaje: 'Ya existe un permiso con ese número' });
        }

        // El estado se calcula automáticamente en el hook pre-save
        const permisoNuevo = new Permiso({
            nombre: nombre,
            numero: numero,
            tipoPermiso: tipoPermiso,
            fechaEmision: fechaEmision,
            fechaVencimiento: fechaVencimiento,
            diasAlerta: diasAlerta,
            observaciones: observaciones,
            proyecto: proyectoId,
            creadoPor: req.usuario.userId
        });

        const permisoGuardado = await permisoNuevo.save();

        return res.status(201).json({
            mensaje: 'Permiso creado correctamente',
            permiso: permisoGuardado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// LISTAR PERMISOS
// =====================
// GET /api/permisos

async function listar(req, res) {

    try {

        // Permite filtrar por proyecto
        // Ejemplo: GET /api/v1/permisos?proyectoId=674abc123
        const filtro = {};

        if (req.query.proyectoId !== undefined) {
            filtro.proyecto = req.query.proyectoId;
        }

        // Permite filtrar por estado
        // Ejemplo: GET /api/v1/permisos?estado=vencido
        if (req.query.estado !== undefined) {
            filtro.estado = req.query.estado;
        }

        const permisos = await Permiso.find(filtro)
            .populate('proyecto', 'nombre codigo')
            .populate('creadoPor', 'nombre email')
            .sort({ fechaVencimiento: 1 });

        return res.status(200).json({
            total: permisos.length,
            permisos: permisos
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// VER UN PERMISO
// =====================
// GET /api/permisos/:id

async function verUno(req, res) {

    try {

        const id = req.params.id;

        const permiso = await Permiso.findById(id)
            .populate('proyecto', 'nombre codigo cliente')
            .populate('creadoPor', 'nombre email');

        if (permiso === null) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado' });
        }

        return res.status(200).json({ permiso: permiso });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// EDITAR PERMISO
// =====================
// PUT /api/v1/permisos/:id

async function editar(req, res) {

    try {

        const id = req.params.id;

        const permiso = await Permiso.findById(id);

        if (permiso === null) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado' });
        }

        if (req.body.nombre !== undefined) {
            permiso.nombre = req.body.nombre;
        }

        if (req.body.tipoPermiso !== undefined) {
            permiso.tipoPermiso = req.body.tipoPermiso;
        }

        if (req.body.fechaVencimiento !== undefined) {
            permiso.fechaVencimiento = req.body.fechaVencimiento;
        }

        if (req.body.diasAlerta !== undefined) {
            permiso.diasAlerta = req.body.diasAlerta;
        }

        if (req.body.observaciones !== undefined) {
            permiso.observaciones = req.body.observaciones;
        }

        if (req.body.estado !== undefined) {
            permiso.estado = req.body.estado;
        }

        // Al guardar el hook pre-save recalcula el estado
        // automáticamente según la nueva fechaVencimiento
        const permisoActualizado = await permiso.save();

        return res.status(200).json({
            mensaje: 'Permiso actualizado correctamente',
            permiso: permisoActualizado
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// ELIMINAR PERMISO
// =====================
// DELETE /api/permisos/:id

async function eliminar(req, res) {

    try {

        const id = req.params.id;

        const permiso = await Permiso.findById(id);

        if (permiso === null) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado' });
        }

        await Permiso.findByIdAndDelete(id);

        return res.status(200).json({
            mensaje: 'Permiso eliminado correctamente'
        });

    } catch(error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
}

// =====================
// ALERTAS DE VENCIMIENTO
// =====================
// GET /api/permisos/vencimientos

async function vencimientos(req, res) {

    try {

        // Traemos todos los permisos que están por vencer o ya vencidos
        const permisos = await Permiso.find({
            estado: { $in: ['por_vencer', 'vencido'] }
        })
            .populate({
                path: 'proyecto',
                select: 'nombre codigo',
                populate: {
                    path: 'cliente',
                    select: 'razonSocial nit email'
                }
            })
            .populate('creadoPor', 'nombre email')
            .sort({ fechaVencimiento: 1 });

        // Separamos los vencidos de los por vencer
        const vencidos = [];
        const porVencer = [];

        permisos.forEach(function(permiso) {
            if (permiso.estado === 'vencido') {
                vencidos.push(permiso);
            } else {
                porVencer.push(permiso);
            }
        });

        return res.status(200).json({
            resumen: {
                totalAlertas: permisos.length,
                vencidos: vencidos.length,
                porVencer: porVencer.length
            },
            vencidos: vencidos,
            porVencer: porVencer
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
    eliminar: eliminar,
    vencimientos: vencimientos
};