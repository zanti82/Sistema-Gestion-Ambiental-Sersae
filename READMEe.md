# SERSAE — Sistema de Gestión Ambiental

> Plataforma web para la gestión integral de servicios ambientales empresariales: trámites, diagnósticos, sostenibilidad y acción climática.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens&logoColor=white)

---

## ¿Qué es SERSAE?

SERSAE es una plataforma de gestión ambiental empresarial que permite:

- Registrar **clientes** con sus datos fiscales y sector de actividad
- Gestionar **servicios** contratados por cada cliente (trámites, diagnósticos, sostenibilidad, acción climática)
- Crear **proyectos ambientales** asociados a servicios de tipo trámite con código automático (`GR-001`)
- Gestionar **permisos ambientales** con fecha de vencimiento por proyecto
- Recibir **alertas automáticas** cuando un permiso está por vencer o ya venció
- Controlar el acceso mediante **roles** (admin y asistente)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Servidor | Node.js + Express.js |
| Base de datos | MongoDB + Mongoose |
| Autenticación | Passport.js (Local + GitHub OAuth) |
| Tokens | JWT (jsonwebtoken) |
| Sesiones | express-session + connect-mongo |
| Contraseñas | bcryptjs |
| Frontend | HTML + CSS + JavaScript vanilla |

---

## 🗄️ Modelos de Base de Datos

```
User         → quien usa el sistema (admin / asistente)
Cliente      → empresa o persona con servicios ambientales
Servicio     → servicio contratado por el cliente
Proyecto     → proyecto ambiental (solo para servicios tipo trámite)
Permiso      → permiso con fecha de vencimiento ligado a un proyecto
```

### Relaciones

```
User   ──────────────────────────────────────► (crea/gestiona todo)

Cliente  1 ──────────► N  Servicio
                            ├── tipo: 'diagnostico'
                            ├── tipo: 'sostenibilidad'
                            ├── tipo: 'accion_climatica'
                            └── tipo: 'tramite'
                                    └── 1 ──► N  Proyecto
                                                    └── 1 ──► N  Permiso
                                                                ← tiene fechaVencimiento
```

### ¿Por qué este diseño?

`Servicio` es la tabla principal que agrupa todos los servicios que SERSAE ofrece a sus clientes. Los trámites son un tipo de servicio que además tiene proyectos y permisos asociados. Los otros tipos (diagnóstico, sostenibilidad, acción climática) se registran directamente como servicios sin necesidad de proyectos. Esto permite escalar la plataforma hacia facturación y reportes sin cambiar la arquitectura.

---

## Arquitectura

```
SISTEMA-GESTION-AMBIENTAL-SERSAE/
│
├── config/
│   ├── database.js              → Conexión a MongoDB
│   └── session.js               → Configuración de sesiones
│
├── models/
│   ├── User.js                  → Usuario con roles
│   ├── Cliente.js               → Cliente ambiental
│   ├── Servicio.js              → Servicio contratado (tabla principal)
│   ├── Proyecto.js              → Proyecto (solo para trámites)
│   └── Permiso.js               → Permiso con alerta de vencimiento
│
├── strategies/
│   ├── local.strategy.js        → Passport Local (email + password)
│   └── github.strategy.js       → Passport GitHub OAuth
│
├── controllers/
│   ├── auth.controller.js       → register, login, logout, profile
│   ├── cliente.controller.js
│   ├── servicio.controller.js
│   ├── proyecto.controller.js
│   └── permiso.controller.js
│
├── middlewares/
│   └── auth.middleware.js       → verificarToken + verificarRol
│
├── routes/
│   ├── auth.routes.js
│   ├── cliente.routes.js
│   ├── servicio.routes.js
│   ├── proyecto.routes.js
│   └── permiso.routes.js
│
├── public/
│   ├── index.html               → SPA frontend
│   ├── style.css                → Estilos con identidad SERSAE
│   └── app.js                   → Lógica del frontend
│
├── .env.example
└── app.js                       → Punto de entrada
```

---

## 🚀 Instalación y prueba local

### Requisitos previos

- Node.js v18 o superior
- MongoDB instalado localmente o cuenta en MongoDB Atlas
- Cuenta de GitHub (para OAuth)

### Paso 1 — Clonar el proyecto

```bash
git clone https://github.com/tu-usuario/sistema-gestion-ambiental-sersae.git
cd sistema-gestion-ambiental-sersae
```

### Paso 2 — Instalar dependencias

```bash
npm install
```

### Paso 3 — Configurar variables de entorno

```bash
cp .env.example .env
```

Editá el archivo `.env` con tus valores:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/sersaeDB
JWT_SECRET=tu_secreto_jwt_aqui_minimo_32_caracteres
SESSION_SECRET=tu_secreto_session_aqui_minimo_32_caracteres
NODE_ENV=development
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
```

### Paso 4 — Configurar GitHub OAuth

1. Entrá a [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click en **New OAuth App**
3. Completá el formulario:
   - **Application name:** SERSAE
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000/api/v1/auth/github/callback`
4. Copiá el **Client ID** y **Client Secret** al `.env`

### Paso 5 — Levantar MongoDB

```bash
# Windows (como administrador)
net start MongoDB

# Mac/Linux
mongod
```

### Paso 6 — Iniciar el servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

### Paso 7 — Verificar que funciona

```
http://localhost:3000
```

O verificá el health check:
```
GET http://localhost:3000/api/v1/health
→ { "status": "ok", "message": "Servidor funcionando" }
```

---

## 🧪 Prueba rápida con Postman

### 1. Registrar usuario admin

