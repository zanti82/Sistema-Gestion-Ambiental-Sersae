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
        precio: {
            type: Number,
            default: 0
        },
        estado: {
            type: String,
            enum: ['cotizado', 'activo', 'finalizado', 'facturado'],
            default: 'cotizado'
        },
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cliente',
            required: true
        },
        creadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Servicio = mongoose.model('Servicio', servicioSchema);

module.exports = Servicio;