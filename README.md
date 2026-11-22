# 🌿 SERSAE — Sistema de Gestión Ambiental

> Plataforma web para gestionar clientes, sedes, servicios y trámites ambientales, con alertas automáticas de vencimientos y plazos.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens&logoColor=white)

---

## ¿Qué hace?

- Registra **clientes** y sus **sedes** (cada sede con su ubicación y autoridad ambiental).
- Registra los **servicios** que se venden por sede: diagnóstico, trámite, sostenibilidad y acción climática.
- Para los **trámites**, usa un **catálogo de tipos** (vertimientos, concesión de aguas, ocupación de cauce, requerimiento, RUA) al que se pueden agregar tipos nuevos sin tocar el código.
- Controla **permisos** (con fecha de vencimiento) y **plazos** (requerimientos y RUA, con fecha límite).
- Muestra **alertas** de lo vencido y lo próximo a vencer en el dashboard.
- Controla el acceso con **roles** (admin y asistente).

---

## Modelo de datos

```
Cliente 1 ──► N Sede 1 ──► N Servicio
                              ├─ diagnostico
                              ├─ sostenibilidad
                              ├─ accion_climatica
                              └─ tramite ──► TipoTramite (catálogo)
                                    └─ 1 ──► N Permiso   (permiso con vencimiento o plazo con fecha límite)
```

| Colección | Campos principales |
|---|---|
| `User` | nombre, email, password (hash), rol, githubId, activo |
| `Cliente` | razonSocial, nit, nombreCompleto, email, email2, telefono, telefono2, estatus, activo |
| `Sede` | nombre, codigo (`SD-001`, automático), categoria, departamento, municipio, vereda, autoridadAmbiental, coordenadas (x, y, z), cliente, activo |
| `Servicio` | tipo, nombre, descripcion, linkPropuesta, precio, descuento, acuerdoPago, estadoPropuesta, motivoRechazo, estadoEjecucion, sede, tipoTramite, activo |
| `TipoTramite` | nombre, tipoFecha (`vencimiento` o `plazo`), activo |
| `Permiso` | nombre, numero, fechaEmision, fechaVencimiento, estado, diasAlerta, observaciones, servicio |
| `sessions` | creada por `connect-mongo` (TTL de 1 hora) |

### Reglas del modelo

- **Cliente → Sede:** los datos de ubicación viven en la sede, porque un cliente puede tener varias y cada una puede depender de una autoridad ambiental distinta.
- **Catálogo de trámites:** `tipoFecha` define cómo se lee el registro. Con `vencimiento` el permiso exige número y fecha de emisión; con `plazo` (requerimiento, RUA) solo se pide la fecha límite. Ambos usan el mismo motor de alertas.
- **Estado calculado:** el estado de un permiso se guarda al crearlo, pero **puede quedar viejo**. La verdad es el campo virtual `estadoActual`, que se calcula con la fecha cada vez que se lee. Las alertas usan `estadoActual`. `renovado` es el único estado que se marca a mano.
- **Total del servicio:** `precio - descuento` (el descuento es un monto en pesos). No se guarda, se calcula.
- **Reglas condicionales:** `tipoTramite` es obligatorio solo si `tipo = tramite`. `motivoRechazo` solo se guarda si `estadoPropuesta = rechazada`. El backend las aplica aunque el formulario las oculte.
- **Borrado:** clientes, sedes y servicios usan borrado lógico (`activo: false`). Una sede con servicios activos no se puede eliminar (responde `409`). Los permisos se eliminan de verdad.

---

## Stack

| Capa | Tecnología |
|---|---|
| Servidor | Node.js + Express |
| Base de datos | MongoDB + Mongoose |
| Autenticación | Passport (Local + GitHub OAuth) |
| Tokens | JWT (`jsonwebtoken`, expira en 1 h) |
| Sesiones | `express-session` + `connect-mongo` |
| Contraseñas | `bcryptjs` |
| Frontend | HTML + CSS + JavaScript puro (sin frameworks) |

---

## Estructura

