const Servicio = require('../models/Servicio');
const Sede = require('../models/Sede');
const TipoTramite = require('../models/TipoTramite');

// =====================
// CREAR SERVICIO
// =====================
async function crear(req, res) {

    try {

        const tipo = req.body.tipo;
        const nombre = req.body.nombre;
        const descripcion = req.body.descripcion;
        const linkPropuesta = req.body.linkPropuesta;
        const precio = req.body.precio;
        const descuento = req.body.descuento;
        const acuerdoPago = req.body.acuerdoPago;
        const estadoPropuesta = req.body.estadoPropuesta;
        const estadoEjecucion = req.body.estadoEjecucion;
        const motivoRechazo = req.body.motivoRechazo;
        const sedeId = req.body.sedeId;
        const tipoTramiteId = req.body.tipoTramiteId;

        if (tipo === undefined || tipo === '') {
            return res.status(400).json({ mensaje: 'El tipo de servicio es obligatorio' });
        }

        if (nombre === undefined || nombre === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        if (sedeId === undefined || sedeId === '') {
            return res.status(400).json({ mensaje: 'La sede es obligatoria' });
        }

        // The sede must exist and must not be deleted
        const sedeExistente = await Sede.findById(sedeId);

        if (sedeExistente === null) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        if (sedeExistente.activo === false) {
            return res.status(404).json({ mensaje: 'Sede no encontrada' });
        }

        // The tipoTramite is saved only for trámites
        var tipoTramiteFinal = null;

        if (tipo === 'tramite') {

            if (tipoTramiteId === undefined || tipoTramiteId === '') {
                return res.status(400).json({ mensaje: 'El tipo de trámite es obligatorio' });
            }

            const tipoTramiteExistente = await TipoTramite.findById(tipoTramiteId);

            if (tipoTramiteExistente === null) {
                return res.status(404).json({ mensaje: 'Tipo de trámite no encontrado' });
            }

            if (tipoTramiteExistente.activo === false) {
                return res.status(404).json({ mensaje: 'Tipo de trámite no encontrado' });
            }

            tipoTramiteFinal = tipoTramiteId;
        }

        // The motivo is saved only if the proposal is rejected
        var motivoFinal = null;

        if (estadoPropuesta === 'rechazada') {
            motivoFinal = motivoRechazo;
        }

        // If price or discount did not come, we use 0 (same as the schema defaults)
        var precioFinal = 0;
        if (precio !== undefined) {
            precioFinal = Number(precio);
        }

        var descuentoFinal = 0;
        if (descuento !== undefined) {
            descuentoFinal = Number(descuento);
        }

        if (descuentoFinal > precioFinal) {
            return res.status(400).json({ mensaje: 'El descuento no puede ser mayor que el precio' });
        }

        const servicioNuevo = new Servicio({
            tipo: tipo,
            nombre: nombre,
            descripcion: descripcion,
            linkPropuesta: linkPropuesta,
            precio: precioFinal,
            descuento: descuentoFinal,
            acuerdoPago: acuerdoPago,
            estadoPropuesta: estadoPropuesta,
            estadoEjecucion: estadoEjecucion,
            motivoRechazo: motivoFinal,
            sede: sedeId,
            tipoTramite: tipoTramiteFinal,
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

        // En listar: solo traemos los servicios que no fueron eliminados
        const filtro = { activo: true };

       
        if (req.query.sedeId !== undefined) {
        filtro.sede = req.query.sedeId;
        }

        if (req.query.tipo !== undefined) {
            filtro.tipo = req.query.tipo;
        }

        if (req.query.estadoPropuesta !== undefined) {
            filtro.estadoPropuesta = req.query.estadoPropuesta;
        }

        if (req.query.estadoEjecucion !== undefined) {
            filtro.estadoEjecucion = req.query.estadoEjecucion;
        }

        const servicios = await Servicio.find(filtro)
            .populate({
                path: 'sede',
                select: 'nombre codigo cliente',
                populate: { path: 'cliente', select: 'razonSocial nit' }
            })
            .populate('tipoTramite', 'nombre tipoFecha')
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
            .populate({
                path: 'sede',
                select: 'nombre codigo cliente',
                populate: { path: 'cliente', select: 'razonSocial nit email telefono' }
            })
            .populate('tipoTramite', 'nombre tipoFecha')
            .populate('creadoPor', 'nombre email');

        if (servicio === null) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado' });
        }

        if (servicio.activo === false) {
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

        if (req.body.linkPropuesta !== undefined) {
            servicio.linkPropuesta = req.body.linkPropuesta;
        }

        if (req.body.precio !== undefined) {
            servicio.precio = req.body.precio;
        }

        if (req.body.descuento !== undefined) {
            servicio.descuento = req.body.descuento;
        }

        if (req.body.acuerdoPago !== undefined) {
            servicio.acuerdoPago = req.body.acuerdoPago;
        }

        if (req.body.estadoPropuesta !== undefined) {
            servicio.estadoPropuesta = req.body.estadoPropuesta;

            // Si cambia a rechazada guardamos el motivo
            // Si cambia a otro estado limpiamos el motivo
            if (req.body.estadoPropuesta === 'rechazada') {
                servicio.motivoRechazo = req.body.motivoRechazo;
            } else {
                servicio.motivoRechazo = null;
            }
        }

        if (req.body.estadoEjecucion !== undefined) {
            servicio.estadoEjecucion = req.body.estadoEjecucion;
        }
        // Al llegar acá, precio y descuento ya tienen los valores nuevos (o los anteriores si no vinieron)
        if (servicio.descuento > servicio.precio) {
            return res.status(400).json({ mensaje: 'El descuento no puede ser mayor que el precio' });
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

        // En eliminar: reemplazá la línea servicio.estadoEjecucion = 'ejecutado' por esta
        servicio.activo = false;
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