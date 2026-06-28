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


# Passport Local Strategy

Passport es un middleware de autenticación para Node.js. Su trabajo es verificar la identidad del usuario.
Funciona con estrategias. Cada estrategia es una forma diferente de autenticarse:

passport-local    →  usuario y contraseña
passport-github2  →  login con GitHub
passport-google   →  login con Google

passport-local fujo:

Usuario envía email + password
        ↓
Passport intercepta el request
        ↓
Ejecuta la Local Strategy
        ↓
Busca el User en MongoDB
        ↓
Compara el password con bcrypt
        ↓
Si es correcto  →  genera JWT  →  responde con token
Si es incorrecto →  responde 401 No autorizado

El en local strategy hay que definir un username y un password. Por uso normal de desarrollo
se una eamil como username y password como password.

POST /api/v1/auth/login
        ↓
passport.authenticate('local')
        ↓
local.strategy.js se ejecuta
        ↓
User.findOne({ email })       →  ¿existe?
        ↓
bcrypt.compare(password, hash) →  ¿correcto?
        ↓
done(null, usuario)            →  continúa al controller


# auth.controller.js

Los controllers son archivo que contiene la lógica de negocio de cada endpoint. Recibe el request, hace el trabajo y devuelve la response.

Funciones del authCOntroller:

register  →  crear usuario nuevo
login     →  verificar credenciales y generar JWT
logout    →  limpiar cookie y sesión
profile   →  devolver datos del usuario logueado
session   →  devolver datos de la sesión activa


Manejo de csrf y proteccion de datos en la cookie

Luego de obteenr el jwt
 // Enviamos el token en una cookie httpOnly
        // httpOnly: true  → JavaScript del navegador NO puede leerla
        // sameSite: 'Lax' → protección contra CSRF
        // secure          → solo HTTPS en producción
        const esProduccion = process.env.NODE_ENV === 'production';

        res.cookie('authToken', token, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: esProduccion
        });

El salt

javascriptconst salt = await bcrypt.genSalt(10);
El número 10 define cuántas veces bcrypt procesa el password:
salt rounds: 10  →  1024 iteraciones   (recomendado para producción)
salt rounds: 12  →  4096 iteraciones   (más seguro, más lento)
salt rounds: 6   →  64 iteraciones     (muy rápido, poco seguro)

ERRORES DEL JSONWBTOKEN

// jwt.verify lanza estos errores según el caso:

TokenExpiredError   →  el token existía pero ya expiró (pasó 1h)
JsonWebTokenError   →  el token está malformado o la firma no coincide
NotBeforeError      →  el token todavía no es válido (caso raro)

Los vamos a usar para los middlewares

# middlewares para verificar y filtrar, como el filte de springboot

Es una función que se ejecuta entre el request y el response. Como un filtro o interceptor.
Request llega
     ↓
Middleware 1  →  ¿tiene token?
     ↓
Middleware 2  →  ¿tiene el rol correcto?
     ↓
Controller    →  ejecuta la lógica
     ↓
Response sale

auth.middleware.js  →  verifica que el JWT sea válido Y verifica que el usuario tenga el rol correcto


Se hace la busqueda del token de dos maneras para evaular con html y postman

Cookie      →  para el navegador (frontend HTML)
Header      →  para Postman y aplicaciones externas

La diferencia entre 401 y 403

401 Unauthorized  →  No sabemos quién sos. No hay token o es inválido
403 Forbidden     →  Sabemos quién sos pero no tenés permiso

Sin token          →  401  (no sabemos quién sos)

Token de asistente
intentando entrar
a ruta de admin    →  403  (sabemos quién sos, pero no podés)

# routes

Es el archivo que conecta una URL con un controller. No tiene lógica, solo define quién atiende cada endpoint.

Route           →   define URL + método HTTP + middlewares + controller
Controller      →   tiene la lógica
Middleware      →   filtro que se ejecuta antes del controller

POST  /api/v1/auth/register   →  público
POST  /api/v1/auth/login      →  público
GET   /api/v1/auth/logout     →  público

GET   /api/v1/profile         →  protegido con JWT
GET   /api/v1/session         →  protegido con JWT
GET   /api/v1/admin           →  protegido con JWT + rol admin

# sesiones

Una sesión es un espacio de almacenamiento en el servidor vinculado a un usuario específico. A diferencia del JWT que vive en el cliente, la sesión vive en el servidor.

JWT                          Sesión
─────────────────────        ─────────────────────
Vive en el cliente           Vive en el servidor
El cliente lo envía          El servidor lo busca
en cada request              por el sessionId
No se puede invalidar        Se puede destruir
fácilmente                   en cualquier momento


ttl: 60 * 60  →  3600 segundos  →  1 hora
MongoDB borra automáticamente las sesiones vencidas.


JWT      →  /profile, /admin, /clientes, /proyectos
           cualquier ruta que necesite autenticación

Sesión   →  /session
           solo para saber si hay alguien conectado
           y destruirla en el logout


# GitHub OAuth

OAuth es un protocolo que permite que un usuario se autentique usando una cuenta de terceros (GitHub, Google, etc.) sin compartir su contraseña con nuestra app.

Sin OAuth                    Con OAuth
─────────────────────        ─────────────────────
Usuario crea cuenta          Usuario hace click
en nuestra app               "Entrar con GitHub"
recuerda otra contraseña          ↓
                             GitHub verifica
                             su identidad
                                  ↓
                             nos envía los datos
                             del usuario


1. Usuario hace click en "Login con GitHub"
        ↓
2. Nuestra app redirige a GitHub
        ↓
3. GitHub pregunta "¿Autorizás a SERSAE?"
        ↓
4. Usuario acepta
        ↓
5. GitHub nos manda un "code" secreto
        ↓
6. Nuestra app intercambia ese code por los datos del usuario
        ↓
7. Creamos o buscamos el usuario en nuestra BD
        ↓
8. Generamos JWT y redirigimos al dashboard