```
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
    "nombre": "Admin SERSAE",
    "email": "admin@sersae.com",
    "password": "Admin1234",
    "rol": "admin"
}
```

### 2. Login

```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
    "email": "admin@sersae.com",
    "password": "Admin1234"
}
```

Guardá el `token` de la respuesta.

### 3. Crear cliente

```
POST http://localhost:3000/api/v1/clientes
Authorization: Bearer TU_TOKEN

{
    "razonSocial": "Minera Los Andes SA",
    "nit": "900123456-1",
    "email": "contacto@mineraandes.com",
    "sector": "mineria"
}
```

### 4. Crear servicio de tipo trámite

```
POST http://localhost:3000/api/v1/servicios
Authorization: Bearer TU_TOKEN

{
    "tipo": "tramite",
    "nombre": "Trámite Licencia Ambiental 2024",
    "descripcion": "Gestión de licencia ambiental para expansión",
    "precio": 5000000,
    "clienteId": "ID_DEL_CLIENTE"
}
```

### 5. Crear proyecto (solo para trámites)

```
POST http://localhost:3000/api/v1/proyectos
Authorization: Bearer TU_TOKEN

{
    "nombre": "Estudio de Impacto Ambiental",
    "tipoProyecto": "estudio_impacto",
    "fechaInicio": "2024-01-15",
    "servicioId": "ID_DEL_SERVICIO"
}
```

El código `GR-001` se genera automáticamente.

### 6. Crear permiso

```
POST http://localhost:3000/api/v1/permisos
Authorization: Bearer TU_TOKEN

{
    "nombre": "Licencia Ambiental Principal",
    "numero": "LA-2024-001",
    "tipoPermiso": "licencia_ambiental",
    "fechaEmision": "2024-01-15",
    "fechaVencimiento": "2024-07-10",
    "diasAlerta": 30,
    "proyectoId": "ID_DEL_PROYECTO"
}
```

El estado `vigente`, `por_vencer` o `vencido` se calcula automáticamente.

### 7. Ver alertas de vencimiento

```
GET http://localhost:3000/api/v1/permisos/vencimientos
Authorization: Bearer TU_TOKEN
```

---

## 🔐 Endpoints de la API

### Auth
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Registrar usuario | No |
| POST | `/api/v1/auth/login` | Login con email/password | No |
| GET | `/api/v1/auth/logout` | Cerrar sesión | No |
| GET | `/api/v1/auth/github` | Login con GitHub | No |
| GET | `/api/v1/profile` | Ver perfil | JWT |
| GET | `/api/v1/session` | Ver sesión activa | JWT |
| GET | `/api/v1/admin` | Panel admin | JWT + rol admin |

### Clientes
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/clientes` | Listar todos |
| POST | `/api/v1/clientes` | Crear nuevo |
| GET | `/api/v1/clientes/:id` | Ver uno |
| PUT | `/api/v1/clientes/:id` | Editar |
| DELETE | `/api/v1/clientes/:id` | Eliminar (soft delete) |

### Servicios
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/servicios` | Listar todos |
| GET | `/api/v1/servicios?clienteId=xxx` | Filtrar por cliente |
| GET | `/api/v1/servicios?tipo=tramite` | Filtrar por tipo |
| GET | `/api/v1/servicios?estado=activo` | Filtrar por estado |
| POST | `/api/v1/servicios` | Crear nuevo |
| GET | `/api/v1/servicios/:id` | Ver uno |
| PUT | `/api/v1/servicios/:id` | Editar |
| DELETE | `/api/v1/servicios/:id` | Eliminar |

### Proyectos (solo para trámites)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/proyectos` | Listar todos |
| GET | `/api/v1/proyectos?servicioId=xxx` | Filtrar por servicio |
| POST | `/api/v1/proyectos` | Crear nuevo |
| GET | `/api/v1/proyectos/:id` | Ver uno |
| PUT | `/api/v1/proyectos/:id` | Editar |
| DELETE | `/api/v1/proyectos/:id` | Eliminar |

### Permisos
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/permisos/vencimientos` | Alertas de vencimiento |
| GET | `/api/v1/permisos` | Listar todos |
| GET | `/api/v1/permisos?proyectoId=xxx` | Filtrar por proyecto |
| GET | `/api/v1/permisos?estado=vencido` | Filtrar por estado |
| POST | `/api/v1/permisos` | Crear nuevo |
| GET | `/api/v1/permisos/:id` | Ver uno |
| PUT | `/api/v1/permisos/:id` | Editar |
| DELETE | `/api/v1/permisos/:id` | Eliminar |

---

## 🔒 Seguridad implementada

- **Contraseñas** encriptadas con bcrypt (salt rounds: 10)
- **JWT** firmado con secreto en variables de entorno (expira en 1h)
- **Cookie httpOnly** para proteger el token de ataques XSS
- **sameSite: Lax** para protección CSRF
- **secure: true** en producción (solo HTTPS)
- **Roles** verificados en cada request protegido
- **Sesiones** persistidas en MongoDB con TTL de 1 hora
- **Soft delete** en clientes y servicios para preservar historial

---

## 🌐 Deploy en VPS (próximamente)

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Clonar y configurar
git clone https://github.com/tu-usuario/sersae.git
cd sersae
npm install
cp .env.example .env
# Editar .env con valores de producción

# Iniciar con PM2
pm2 start app.js --name sersae
pm2 save
pm2 startup
```

---

## 👤 Autor

Desarrollado por **SERSAE** — Servicios de Sostenibilidad Ambiental Empresarial
📞 (+57) 300 8869306
🔗 [LinkedIn](https://linkedin.com/in/sersae2014)

---

## 📄 Licencia

MIT — libre para uso personal y comercial.