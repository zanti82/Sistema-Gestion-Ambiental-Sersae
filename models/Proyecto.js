const mongoose = require('mongoose');

const proyectoSchema = new mongoose.Schema(
    {
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
        codigo: {
            type: String,
            unique: true,
            trim: true, 
        },
        tipoProyecto: {
            type: String,
            enum: ['estudio_impacto', 'plan_manejo', 'auditoria', 'monitoreo', 'otro'],
            default: 'otro'
        },
        estado: {
            type: String,
            enum: ['activo', 'suspendido', 'finalizado'],
            default: 'activo'
        },
        fechaInicio: {
            type: Date,
            required: true
        },
        fechaFin: {
            type: Date,
            default: null
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

// funcion para cambiar el nuemero de cada proyecto

proyectoSchema.pre('save', async function(next) {

    // Si el proyecto ya tiene código no hacemos nada
    if (this.codigo) {
        return next();
    }

    // Contamos todos los proyectos que existen
    const cantidad = await mongoose.model('Proyecto').countDocuments();

    // Generamos el número siguiente con ceros adelante
    const numero = String(cantidad + 1).padStart(4, '0');

    // Armamos el código final
    this.codigo = 'PROY-' + numero;

    next();
});

const Proyecto = mongoose.model('Proyecto', proyectoSchema);

module.exports = Proyecto;