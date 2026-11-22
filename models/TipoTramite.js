const mongoose = require('mongoose');

const tipoTramiteSchema = new mongoose.Schema(
    {
        // Name shown in the app, for example "Concesión de aguas"
        nombre: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        // How to read the date of this trámite:
        // 'vencimiento' = a permit that expires, 'plazo' = a deadline (requerimiento, RUA)
        tipoFecha: {
            type: String,
            enum: ['vencimiento', 'plazo'],
            default: 'vencimiento'
        },
        // Soft delete flag: false hides the type, but old records keep working
        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const TipoTramite = mongoose.model('TipoTramite', tipoTramiteSchema);

module.exports = TipoTramite;