const Permiso = require('../models/Permiso');
const Servicio = require('../models/Servicio');

// permiso -> servicio -> (tipoTramite) and (sede -> cliente)
// A function returns a fresh object each time, so queries never share it
function armarPopulateServicio() {
    return {
        path: 'servicio',
        select: 'nombre sede tipoTramite',
        populate: [
            { path: 'tipoTramite', select: 'nombre tipoFecha' },
            {
                path: 'sede',
                select: 'nombre codigo cliente',
                populate: { path: 'cliente', select: 'razonSocial nit email' }
            }
        ]
    };
}

// =====================
// CREAR PERMISO
// =====================
// POST /api/permisos

async function crear(req, res) {

    try {

        const nombre = req.body.nombre;
        const numero = req.body.numero;
        const fechaEmision = req.body.fechaEmision;
        const fechaVencimiento = req.body.fechaVencimiento;
        const diasAlerta = req.body.diasAlerta;
        const observaciones = req.body.observaciones;
        const servicioId = req.body.servicioId;

        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        if (fechaVencimiento === undefined || fechaVencimiento === '') {
            return res.status(400).json({ mensaje: 'La fecha de vencimiento o plazo es obligatoria' });
        }

        if (servicioId === undefined || servicioId === '') {
            return res.status(400).json({ mensaje: 'El servicio es obligatorio' });
        }

        // Load the service together with its trámite type
        const servicio = await Servicio.findById(servicioId).populate('tipoTramite');

        if (servicio === null) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

        if (servicio.activo === false) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

        // Only trámites have permits and deadlines
        if (servicio.tipo !== 'tramite') {
            return res.status(400).json({ mensaje: 'Solo los servicios de tipo trámite tienen permisos o plazos' });
        }

        if (servicio.tipoTramite === null) {
            return res.status(400).json({ mensaje: 'El servicio no tiene tipo de trámite' });
        }

        // The catalog tells us what kind of record this is
        const tipoFecha = servicio.tipoTramite.tipoFecha;

        var numeroFinal = null;
        var fechaEmisionFinal = null;

        if (tipoFecha === 'vencimiento') {

            // A permit needs a number and an emission date
            if (numero === undefined || numero === '') {
                return res.status(400).json({ mensaje: 'El número del permiso es obligatorio' });
            }

            if (fechaEmision === undefined || fechaEmision === '') {
                return res.status(400).json({ mensaje: 'La fecha de emisión es obligatoria' });
            }

            if (new Date(fechaVencimiento) < new Date(fechaEmision)) {
                return res.status(400).json({ mensaje: 'El vencimiento no puede ser anterior a la emisión' });
            }

            // The schema saves the number in uppercase, so we search in uppercase
            numeroFinal = String(numero).trim().toUpperCase();

            const permisoExistente = await Permiso.findOne({ numero: numeroFinal });

            if (permisoExistente !== null) {
                return res.status(400).json({ mensaje: 'Ya existe un permiso con ese número' });
            }

            fechaEmisionFinal = fechaEmision;
        }

        // If the days did not come, we use 30 (the schema default)
        var diasAlertaFinal = 30;
        if (diasAlerta !== undefined && diasAlerta !== '') {
            diasAlertaFinal = Number(diasAlerta);
        }

        const permisoNuevo = new Permiso({
            nombre: nombre,
            numero: numeroFinal,
            fechaEmision: fechaEmisionFinal,
            fechaVencimiento: fechaVencimiento,
            diasAlerta: diasAlertaFinal,
            observaciones: observaciones,
            servicio: servicioId,
            creadoPor: req.usuario.userId
        });

        const permisoGuardado = await permisoNuevo.save();

        return res.status(201).json({
            mensaje: 'Registro creado correctamente',
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

        if (req.query.servicioId !== undefined) {
            filtro.servicio = req.query.servicioId;
        }
        
   
        const permisos = await Permiso.find(filtro)
        .populate(armarPopulateServicio())
        .sort({ fechaVencimiento: 1 });

        // The "estado" filter uses the calculated state
        var resultado = permisos;

        if (req.query.estado !== undefined) {
            resultado = permisos.filter(function(permiso) {
                return permiso.estadoActual === req.query.estado;
            });
        }

        return res.status(200).json({
            total: resultado.length,
            permisos: resultado
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
        .populate(armarPopulateServicio())
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
            return res.status(404).json({ mensaje: 'Registro no encontrado' });
        }

        if (req.body.nombre !== undefined) { permiso.nombre = req.body.nombre; }
        if (req.body.observaciones !== undefined) { permiso.observaciones = req.body.observaciones; }
        if (req.body.fechaEmision !== undefined) { permiso.fechaEmision = req.body.fechaEmision; }
        if (req.body.fechaVencimiento !== undefined) { permiso.fechaVencimiento = req.body.fechaVencimiento; }

        if (req.body.diasAlerta !== undefined) {
            permiso.diasAlerta = Number(req.body.diasAlerta);
        }

        // The number can change, but it must stay unique (ignore this same document)
        if (req.body.numero !== undefined && req.body.numero !== '') {

            const numeroNuevo = String(req.body.numero).trim().toUpperCase();

            const duplicado = await Permiso.findOne({ numero: numeroNuevo, _id: { $ne: id } });

            if (duplicado !== null) {
                return res.status(400).json({ mensaje: 'Ya existe un permiso con ese número' });
            }

            permiso.numero = numeroNuevo;
        }

        // The state is calculated by the hook. The only manual value is 'renovado'
        if (req.body.estado === 'renovado') {
            permiso.estado = 'renovado';
        }

        const permisoActualizado = await permiso.save();

        return res.status(200).json({
            mensaje: 'Registro actualizado correctamente',
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

        // We do NOT filter by the saved state, because it can be old
        const permisos = await Permiso.find({ estado: { $ne: 'renovado' } })
            .populate(armarPopulateServicio())
            .populate('creadoPor', 'nombre email')
            .sort({ fechaVencimiento: 1 });

        const vencidos = [];
        const porVencer = [];

        permisos.forEach(function(permiso) {

            // Calculated from the date, at this moment
            const estadoActual = permiso.estadoActual;

            if (estadoActual === 'vencido') {
                vencidos.push(permiso);
            }

            if (estadoActual === 'por_vencer') {
                porVencer.push(permiso);
            }
        });

        return res.status(200).json({
            resumen: {
                totalAlertas: vencidos.length + porVencer.length,
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