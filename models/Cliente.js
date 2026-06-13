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
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        telefono: {
            type: String,
            trim: true,
            default: null
        },
        direccion: {
            type: String,
            trim: true,
            default: null
        },
        sector: {
            type: String,
            enum: ['mineria', 'agricultura', 'industria', 'construccion', 'energia', 'otro'],
            default: 'otro'
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