
// =====================
// ESTADO GLOBAL
// =====================
var token = null;
var usuarioActual = null;
var BASE_URL = 'http://localhost:3000/api';

// =====================
// INICIALIZACIÓN
// =====================
window.onload = function() {
    token = localStorage.getItem('sersae_token');
    var usuarioGuardado = localStorage.getItem('sersae_usuario');

    if (token !== null && usuarioGuardado !== null) {
        usuarioActual = JSON.parse(usuarioGuardado);
        mostrarApp();
    }
};

// =====================
// AUTH
// =====================
function iniciarSesion() {
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    var errorDiv = document.getElementById('loginError');

    errorDiv.style.display = 'none';

    if (email === '' || password === '') {
        errorDiv.textContent = 'Completá todos los campos';
        errorDiv.style.display = 'block';
        return;
    }

    fetch(BASE_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.token) {
            token = data.token;
            usuarioActual = data.usuario;
            localStorage.setItem('sersae_token', token);
            localStorage.setItem('sersae_usuario', JSON.stringify(usuarioActual));
            mostrarApp();
        } else {
            errorDiv.textContent = data.mensaje || 'Credenciales incorrectas';
            errorDiv.style.display = 'block';
        }
    })
    .catch(function() {
        errorDiv.textContent = 'Error de conexión con el servidor';
        errorDiv.style.display = 'block';
    });
}

function loginGithub() {
    window.location.href = BASE_URL + '/auth/github';
}

function cerrarSesion() {
    fetch(BASE_URL + '/auth/logout', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function() {
        token = null;
        usuarioActual = null;
        localStorage.removeItem('sersae_token');
        localStorage.removeItem('sersae_usuario');
        document.getElementById('appPrincipal').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    });
}

function mostrarApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPrincipal').style.display = 'flex';

    var inicialNombre = usuarioActual.nombre.charAt(0).toUpperCase();
    document.getElementById('usuarioAvatar').textContent = inicialNombre;
    document.getElementById('usuarioNombre').textContent = usuarioActual.nombre;
    document.getElementById('usuarioRol').textContent = usuarioActual.rol;

    cargarDashboard();
}

// =====================
// NAVEGACIÓN
// =====================
function mostrarPagina(nombre) {
    var paginas = document.querySelectorAll('.pagina');
    paginas.forEach(function(p) { p.classList.remove('activa'); });

    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(n) { n.classList.remove('activo'); });

    document.getElementById('pagina' + capitalizar(nombre)).classList.add('activa');

    var titulos = {
        dashboard: 'Dashboard',
        clientes: 'Clientes',
        proyectos: 'Proyectos',
        permisos: 'Permisos Ambientales',
        vencimientos: 'Alertas de Vencimiento',
        editarCliente: 'Editar Cliente',
        editarProyecto: 'Editar Proyecto',
        editarPermiso: 'Editar Permiso'
    };

    document.getElementById('topbarTitulo').textContent = titulos[nombre] || nombre;

    // Solo marcamos activo en el nav si es una página principal
    var navIndex = { dashboard: 0, clientes: 1, proyectos: 2, permisos: 3, vencimientos: 4 };

    if (navIndex[nombre] !== undefined) {
        navItems[navIndex[nombre]].classList.add('activo');
    }

    if (nombre === 'clientes') { cargarClientes(); }
    if (nombre === 'proyectos') { cargarProyectos(); }
    if (nombre === 'permisos') { cargarPermisos(); }
    if (nombre === 'vencimientos') { cargarVencimientos(); }
    if (nombre === 'dashboard') { cargarDashboard(); }


}

function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// =====================
// HELPERS
// =====================
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
}