```
SISTEMA-GESTION-AMBIENTAL-SERSAE/
├── config/
│   ├── database.js              → conexión a MongoDB
│   └── session.js               → sesiones en MongoDB
├── models/
│   ├── User.js
│   ├── Cliente.js
│   ├── Sede.js
│   ├── Servicio.js
│   ├── TipoTramite.js
│   └── Permiso.js
├── strategies/
│   ├── local.strategy.js        → email + password
│   └── github.strategy.js       → GitHub OAuth
├── controllers/                 → una carpeta de lógica por entidad
│   ├── auth.controller.js
│   ├── cliente.controller.js
│   ├── sede.controller.js
│   ├── servicio.controller.js
│   ├── tipoTramite.controller.js
│   └── permiso.controller.js
├── middlewares/
│   └── auth.middleware.js       → verificarToken + verificarRol
├── routes/                      → un archivo de rutas por entidad
├── seeds/
│   └── tiposTramite.seed.js     → carga los 5 tipos de trámite iniciales
├── public/
│   ├── index.html
│   ├── style.css
│   └── scripts.js
├── .env.example
└── app.js
```

---

## Instalación local

**Requisitos:** Node.js 18 o superior, MongoDB (local o Atlas) y una cuenta de GitHub para el login con GitHub.

**1. Instalar dependencias**

```bash
npm install
```

**2. Revisar los scripts en `package.json`**

```json
"scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "seed": "node seeds/tiposTramite.seed.js"
}
```

**3. Crear el `.env`** copiando `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/sersaeDB
JWT_SECRET=una_cadena_larga_y_aleatoria
SESSION_SECRET=otra_cadena_larga_y_aleatoria
NODE_ENV=development
GITHUB_CLIENT_ID=tu_client_id
GITHUB_CLIENT_SECRET=tu_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

**4. Configurar GitHub OAuth** en https://github.com/settings/developers → *New OAuth App*:
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/github/callback`

**5. Cargar los tipos de trámite iniciales** (es seguro ejecutarlo varias veces, no duplica):

```bash
npm run seed
```

**6. Iniciar el servidor**

```bash
npm run dev
```

**7. Abrir la aplicación** en `http://localhost:3000`. El frontend siempre debe abrirse desde esta dirección, no como archivo (`file://`), porque la cookie de sesión solo viaja en el mismo origen.

---

## Prueba rápida

Primero crea un usuario administrador y entra desde la pantalla de login (o con Postman).

```
POST /api/auth/register
{ "nombre": "Admin", "email": "admin@sersae.com", "password": "Admin1234", "rol": "admin" }

POST /api/auth/login
{ "email": "admin@sersae.com", "password": "Admin1234" }
```

En Postman usa el `token` de la respuesta con el encabezado `Authorization: Bearer TU_TOKEN`. El navegador usa la cookie `authToken` automáticamente.

Después, en este orden:

```
POST /api/clientes
{ "razonSocial": "Los Alpes SAS", "nit": "900123456-1", "nombreCompleto": "Jhon Dario Correa",
  "email": "contacto@losalpes.com", "telefono": "3001234567", "estatus": "consolidado" }

POST /api/sedes
{ "nombre": "Granja Los Alpes", "categoria": "porcicultor", "departamento": "Antioquia",
  "municipio": "San Roque", "autoridadAmbiental": "Cornare", "clienteId": "ID_CLIENTE" }

POST /api/servicios
{ "tipo": "tramite", "nombre": "Concesión de aguas", "precio": 2600000, "descuento": 0,
  "estadoPropuesta": "aprobada", "estadoEjecucion": "en_curso",
  "sedeId": "ID_SEDE", "tipoTramiteId": "ID_TIPO_TRAMITE" }

POST /api/permisos
{ "nombre": "Concesión de aguas superficiales", "numero": "RES-2026-001",
  "fechaEmision": "2026-01-15", "fechaVencimiento": "2027-01-15",
  "diasAlerta": 60, "servicioId": "ID_SERVICIO" }

GET /api/permisos/vencimientos
```

Obtén `ID_TIPO_TRAMITE` con `GET /api/tipos-tramite`. Para probar las alertas, cambia `fechaVencimiento` a una fecha cercana o pasada.

---

## API

Todas las rutas, salvo las de autenticación, requieren sesión (cookie o `Bearer`).

