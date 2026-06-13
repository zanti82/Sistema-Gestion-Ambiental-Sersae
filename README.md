# Sistema-Gestion-Ambiental-Sersae
Sistema para la gestion ambiental de proyectos, modelo de negocio con autorizaciones local.strategy.js github.strategy.js

Un sistema donde Asistentes cargan clientes con sus proyectos ambientales, cada proyecto tiene permisos con fecha de vencimiento, y el sistema avisa automáticamente cuando un permiso está por vencer.
La idea del desarrollo es mostrar coomo funciona una sistema de gestion usando las autorizaciones aprendidads en el curos back2 de coderhouse.

# Roles

Rol         Puede hacer
admin       Todo: usuarios, clientes, proyectos, permisos
asistente    Crear/editar clientes, proyectos y permisos

# Modelos de base de datos No relacionales con MongoDB

User         → quien usa el sistema (admin / asistente)
Cliente      → empresa o persona con proyectos ambientales
Proyecto     → proyecto ambiental de un cliente
Permiso      → permiso con fecha de vencimiento ligado a un proyecto

User  ──────► (crea/gestiona)
Cliente  1 ───► N  Proyecto
Proyecto 1 ───► N  Permiso  ← tiene fechaVencimiento

# Arquitectura del proyecto

sersaeApi/
│
├── config/
│   └── database.js
│
├── models/
│   ├── User.js
│   ├── Cliente.js
│   ├── Proyecto.js
│   └── Permiso.js
│
├── strategies/
│   ├── local.strategy.js
│   └── github.strategy.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── cliente.controller.js
│   ├── proyecto.controller.js
│   └── permiso.controller.js
│
├── middlewares/
│   ├── auth.middleware.js
│   └── role.middleware.js
│
├── routes/
│   ├── auth.routes.js
│   ├── cliente.routes.js
│   ├── proyecto.routes.js
│   └── permiso.routes.js
│
├── public/
│   ├── index.html        → login
│   ├── dashboard.html    → panel principal
│   ├── clientes.html     → lista de clientes
│   └── css/
│       └── style.css
│
├── .env.example
├── .env
└── app.js

# endpoints 

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/logout
GET    /api/session

GET    /api/profile          ← JWT protegida
GET    /api/admin            ← solo admin

GET    /api/clientes
POST   /api/clientes
GET    /api/clientes/:id

GET    /api/proyectos
POST   /api/proyectos
GET    /api/proyectos/:id

GET    /api/permisos
POST   /api/permisos
GET    /api/permisos/vencimientos   ← alertas de vencimiento

# codigo

npm init -y ---> para instalar el package.json

npm install express mongoose dotenv bcryptjs jsonwebtoken passport passport-local passport-github2 express-session connect-mongo cookie-parser  ---> inatalamos todas la librerias del proyecto

npm install --save-dev nodemon

express             ---El servidor web. Como Spring MVC.
mongoose            ---Habla con MongoDB. Como JPA/Hibernate.
dotenv              ---Lee el archivo .env con las variables secretas
bcryptjs            ---Encripta contraseñas. Nunca guardamos texto plano.
jsonwebtoken        ---Crea y verifica los tokens JWT
passport            ---El gestor de autenticación. Como Spring Security
passport-local      ---Estrategia de usuario + contraseña
passport-github2    ---Estrategia de login con GitHub
express-session     ---Maneja sesiones en el servidor
connect-mongo       ---Guarda las sesiones en MongoDB
cookie-parser       ---Permite leer cookies en las requests
nodemon             ---Reinicia el servidor solo cada vez que guardás un archivo. Solo se usa en desarrollo.

# app.js

Es el punto de entrada de toda la aplicación. Como el main() en Java. Aquí arranca el servidor, se conectan los middlewares y se registran las rutas.

# .env
Tiene los valores reales y secretos. Nunca se comparte

# database mongo

Monogo hace toda la conexion solo, no hay que crear database ni tablas.
Antes de crear el modelo, Mongoose necesita un Schema. El Schema define la estructura del documento — qué campos tiene, de qué tipo son y qué reglas deben cumplir.

Desarrollo  → MONGO_URI=mongodb://localhost:27017/sersaeDB
Producción  → MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/sersaeDB

Conexion exitosa: 
Server running in port: 3000
MongoDB conectado en: mongodb://localhost:27017/sesaeDB

# roles y model user

EN al base de datos definimos los elementos para autenticarnos, email, password, rol(para permisos), el githubID para el 
uso de auntenticacion con la cuenta de github OAuth

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


nombre      String          Nombre del usuario
email       String unique   No pueden existir dos iguales
password    String null     Puede ser null si entra por GitHub
rol         enum            Solo acepta admin o asistente
githubId    String null     Lo usamos cuando hagamos OAuth
activo      Boolean         Para desactivar sin borrar

timestamp: true     Mongo lo maneja automaticamente
createdAt  →  fecha de creación
updatedAt  →  fecha de última modificación

# cliente

Un Cliente es la empresa o persona que tiene proyectos ambientales. El asistente es quien los carga al sistema.

creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
}

Esto referecnia un llave foranea de User, para saber quien la creo. 

SQL                          MongoDB con Mongoose
─────────────────────        ─────────────────────
FOREIGN KEY (user_id)   →    type: ObjectId
REFERENCES users(id)    →    ref: 'User'

# permisos

Son los permisos que se han inventariado y se neceista la alerta

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
}

