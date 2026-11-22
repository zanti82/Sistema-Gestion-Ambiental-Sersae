const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: [
                'diagnostico',
                'tramite',
                'sostenibilidad',
                'accion_climatica'
            ],
            required: true
        },
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        descripcion: {
            type: String,
            trim: true,
            default: null
        },
        linkPropuesta: {
            type: String,
            trim: true,
            default: null
        },
        precio: {
            type: Number,
            default: 0
        },
        descuento: {
            type: Number,
            default: 0
        },
        acuerdoPago: {
            type: String,
            trim: true,
            default: null
        },
        estadoPropuesta: {
            type: String,
            enum: ['pendiente', 'aprobada', 'rechazada'],
            default: 'pendiente'
        },
        motivoRechazo: {
            type: String,
            trim: true,
            default: null
        },
        estadoEjecucion: {
            type: String,
            enum: ['sin_iniciar', 'en_curso', 'ejecutado', 'pausado'],
            default: 'sin_iniciar'
        },
        
        sede: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sede',
            required: true
        },
        // Only for services of tipo 'tramite'. Points to the catalog
        tipoTramite: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TipoTramite',
            default: null,
            // "required" can be a function. Mongoose runs it when it validates.
            // "this" is the service being saved
            required: function() {
                return this.tipo === 'tramite';
            }
        },
        creadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Bandera técnica de borrado lógico: false significa "eliminado", sin tocar los estados del negocio
        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Servicio = mongoose.model('Servicio', servicioSchema);

module.exports = Servicio;