**Autenticación**

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | público |
| POST | `/api/auth/login` | público |
| POST | `/api/auth/logout` | limpia la cookie y destruye la sesión |
| GET | `/api/auth/github` | inicia el login con GitHub |
| GET | `/api/auth/github/callback` | retorno de GitHub |
| GET | `/api/profile` | JWT |
| GET | `/api/session` | JWT |
| GET | `/api/admin` | JWT + rol admin |

**Recursos** (cada uno con `GET` lista, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`)

| Ruta | Filtros de la lista | Borrado |
|---|---|---|
| `/api/clientes` | — | lógico |
| `/api/sedes` | `clienteId` | lógico; `409` si tiene servicios activos |
| `/api/servicios` | `sedeId`, `tipo`, `estadoPropuesta`, `estadoEjecucion` | lógico |
| `/api/permisos` | `servicioId`, `estado` (calculado) | definitivo |

**Otras rutas**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/permisos/vencimientos` | resumen y listas de vencidos y por vencer |
| GET | `/api/tipos-tramite` | lista el catálogo (cualquier usuario con sesión) |
| POST | `/api/tipos-tramite` | crea un tipo de trámite (solo admin) |

Códigos usados: `400` datos inválidos, `401` sin sesión, `403` sin permiso de rol, `404` no encontrado, `409` conflicto con datos existentes.

---

## Seguridad

- **Contraseñas** con bcrypt (10 rondas).
- **JWT** con `{ userId, rol }`, expira en 1 hora.
- **Cookie `authToken`:** `httpOnly`, `sameSite: Lax`, `secure` en producción y `maxAge` de 1 hora, igual que el token.
- **El frontend no guarda el token.** Solo usa la cookie `httpOnly`, que JavaScript no puede leer. Al cargar, consulta `/api/profile` para saber si hay sesión. Si la sesión expira, vuelve al login con un aviso.
- **XSS:** todo dato de la base que se escribe en el HTML pasa por `escaparHtml`.
- **CSRF:** `SameSite=Lax` bloquea las peticiones `POST`, `PUT` y `DELETE` de otros sitios. Por eso el logout es `POST`.
- **Sesiones** guardadas en MongoDB con vencimiento de 1 hora; el logout las destruye.
- **Roles** verificados en el servidor (`verificarRol`), no en el frontend.
- **Validación en el backend** de todas las reglas del negocio, aunque el formulario también las valide.

El token en el cuerpo de la respuesta de login se mantiene para poder usar la API desde Postman. El frontend lo ignora.

---

## Limitaciones conocidas

Pendientes antes de poner la aplicación en producción:

1. **`/api/auth/register` es público y acepta el campo `rol`**, así que cualquiera podría crearse un administrador. Debe forzar `asistente` y dejar que solo un admin cree otros admins.
2. El rol vive en el JWT: un cambio de rol se aplica en el siguiente login (máximo 1 hora).
3. Sin límite de intentos en el login ni cabeceras de seguridad (`helmet`).
4. Los errores se manejan en cada controller y devuelven `error.message`. Falta un manejador central de errores.
5. Sin pruebas automáticas.
6. Eliminar un cliente no valida si tiene sedes activas.
7. Renovar un permiso solo lo marca como `renovado`; el permiso nuevo se crea a mano.

---

## Despliegue en un VPS

```bash
# Node.js 18+, PM2 y Nginx instalados
git clone <repositorio> && cd <carpeta>
npm install
cp .env.example .env      # completar con valores de producción
npm run seed
pm2 start app.js --name sersae
pm2 save && pm2 startup
```

Para producción:

- `NODE_ENV=production` y `MONGO_URI` de MongoDB Atlas.
- Secretos largos y aleatorios para `JWT_SECRET` y `SESSION_SECRET`.
- HTTPS con Nginx como proxy y certificado (Let's Encrypt). La cookie `secure` solo funciona con HTTPS.
- Detrás de Nginx, agregar `app.set('trust proxy', 1);` en `app.js`, antes de las sesiones. Sin esto, `express-session` no envía la cookie de sesión.
- Cambiar `GITHUB_CALLBACK_URL` y la callback de la app de GitHub al dominio real.