function formatearFecha(fechaStr) {
    if (fechaStr === null || fechaStr === undefined) { return '-'; }
    var fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function badgeEstado(estado) {
    var clases = {
        vigente: 'badge-vigente',
        por_vencer: 'badge-por-vencer',
        vencido: 'badge-vencido',
        renovado: 'badge-renovado'
    };
    var etiquetas = {
        vigente: 'Vigente',
        por_vencer: 'Por vencer',
        vencido: 'Vencido',
        renovado: 'Renovado'
    };
    var clase = clases[estado] || 'badge-vigente';
    var etiqueta = etiquetas[estado] || estado;
    return '<span class="badge ' + clase + '">' + etiqueta + '</span>';
}

// =====================
// DASHBOARD
// =====================
function cargarDashboard() {
    fetch(BASE_URL + '/clientes', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        document.getElementById('statClientes').textContent = data.total || 0;
    });

    fetch(BASE_URL + '/proyectos', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        document.getElementById('statProyectos').textContent = data.total || 0;
    });

    fetch(BASE_URL + '/permisos/vencimientos', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var porVencer = data.resumen ? data.resumen.porVencer : 0;
        var vencidos = data.resumen ? data.resumen.vencidos : 0;
        var total = data.resumen ? data.resumen.totalAlertas : 0;

        document.getElementById('statPorVencer').textContent = porVencer;
        document.getElementById('statVencidos').textContent = vencidos;

        if (total > 0) {
            document.getElementById('alertaBadge').style.display = 'inline-block';
            document.getElementById('alertaConteo').textContent = total;
        }

        var contenedor = document.getElementById('dashboardAlertas');
        var todosPermisos = [];

        if (data.vencidos) {
            data.vencidos.forEach(function(p) { todosPermisos.push(p); });
        }
        if (data.porVencer) {
            data.porVencer.forEach(function(p) { todosPermisos.push(p); });
        }

        if (todosPermisos.length === 0) {
            contenedor.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-icono">✅</div><div class="estado-vacio-texto">Todo al día</div><div class="estado-vacio-sub">No hay permisos que requieran atención</div></div>';
            return;
        }

        var html = '';
        todosPermisos.slice(0, 5).forEach(function(permiso) {
            var icono = permiso.estado === 'vencido' ? '🚨' : '⏳';
            var cliente = '';
            if (permiso.proyecto && permiso.proyecto.cliente) {
                cliente = permiso.proyecto.cliente.razonSocial;
            }
            html += '<div class="alerta-item">';
            html += '<div class="alerta-icono">' + icono + '</div>';
            html += '<div>';
            html += '<div class="alerta-nombre">' + permiso.nombre + '</div>';
            html += '<div class="alerta-detalle">' + cliente + ' — Vence: ' + formatearFecha(permiso.fechaVencimiento) + ' — ' + badgeEstado(permiso.estado) + '</div>';
            html += '</div>';
            html += '</div>';
        });

        contenedor.innerHTML = html;
    });
}

