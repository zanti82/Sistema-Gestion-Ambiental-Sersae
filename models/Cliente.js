const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema(
    {
        razonSocial: {
            type: String,
            required: true,
            trim: true
        },
        nit: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        nombreCompleto: {
            type: String,
            trim: true,
            default: null
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        email2: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        telefono: {
            type: String,
            trim: true,
            default: null
        },
        telefono2: {
            type: String,
            trim: true,
            default: null
        },
        
        estatus: {
            type: String,
            enum: ['potencial', 'consolidado', 'inactivo'],
            default: 'potencial'
        },
        activo: {
            type: Boolean,
            default: true
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

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;