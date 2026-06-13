const mongoose = require('mongoose');

// fucion para definir el esquema requeriod por moongose
const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            default: null
        },
        rol: {
            type: String,
            enum: ['admin', 'asistente'],
            default: 'asistente'
        },
        githubId: {
            type: String,
            default: null
        },
        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

//creacion del modelo User que usa la funcion mongoose.model para crear el entidad

const User = mongoose.model('User', userSchema);

module.exports = User;