// =====================
// CLIENTES
// =====================
function cargarClientes() {
    fetch(BASE_URL + '/clientes', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaClientes');

        if (data.clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="estado-vacio"><div class="estado-vacio-icono">🏢</div><div class="estado-vacio-texto">Sin clientes registrados</div><div class="estado-vacio-sub">Hacé click en "Nuevo cliente" para comenzar</div></div></td></tr>';
            return;
        }

        var html = '';
        data.clientes.forEach(function(cliente) {
            html += '<tr>';
            html += '<td><strong>' + cliente.razonSocial + '</strong></td>';
            html += '<td>' + cliente.nit + '</td>';
            html += '<td>' + cliente.email + '</td>';
            html += '<td>' + cliente.sector + '</td>';
            html += '<td><div class="acciones">';
            html += '<button class="btn btn-secondary btn-sm" onclick="irEditarCliente(\'' + cliente._id + '\')">✏️ Editar</button>';
            html += '<button class="btn btn-danger btn-sm" onclick="eliminarCliente(\'' + cliente._id + '\')">🗑 Eliminar</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    });
}

function abrirModalCliente() {
    document.getElementById('clienteRazonSocial').value = '';
    document.getElementById('clienteNit').value = '';
    document.getElementById('clienteEmail').value = '';
    document.getElementById('clienteTelefono').value = '';
    document.getElementById('clienteDireccion').value = '';
    document.getElementById('clienteError').style.display = 'none';
    document.getElementById('modalCliente').classList.add('abierto');
}

function guardarCliente() {
    var errorDiv = document.getElementById('clienteError');
    errorDiv.style.display = 'none';

    var body = {
        razonSocial: document.getElementById('clienteRazonSocial').value,
        nit: document.getElementById('clienteNit').value,
        email: document.getElementById('clienteEmail').value,
        telefono: document.getElementById('clienteTelefono').value,
        direccion: document.getElementById('clienteDireccion').value,
        sector: document.getElementById('clienteSector').value
    };

    fetch(BASE_URL + '/clientes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.cliente) {
            cerrarModal('modalCliente');
            cargarClientes();
        } else {
            errorDiv.textContent = data.mensaje || 'Error al guardar';
            errorDiv.style.display = 'block';
        }
    });
}

function eliminarCliente(id) {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) { return; }

    fetch(BASE_URL + '/clientes/' + id, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(function() { cargarClientes(); });
}

// =====================
// PROYECTOS
// =====================
function cargarProyectos() {
    fetch(BASE_URL + '/proyectos', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaProyectos');

        console.log(data);

        if (data.proyectos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="estado-vacio"><div class="estado-vacio-icono">📁</div><div class="estado-vacio-texto">Sin proyectos registrados</div><div class="estado-vacio-sub">Hacé click en "Nuevo proyecto" para comenzar</div></div></td></tr>';
            return;
        }

        var html = '';
        data.proyectos.forEach(function(proyecto) {
            var clienteNombre = proyecto.cliente ? proyecto.cliente.razonSocial : '-';
            html += '<tr>';
            html += '<td><strong>' + proyecto.codigo + '</strong></td>';
            html += '<td>' + proyecto.nombre + '</td>';
            html += '<td>' + clienteNombre + '</td>';
            html += '<td>' + proyecto.tipoProyecto.replace('_', ' ') + '</td>';
            html += '<td>' + proyecto.estado + '</td>';
            html += '<td><div class="acciones">';
            html += '<button class="btn btn-secondary btn-sm" onclick="irEditarProyecto(\'' + proyecto._id + '\')">✏️ Editar</button>';
            html += '<button class="btn btn-danger btn-sm" onclick="eliminarProyecto(\'' + proyecto._id + '\')">🗑 Eliminar</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    });
}

function abrirModalProyecto() {
    document.getElementById('proyectoNombre').value = '';
    document.getElementById('proyectoDescripcion').value = '';
    document.getElementById('proyectoError').style.display = 'none';

    fetch(BASE_URL + '/clientes', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var select = document.getElementById('proyectoCliente');
        select.innerHTML = '<option value="">Seleccioná un cliente</option>';
        data.clientes.forEach(function(cliente) {
            select.innerHTML += '<option value="' + cliente._id + '">' + cliente.razonSocial + '</option>';
        });
    });

    document.getElementById('modalProyecto').classList.add('abierto');
}

function guardarProyecto() {
    var errorDiv = document.getElementById('proyectoError');
    errorDiv.style.display = 'none';

    var body = {
        nombre: document.getElementById('proyectoNombre').value,
        descripcion: document.getElementById('proyectoDescripcion').value,
        tipoProyecto: document.getElementById('proyectoTipo').value,
        fechaInicio: document.getElementById('proyectoFechaInicio').value,
        clienteId: document.getElementById('proyectoCliente').value
    };

    fetch(BASE_URL + '/proyectos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.proyecto) {
            cerrarModal('modalProyecto');
            cargarProyectos();
        } else {
            errorDiv.textContent = data.mensaje || 'Error al guardar';
            errorDiv.style.display = 'block';
        }
    });
}

function eliminarProyecto(id) {
    if (!confirm('¿Seguro que querés eliminar este proyecto?')) { return; }

    fetch(BASE_URL + '/proyectos/' + id, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(function() { cargarProyectos(); });
}

// =====================
// PERMISOS
// =====================
function cargarPermisos() {
    fetch(BASE_URL + '/permisos', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaPermisos');

        if (data.permisos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="estado-vacio"><div class="estado-vacio-icono">📄</div><div class="estado-vacio-texto">Sin permisos registrados</div><div class="estado-vacio-sub">Hacé click en "Nuevo permiso" para comenzar</div></div></td></tr>';
            return;
        }

        var html = '';
        data.permisos.forEach(function(permiso) {
            var proyectoNombre = permiso.proyecto ? permiso.proyecto.nombre : '-';
            html += '<tr>';
            html += '<td><strong>' + permiso.numero + '</strong></td>';
            html += '<td>' + permiso.nombre + '</td>';
            html += '<td>' + proyectoNombre + '</td>';
            html += '<td>' + formatearFecha(permiso.fechaVencimiento) + '</td>';
            html += '<td>' + badgeEstado(permiso.estado) + '</td>';
            html += '<td><div class="acciones">';
            html += '<button class="btn btn-secondary btn-sm" onclick="irEditarPermiso(\'' + permiso._id + '\')">✏️ Editar</button>';
            html += '<button class="btn btn-danger btn-sm" onclick="eliminarPermiso(\'' + permiso._id + '\')">🗑 Eliminar</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    });
}

function abrirModalPermiso() {
    document.getElementById('permisoNombre').value = '';
    document.getElementById('permisoNumero').value = '';
    document.getElementById('permisoObservaciones').value = '';
    document.getElementById('permisoDiasAlerta').value = '30';
    document.getElementById('permisoError').style.display = 'none';

    fetch(BASE_URL + '/proyectos', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var select = document.getElementById('permisoProyecto');
        select.innerHTML = '<option value="">Seleccioná un proyecto</option>';
        data.proyectos.forEach(function(proyecto) {
            select.innerHTML += '<option value="' + proyecto._id + '">' + proyecto.codigo + ' — ' + proyecto.nombre + '</option>';
        });
    });

    document.getElementById('modalPermiso').classList.add('abierto');
}

function guardarPermiso() {
    var errorDiv = document.getElementById('permisoError');
    errorDiv.style.display = 'none';

    var body = {
        nombre: document.getElementById('permisoNombre').value,
        numero: document.getElementById('permisoNumero').value,
        tipoPermiso: document.getElementById('permisoTipo').value,
        fechaEmision: document.getElementById('permisoFechaEmision').value,
        fechaVencimiento: document.getElementById('permisoFechaVencimiento').value,
        diasAlerta: document.getElementById('permisoDiasAlerta').value,
        observaciones: document.getElementById('permisoObservaciones').value,
        proyectoId: document.getElementById('permisoProyecto').value
    };

    fetch(BASE_URL + '/permisos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.permiso) {
            cerrarModal('modalPermiso');
            cargarPermisos();
        } else {
            errorDiv.textContent = data.mensaje || 'Error al guardar';
            errorDiv.style.display = 'block';
        }
    });
}

function eliminarPermiso(id) {
    if (!confirm('¿Seguro que querés eliminar este permiso?')) { return; }

    fetch(BASE_URL + '/permisos/' + id, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(function() { cargarPermisos(); });
}

// =====================
// VENCIMIENTOS
// =====================
function cargarVencimientos() {
    fetch(BASE_URL + '/permisos/vencimientos', { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {

        document.getElementById('conteoVencidos').textContent = data.resumen.vencidos;
        document.getElementById('conteoPorVencer').textContent = data.resumen.porVencer;

        var listaVencidos = document.getElementById('listaVencidos');
        var listaPorVencer = document.getElementById('listaPorVencer');

        if (data.vencidos.length === 0) {
            listaVencidos.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-icono">✅</div><div class="estado-vacio-texto">Sin permisos vencidos</div></div>';
        } else {
            var html = '';
            data.vencidos.forEach(function(permiso) {
                var cliente = permiso.proyecto && permiso.proyecto.cliente ? permiso.proyecto.cliente.razonSocial : '-';
                var proyecto = permiso.proyecto ? permiso.proyecto.nombre : '-';
                html += '<div class="alerta-item">';
                html += '<div class="alerta-icono">🚨</div>';
                html += '<div>';
                html += '<div class="alerta-nombre">' + permiso.nombre + ' — ' + permiso.numero + '</div>';
                html += '<div class="alerta-detalle">Cliente: ' + cliente + ' | Proyecto: ' + proyecto + ' | Venció: ' + formatearFecha(permiso.fechaVencimiento) + '</div>';
                html += '</div>';
                html += '<div style="margin-left:auto;">' + badgeEstado(permiso.estado) + '</div>';
                html += '</div>';
            });
            listaVencidos.innerHTML = html;
        }

        if (data.porVencer.length === 0) {
            listaPorVencer.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-icono">✅</div><div class="estado-vacio-texto">Sin vencimientos próximos</div></div>';
        } else {
            var html2 = '';
            data.porVencer.forEach(function(permiso) {
                var cliente = permiso.proyecto && permiso.proyecto.cliente ? permiso.proyecto.cliente.razonSocial : '-';
                var proyecto = permiso.proyecto ? permiso.proyecto.nombre : '-';
                html2 += '<div class="alerta-item">';
                html2 += '<div class="alerta-icono">⏳</div>';
                html2 += '<div>';
                html2 += '<div class="alerta-nombre">' + permiso.nombre + ' — ' + permiso.numero + '</div>';
                html2 += '<div class="alerta-detalle">Cliente: ' + cliente + ' | Proyecto: ' + proyecto + ' | Vence: ' + formatearFecha(permiso.fechaVencimiento) + '</div>';
                html2 += '</div>';
                html2 += '<div style="margin-left:auto;">' + badgeEstado(permiso.estado) + '</div>';
                html2 += '</div>';
            });
            listaPorVencer.innerHTML = html2;
        }
    });
}

// =====================
// EDITAR CLIENTE
// =====================
function irEditarCliente(id) {
    fetch(BASE_URL + '/clientes/' + id, { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var c = data.cliente;
        document.getElementById('editarClienteId').value = c._id;
        document.getElementById('editarClienteRazonSocial').value = c.razonSocial;
        document.getElementById('editarClienteEmail').value = c.email;
        document.getElementById('editarClienteTelefono').value = c.telefono || '';
        document.getElementById('editarClienteDireccion').value = c.direccion || '';
        document.getElementById('editarClienteSector').value = c.sector;
        document.getElementById('editarClienteError').style.display = 'none';
        document.getElementById('editarClienteExito').style.display = 'none';
        mostrarPagina('editarCliente');
    });
}

function actualizarCliente() {
    var id = document.getElementById('editarClienteId').value;
    var errorDiv = document.getElementById('editarClienteError');
    var exitoDiv = document.getElementById('editarClienteExito');

    errorDiv.style.display = 'none';
    exitoDiv.style.display = 'none';

    var body = {
        razonSocial: document.getElementById('editarClienteRazonSocial').value,
        email: document.getElementById('editarClienteEmail').value,
        telefono: document.getElementById('editarClienteTelefono').value,
        direccion: document.getElementById('editarClienteDireccion').value,
        sector: document.getElementById('editarClienteSector').value
    };

    fetch(BASE_URL + '/clientes/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.cliente) {
            exitoDiv.textContent = 'Cliente actualizado correctamente';
            exitoDiv.style.display = 'block';
            setTimeout(function() { mostrarPagina('clientes'); }, 1500);
        } else {
            errorDiv.textContent = data.mensaje || 'Error al actualizar';
            errorDiv.style.display = 'block';
        }
    });
}

// =====================
// EDITAR PROYECTO
// =====================
function irEditarProyecto(id) {
    fetch(BASE_URL + '/proyectos/' + id, { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var p = data.proyecto;
        document.getElementById('editarProyectoId').value = p._id;
        document.getElementById('editarProyectoNombre').value = p.nombre;
        document.getElementById('editarProyectoDescripcion').value = p.descripcion || '';
        document.getElementById('editarProyectoTipo').value = p.tipoProyecto;
        document.getElementById('editarProyectoEstado').value = p.estado;
        document.getElementById('editarProyectoFechaInicio').value = p.fechaInicio ? p.fechaInicio.substring(0, 10) : '';
        document.getElementById('editarProyectoFechaFin').value = p.fechaFin ? p.fechaFin.substring(0, 10) : '';
        document.getElementById('editarProyectoError').style.display = 'none';
        document.getElementById('editarProyectoExito').style.display = 'none';
        mostrarPagina('editarProyecto');
    });
}

function actualizarProyecto() {
    var id = document.getElementById('editarProyectoId').value;
    var errorDiv = document.getElementById('editarProyectoError');
    var exitoDiv = document.getElementById('editarProyectoExito');

    errorDiv.style.display = 'none';
    exitoDiv.style.display = 'none';

    var body = {
        nombre: document.getElementById('editarProyectoNombre').value,
        descripcion: document.getElementById('editarProyectoDescripcion').value,
        tipoProyecto: document.getElementById('editarProyectoTipo').value,
        estado: document.getElementById('editarProyectoEstado').value,
        fechaInicio: document.getElementById('editarProyectoFechaInicio').value,
        fechaFin: document.getElementById('editarProyectoFechaFin').value
    };

    fetch(BASE_URL + '/proyectos/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.proyecto) {
            exitoDiv.textContent = 'Proyecto actualizado correctamente';
            exitoDiv.style.display = 'block';
            setTimeout(function() { mostrarPagina('proyectos'); }, 1500);
        } else {
            errorDiv.textContent = data.mensaje || 'Error al actualizar';
            errorDiv.style.display = 'block';
        }
    });
}

