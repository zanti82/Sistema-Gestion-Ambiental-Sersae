const mongoose = require('mongoose');

const permisoSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        // Official number. Required only for permits (the controller checks it)
        numero: {
            type: String,
            trim: true,
            uppercase: true,
            default: null
        },
        // Only for permits. A requerimiento or RUA has no emission date
        fechaEmision: {
            type: Date,
            default: null
        },
        // Permit expiry date, or the deadline of a requerimiento / RUA
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
        // The service this permit belongs to (replaces "proyecto")
        servicio: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Servicio',
            required: true
        },
        creadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true }
    }
);

// One place for the rule. Used by the hook and by the virtual field
function calcularEstado(fechaVencimiento, diasAlerta) {

    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferenciaMilisegundos = vencimiento - hoy;
    const diasRestantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
        return 'vencido';
    }

    if (diasRestantes <= diasAlerta) {
        return 'por_vencer';
    }

    return 'vigente';
}

// Runs before each save and calculates the state
permisoSchema.pre('save', function() {

    // A renewed permit keeps its state. We do not recalculate it
    if (this.estado === 'renovado') {
        return;
    }

    this.estado = calcularEstado(this.fechaVencimiento, this.diasAlerta);
});

// Calculated every time it is read. It is NOT saved in the database
permisoSchema.virtual('estadoActual').get(function() {

    if (this.estado === 'renovado') {
        return 'renovado';
    }

    return calcularEstado(this.fechaVencimiento, this.diasAlerta);
});

const Permiso = mongoose.model('Permiso', permisoSchema);

module.exports = Permiso;