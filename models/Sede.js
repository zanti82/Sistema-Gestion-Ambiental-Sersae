const mongoose = require('mongoose');

const sedeSchema = new mongoose.Schema(
    {
        // Name of the place, for example "Los Alpes"
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        // Automatic code, created by the hook below
        codigo: {
            type: String,
            unique: true,
            trim: true
        },
        categoria: {
            type: String,
            enum: ['porcicultor', 'avicultor', 'agricultor', 'ganadero', 'industria', 'otro'],
            default: 'otro'
        },
        departamento: { type: String, trim: true, default: null },
        municipio: { type: String, trim: true, default: null },
        vereda: { type: String, trim: true, default: null },
        autoridadAmbiental: { type: String, trim: true, default: null },
        coordenadas: {
            x: { type: String, default: null },
            y: { type: String, default: null },
            z: { type: String, default: null }
        },
        // The client who owns this sede
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cliente',
            required: true
        },
        // Soft delete flag, same idea as Cliente and Servicio
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

// Runs before each save. Creates a code like SD-001 if the sede has none
sedeSchema.pre('save', async function() {

    // If the code already exists, do nothing
    if (this.codigo) {
        return;
    }

    // Count all sedes (deleted ones stay in the database, so the count never goes down)
    const cantidad = await mongoose.model('Sede').countDocuments();

    // Next number with leading zeros: 1 becomes "001"
    const numero = String(cantidad + 1).padStart(3, '0');

    this.codigo = 'SD-' + numero;
});

const Sede = mongoose.model('Sede', sedeSchema);

module.exports = Sede;