// =====================
// EDITAR PERMISO
// =====================
function irEditarPermiso(id) {
    fetch(BASE_URL + '/permisos/' + id, { headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var p = data.permiso;
        document.getElementById('editarPermisoId').value = p._id;
        document.getElementById('editarPermisoNombre').value = p.nombre;
        document.getElementById('editarPermisoTipo').value = p.tipoPermiso;
        document.getElementById('editarPermisoEstado').value = p.estado;
        document.getElementById('editarPermisoFechaVencimiento').value = p.fechaVencimiento ? p.fechaVencimiento.substring(0, 10) : '';
        document.getElementById('editarPermisoDiasAlerta').value = p.diasAlerta;
        document.getElementById('editarPermisoObservaciones').value = p.observaciones || '';
        document.getElementById('editarPermisoError').style.display = 'none';
        document.getElementById('editarPermisoExito').style.display = 'none';
        mostrarPagina('editarPermiso');
    });
}

function actualizarPermiso() {
    var id = document.getElementById('editarPermisoId').value;
    var errorDiv = document.getElementById('editarPermisoError');
    var exitoDiv = document.getElementById('editarPermisoExito');

    errorDiv.style.display = 'none';
    exitoDiv.style.display = 'none';

    var body = {
        nombre: document.getElementById('editarPermisoNombre').value,
        tipoPermiso: document.getElementById('editarPermisoTipo').value,
        estado: document.getElementById('editarPermisoEstado').value,
        fechaVencimiento: document.getElementById('editarPermisoFechaVencimiento').value,
        diasAlerta: document.getElementById('editarPermisoDiasAlerta').value,
        observaciones: document.getElementById('editarPermisoObservaciones').value
    };

    fetch(BASE_URL + '/permisos/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.permiso) {
            exitoDiv.textContent = 'Permiso actualizado correctamente';
            exitoDiv.style.display = 'block';
            setTimeout(function() { mostrarPagina('permisos'); }, 1500);
        } else {
            errorDiv.textContent = data.mensaje || 'Error al actualizar';
            errorDiv.style.display = 'block';
        }
    });
}

// =====================
// MODAL
// =====================
function cerrarModal(id) {
    document.getElementById(id).classList.remove('abierto');
}

// Cerrar modal clickeando fuera
document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('abierto');
        }
    });
});

// Enter para login
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') {
        iniciarSesion();
    }
});
