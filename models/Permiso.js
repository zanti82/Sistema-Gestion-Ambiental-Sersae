const mongoose = require('mongoose');

const permisoSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        numero: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },
        tipoPermiso: {
            type: String,
            enum: [
                'licencia_ambiental',
                'permiso_vertimiento',
                'permiso_emision',
                'concesion_agua',
                'permiso_aprovechamiento',
                'otro'
            ],
            default: 'otro'
        },
        fechaEmision: {
            type: Date,
            required: true
        },
        fechaVencimiento: {
            type: Date,
            required: true
        },
        estado: {
            type: String,
            enum: ['vigente', 'por_vencer', 'vencido', 'renovado'],
            default: 'vigente'
        },
        diasAlerta: {
            type: Number,
            default: 30
        },
        observaciones: {
            type: String,
            trim: true,
            default: null
        },
        proyecto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Proyecto',
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


// Antes de guardar calculamos si el permiso
// está vigente, por vencer o vencido lo hace con .pre mongodb

permisoSchema.pre('save', function(next) {

    const hoy = new Date();
    const vencimiento = new Date(this.fechaVencimiento);

    // Calculamos cuántos días faltan para el vencimiento
    const diferenciaMilisegundos = vencimiento - hoy;
    const diasRestantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
        // Ya venció
        this.estado = 'vencido';
    } else if (diasRestantes <= this.diasAlerta) {
        // Está dentro del período de alerta
        this.estado = 'por_vencer';
    } else {
        // Está vigente
        this.estado = 'vigente';
    }

    next();
});

const Permiso = mongoose.model('Permiso', permisoSchema);

module.exports = Permiso;