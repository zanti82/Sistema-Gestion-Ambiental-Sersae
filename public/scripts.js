
// =====================
// ESTADO GLOBAL
// =====================
var usuarioActual = null;
var BASE_URL = '/api';

// =====================
// INICIALIZACIÓN
// =====================
window.onload = function() {

    // Remove the old copies that earlier versions saved
    localStorage.removeItem('sersae_token');
    localStorage.removeItem('sersae_usuario');

    // Ask the server who we are. The browser sends the httpOnly cookie by itself
    fetch(BASE_URL + '/profile')
    .then(function(respuesta) {

        // Not 200 means no valid cookie: the login page stays visible
        if (respuesta.status !== 200) {
            return null;
        }

        return respuesta.json();
    })
    .then(function(data) {

        if (data === null) {
            return;
        }

        usuarioActual = data.usuario;
        mostrarApp();
    })
    .catch(function() {
        // No connection: the login page stays visible
    });
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
        if (data.usuario) {
            usuarioActual = data.usuario;
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
    // The server clears the cookie. JavaScript cannot do it, because it is httpOnly
    fetch(BASE_URL + '/auth/logout', { method: 'POST' })
    .then(function() {
        usuarioActual = null;
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
        servicios: 'Servicios',
        sedes: 'Sedes',
        permisos: 'Permisos Ambientales',
        vencimientos: 'Alertas de Vencimiento',
        editarCliente: 'Editar Cliente',
        editarSede: 'Editar Sede',
        editarPermiso: 'Editar Permiso',
        editarServicio: 'Editar Servicio'
    };

    document.getElementById('topbarTitulo').textContent = titulos[nombre] || nombre;

    // Solo marcamos activo en el nav si es una página principal
    var navIndex = { dashboard: 0, clientes: 1, servicios: 2, sedes: 3, permisos: 4, vencimientos: 5 };

    if (navIndex[nombre] !== undefined) {
        navItems[navIndex[nombre]].classList.add('activo');
    }

    if (nombre === 'clientes') { cargarClientes(); }
    if (nombre === 'sedes') { cargarSedes(); }
    if (nombre === 'permisos') { cargarPermisos(); }
    if (nombre === 'vencimientos') { cargarVencimientos(); }
    if (nombre === 'dashboard') { cargarDashboard(); }
    if (nombre === 'servicios') { cargarServicios(); }


}

function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// =====================
// HELPERS
// =====================
function getHeaders() {
    // No Authorization header: the browser sends the cookie by itself
    return { 'Content-Type': 'application/json' };
}

// Devuelve texto vacío si el valor viene nulo, para no escribir "null" dentro de un input
function valorInput(valor) {

    // null: el campo nunca se llenó en la base
    if (valor === null) {
        return '';
    }

    // undefined: el campo no vino en la respuesta
    if (valor === undefined) {
        return '';
    }

    // Si tiene contenido, lo devolvemos tal cual
    return valor;
}

function formatearFecha(fechaStr) {
    if (fechaStr === null || fechaStr === undefined) { return '-'; }
    var fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

// Devuelve un guion si el valor viene vacío, para no mostrar "null" en pantalla
function textoSeguro(valor) {

    // null significa que el campo nunca se llenó
    if (valor === null) {
        return '-';
    }

    // undefined significa que el campo ni siquiera vino en la respuesta
    if (valor === undefined) {
        return '-';
    }

    // Un texto vacío tampoco aporta nada para mostrar
    if (valor === '') {
        return '-';
    }

    // Si tiene contenido real, lo devolvemos tal cual
    return valor;
}

// Traduce el valor guardado en la base al texto que ve el usuario
var ETIQUETAS_TIPO_SERVICIO = {
    diagnostico: 'Diagnóstico',
    tramite: 'Trámite',
    sostenibilidad: 'Sostenibilidad',
    accion_climatica: 'Acción climática'
};

// Convierte un número en pesos colombianos, por ejemplo 2600000 en $ 2.600.000
function formatearDinero(valor) {
    var numero = Number(valor);
    return numero.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });
}

// El total no se guarda en la base: se calcula restando el descuento al precio
function calcularTotal(precio, descuento) {
    var precioNumero = Number(precio);
    var descuentoNumero = Number(descuento);
    var total = precioNumero - descuentoNumero;
    return total;
}

// Badge del estado de la propuesta: reutiliza los colores que ya existen
function badgePropuesta(estado) {
    var clases = {
        pendiente: 'badge-por-vencer',
        aprobada: 'badge-vigente',
        rechazada: 'badge-vencido'
    };
    var etiquetas = {
        pendiente: 'Pendiente',
        aprobada: 'Aprobada',
        rechazada: 'Rechazada'
    };
    var clase = clases[estado] || 'badge-neutro';
    var etiqueta = etiquetas[estado] || estado;
    return escaparHtml(valor);
}

// Badge del estado de ejecución del trabajo
function badgeEjecucion(estado) {
    var clases = {
        sin_iniciar: 'badge-neutro',
        en_curso: 'badge-renovado',
        ejecutado: 'badge-vigente',
        pausado: 'badge-por-vencer'
    };
    var etiquetas = {
        sin_iniciar: 'Sin iniciar',
        en_curso: 'En curso',
        ejecutado: 'Ejecutado',
        pausado: 'Pausado'
    };
    var clase = clases[estado] || 'badge-neutro';
    var etiqueta = etiquetas[estado] || estado;
    return '<span class="badge ' + clase + '">' + etiqueta + '</span>';
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
// Lee un input numérico y devuelve un número; si está vacío devuelve 0
function leerNumeroCampo(idCampo) {

    var texto = document.getElementById(idCampo).value;

    // Un input vacío entrega '', y Number('') sería 0, pero lo dejamos explícito
    if (texto === '') {
        return 0;
    }

    return Number(texto);
}

// Builds "Client — Sede — Trámite" from a populated service
function describirServicio(servicio) {

    if (servicio === null || servicio === undefined) {
        return '-';
    }

    var partes = [];

    if (servicio.sede !== null && servicio.sede !== undefined) {

        if (servicio.sede.cliente !== null && servicio.sede.cliente !== undefined) {
            partes.push(servicio.sede.cliente.razonSocial);
        }

        partes.push(servicio.sede.nombre);
    }

    if (servicio.tipoTramite !== null && servicio.tipoTramite !== undefined) {
        partes.push(servicio.tipoTramite.nombre);
    }

    if (partes.length === 0) {
        return '-';
    }

    return partes.join(' — ');
}

// Returns 'vencimiento' or 'plazo' for a permit. We use 'vencimiento' if the data is missing
function leerTipoFecha(permiso) {

    if (permiso.servicio === null || permiso.servicio === undefined) {
        return 'vencimiento';
    }

    if (permiso.servicio.tipoTramite === null || permiso.servicio.tipoTramite === undefined) {
        return 'vencimiento';
    }

    return permiso.servicio.tipoTramite.tipoFecha;
}

// Cuts a date from the API ("2026-11-01T00:00:00.000Z") to the "2026-11-01" that a date input needs
function fechaParaInput(valor) {

    if (valor === null || valor === undefined) {
        return '';
    }

    return String(valor).substring(0, 10);
}

// "hace 3 días", "hoy", "en 5 días": how far the date is from today
function textoDias(fechaVencimiento) {

    var hoy = new Date();
    var vencimiento = new Date(fechaVencimiento);

    // Same calculation as the backend: milliseconds to days, rounded up
    var dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (dias < 0) {
        var diasPasados = Math.abs(dias);

        if (diasPasados === 1) {
            return 'hace 1 día';
        }

        return 'hace ' + diasPasados + ' días';
    }

    if (dias === 0) {
        return 'hoy';
    }

    if (dias === 1) {
        return 'en 1 día';
    }

    return 'en ' + dias + ' días';
}

// Builds the HTML of ONE alert. Dashboard and Vencimientos both use it
function armarItemAlerta(permiso) {

    // The icon follows the calculated state, not the saved one
    var icono = '⏳';

    if (permiso.estadoActual === 'vencido') {
        icono = '🚨';
    }

    // A deadline says "Plazo", a permit says "Vence"
    var etiquetaFecha = 'Vence: ';

    if (leerTipoFecha(permiso) === 'plazo') {
        etiquetaFecha = 'Plazo: ';
    }

    // Deadlines have no number, so we add it only when it exists
    var textoNumero = '';

    if (permiso.numero !== null && permiso.numero !== undefined) {
        textoNumero = ' — ' + permiso.numero;
    }

    var html = '';
    html += '<div class="alerta-item">';
    html += '<div class="alerta-icono">' + icono + '</div>';
    html += '<div>';
    html += '<div class="alerta-nombre">' + escaparHtml(permiso.nombre) + escaparHtml(textoNumero) + '</div>';
    html += '<div class="alerta-detalle">' + escaparHtml(describirServicio(permiso.servicio)) + ' | ' + etiquetaFecha + formatearFecha(permiso.fechaVencimiento) + ' | ' + textoDias(permiso.fechaVencimiento) + '</div>';
    html += '</div>';
    html += '<div style="margin-left:auto;">' + badgeEstado(permiso.estadoActual) + '</div>';
    html += '</div>';

    return html;
}

// Changes special characters into harmless text, before we put data inside HTML
function escaparHtml(valor) {

    // Nothing to escape when there is no value
    if (valor === null) {
        return '';
    }

    if (valor === undefined) {
        return '';
    }

    // Numbers and other types become text first
    var texto = String(valor);

    // The "&" goes FIRST. If it went later, it would break the codes we already made
    texto = texto.replace(/&/g, '&amp;');
    texto = texto.replace(/</g, '&lt;');
    texto = texto.replace(/>/g, '&gt;');
    texto = texto.replace(/"/g, '&quot;');
    texto = texto.replace(/'/g, '&#39;');

    return texto;
}

// =====================
// DASHBOARD
// =====================
function cargarDashboard() {

    fetch(BASE_URL + '/clientes', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        document.getElementById('statClientes').textContent = data.total || 0;
    });

    fetch(BASE_URL + '/sedes', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        document.getElementById('statProyectos').textContent = data.total || 0;
    });

    fetch(BASE_URL + '/permisos/vencimientos', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        // If the server sent an error, there is no summary: we stop
        if (data.resumen === undefined) {
            return;
        }

        document.getElementById('statPorVencer').textContent = data.resumen.porVencer;
        document.getElementById('statVencidos').textContent = data.resumen.vencidos;

        // Show the top badge only when there are alerts. Hide it when there are none
        if (data.resumen.totalAlertas > 0) {
            document.getElementById('alertaBadge').style.display = 'inline-block';
            document.getElementById('alertaConteo').textContent = data.resumen.totalAlertas;
        } else {
            document.getElementById('alertaBadge').style.display = 'none';
        }

        // Expired first, then the ones about to expire
        var todos = data.vencidos.concat(data.porVencer);
        var contenedor = document.getElementById('dashboardAlertas');

        if (todos.length === 0) {
            contenedor.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-icono">✅</div><div class="estado-vacio-texto">Todo al día</div><div class="estado-vacio-sub">No hay permisos ni plazos que requieran atención</div></div>';
            return;
        }

        // The dashboard shows only the first 5
        var html = '';

        todos.slice(0, 5).forEach(function(permiso) {
            html += armarItemAlerta(permiso);
        });

        contenedor.innerHTML = html;
    });
}
// =====================
// CLIENTES
// =====================
function cargarClientes() {
    fetch(BASE_URL + '/clientes', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaClientes');

        // Estado vacío: ahora son 6 columnas
        if (data.clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="estado-vacio"><div class="estado-vacio-icono">🏢</div><div class="estado-vacio-texto">Sin clientes registrados</div><div class="estado-vacio-sub">Hacé click en "Nuevo cliente" para comenzar</div></div></td></tr>';
            return;
        }

        var html = '';
        data.clientes.forEach(function(cliente) {
            html += '<tr>';
            html += '<td><strong>' + escaparHtml(cliente.razonSocial) + '</strong></td>';
            html += '<td>' + escaparHtml(cliente.nit) + '</td>';
            // Los campos opcionales pasan por textoSeguro para no mostrar "null"
            html += '<td>' + textoSeguro(cliente.nombreCompleto) + '</td>';
            html += '<td>' + textoSeguro(cliente.telefono) + '</td>';
            html += '<td>' + textoSeguro(cliente.estatus) + '</td>';
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

    // Lista con los ids de todos los campos de texto del formulario
    var idsCamposTexto = [
        'clienteRazonSocial', 'clienteNit', 'clienteNombreCompleto',
        'clienteEmail', 'clienteEmail2', 'clienteTelefono', 'clienteTelefono2'
    ];

    // Recorremos la lista y vaciamos cada campo
    idsCamposTexto.forEach(function(idCampo) {
        document.getElementById(idCampo).value = '';
    });

    // Los selects vuelven a su valor inicial
    document.getElementById('clienteEstatus').value = 'potencial';

    // Ocultamos errores de intentos anteriores y abrimos el modal
    document.getElementById('clienteError').style.display = 'none';
    document.getElementById('modalCliente').classList.add('abierto');
}


function guardarCliente() {
    var errorDiv = document.getElementById('clienteError');
    errorDiv.style.display = 'none';

    // Las claves del body coinciden con lo que lee cliente.controller.js
    var body = {
        razonSocial: document.getElementById('clienteRazonSocial').value,
        nit: document.getElementById('clienteNit').value,
        nombreCompleto: document.getElementById('clienteNombreCompleto').value,
        email: document.getElementById('clienteEmail').value,
        email2: document.getElementById('clienteEmail2').value,
        telefono: document.getElementById('clienteTelefono').value,
        telefono2: document.getElementById('clienteTelefono2').value,
        estatus: document.getElementById('clienteEstatus').value,       
    };

    fetch(BASE_URL + '/clientes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
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

function irEditarCliente(id) {
    fetch(BASE_URL + '/clientes/' + id, { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        // Guardamos el cliente en una variable con nombre claro
        var cliente = data.cliente;

        // Precargamos cada campo; valorInput evita escribir "null" en los inputs
        document.getElementById('editarClienteId').value = cliente._id;
        document.getElementById('editarClienteRazonSocial').value = cliente.razonSocial;
        document.getElementById('editarClienteNit').value = cliente.nit;
        document.getElementById('editarClienteNombreCompleto').value = valorInput(cliente.nombreCompleto);
        document.getElementById('editarClienteEmail').value = cliente.email;
        document.getElementById('editarClienteEmail2').value = valorInput(cliente.email2);
        document.getElementById('editarClienteTelefono').value = valorInput(cliente.telefono);
        document.getElementById('editarClienteTelefono2').value = valorInput(cliente.telefono2);
        document.getElementById('editarClienteEstatus').value = cliente.estatus;
            

        // Limpiamos mensajes de intentos anteriores y mostramos la página
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

    // Leemos los dos campos obligatorios para validarlos antes de enviar
    var razonSocial = document.getElementById('editarClienteRazonSocial').value;
    var email = document.getElementById('editarClienteEmail').value;

    // Si alguno está vacío, el servidor respondería con un error 500; lo evitamos aquí
    if (razonSocial === '' || email === '') {
        errorDiv.textContent = 'La razón social y el email son obligatorios';
        errorDiv.style.display = 'block';
        return;
    }

    // Las claves coinciden con lo que lee cliente.controller.js (el NIT no se envía)
    var body = {
        razonSocial: razonSocial,
        nombreCompleto: document.getElementById('editarClienteNombreCompleto').value,
        email: email,
        email2: document.getElementById('editarClienteEmail2').value,
        telefono: document.getElementById('editarClienteTelefono').value,
        telefono2: document.getElementById('editarClienteTelefono2').value,
        estatus: document.getElementById('editarClienteEstatus').value,
    };

    fetch(BASE_URL + '/clientes/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
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
// SEDES
// =====================
function cargarSedes() {
    fetch(BASE_URL + '/sedes', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaSedes');

        if (data.sedes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="estado-vacio"><div class="estado-vacio-texto">Sin sedes registradas</div></div></td></tr>';
            return;
        }

        var html = '';
        data.sedes.forEach(function(sede) {

            // The client comes populated; if it is missing we show a dash
            var clienteNombre = '-';
            if (sede.cliente !== null && sede.cliente !== undefined) {
                clienteNombre = sede.cliente.razonSocial;
            }

            html += '<tr>';
            html += '<td><strong>' + escaparHtml(sede.codigo) + '</strong></td>';
            html += '<td>' + escaparHtml(sede.nombre) + '</td>';
            html += '<td>' + escaparHtml(clienteNombre) + '</td>';
            html += '<td>' + textoSeguro(sede.categoria) + '</td>';
            html += '<td>' + textoSeguro(sede.municipio) + '</td>';
            html += '<td><div class="acciones">';
            html += '<button class="btn btn-secondary btn-sm" onclick="irEditarSede(\'' + sede._id + '\')">✏️ Editar</button>';
            html += '<button class="btn btn-danger btn-sm" onclick="eliminarSede(\'' + sede._id + '\')">🗑 Eliminar</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    });
}

function abrirModalSede() {

    var idsCamposTexto = [
        'sedeNombre', 'sedeDepartamento', 'sedeMunicipio', 'sedeVereda',
        'sedeAutoridad', 'sedeCoordX', 'sedeCoordY', 'sedeCoordZ'
    ];

    idsCamposTexto.forEach(function(idCampo) {
        document.getElementById(idCampo).value = '';
    });

    document.getElementById('sedeCategoria').value = 'otro';
    document.getElementById('sedeError').style.display = 'none';

    // Fill the client select
    fetch(BASE_URL + '/clientes', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var opcionesHtml = '<option value="">Seleccioná un cliente</option>';

        data.clientes.forEach(function(cliente) {
            opcionesHtml += '<option value="' + cliente._id + '">' + escaparHtml(cliente.razonSocial) + '</option>';
        });

        document.getElementById('sedeCliente').innerHTML = opcionesHtml;
    });

    document.getElementById('modalSede').classList.add('abierto');
}

function guardarSede() {
    var errorDiv = document.getElementById('sedeError');
    errorDiv.style.display = 'none';

    var clienteId = document.getElementById('sedeCliente').value;
    var nombre = document.getElementById('sedeNombre').value;

    if (clienteId === '') {
        errorDiv.textContent = 'Seleccioná un cliente';
        errorDiv.style.display = 'block';
        return;
    }

    if (nombre === '') {
        errorDiv.textContent = 'El nombre de la sede es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    // The keys match what sede.controller.js reads
    var body = {
        clienteId: clienteId,
        nombre: nombre,
        categoria: document.getElementById('sedeCategoria').value,
        departamento: document.getElementById('sedeDepartamento').value,
        municipio: document.getElementById('sedeMunicipio').value,
        vereda: document.getElementById('sedeVereda').value,
        autoridadAmbiental: document.getElementById('sedeAutoridad').value,
        coordX: document.getElementById('sedeCoordX').value,
        coordY: document.getElementById('sedeCoordY').value,
        coordZ: document.getElementById('sedeCoordZ').value
    };

    fetch(BASE_URL + '/sedes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        if (data.sede) {
            cerrarModal('modalSede');
            cargarSedes();
        } else {
            errorDiv.textContent = data.mensaje || 'Error al guardar';
            errorDiv.style.display = 'block';
        }
    });
}

function eliminarSede(id) {
    if (!confirm('¿Seguro que querés eliminar esta sede?')) { return; }

    fetch(BASE_URL + '/sedes/' + id, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(function(respuesta) {

        // Save the status code first: 200 = deleted, 409 = has active services
        var codigoEstado = respuesta.status;

        return respuesta.json().then(function(data) {

            // Show the server message when the delete was not allowed
            if (codigoEstado !== 200) {
                alert(data.mensaje);
            }

            cargarSedes();
        });
    });
}

function irEditarSede(id) {
    fetch(BASE_URL + '/sedes/' + id, { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var sede = data.sede;

        var clienteNombre = '-';
        if (sede.cliente !== null && sede.cliente !== undefined) {
            clienteNombre = sede.cliente.razonSocial;
        }

        // Read-only fields
        document.getElementById('editarSedeCodigo').value = sede.codigo;
        document.getElementById('editarSedeCliente').value = clienteNombre;

        // Editable fields
        document.getElementById('editarSedeId').value = sede._id;
        document.getElementById('editarSedeNombre').value = sede.nombre;
        document.getElementById('editarSedeCategoria').value = sede.categoria;
        document.getElementById('editarSedeDepartamento').value = valorInput(sede.departamento);
        document.getElementById('editarSedeMunicipio').value = valorInput(sede.municipio);
        document.getElementById('editarSedeVereda').value = valorInput(sede.vereda);
        document.getElementById('editarSedeAutoridad').value = valorInput(sede.autoridadAmbiental);

        // Coordinates come nested
        var coordX = '';
        var coordY = '';
        var coordZ = '';

        if (sede.coordenadas !== undefined && sede.coordenadas !== null) {
            coordX = valorInput(sede.coordenadas.x);
            coordY = valorInput(sede.coordenadas.y);
            coordZ = valorInput(sede.coordenadas.z);
        }

        document.getElementById('editarSedeCoordX').value = coordX;
        document.getElementById('editarSedeCoordY').value = coordY;
        document.getElementById('editarSedeCoordZ').value = coordZ;

        document.getElementById('editarSedeError').style.display = 'none';
        document.getElementById('editarSedeExito').style.display = 'none';
        mostrarPagina('editarSede');
    });
}

function actualizarSede() {
    var id = document.getElementById('editarSedeId').value;
    var errorDiv = document.getElementById('editarSedeError');
    var exitoDiv = document.getElementById('editarSedeExito');

    errorDiv.style.display = 'none';
    exitoDiv.style.display = 'none';

    var nombre = document.getElementById('editarSedeNombre').value;

    if (nombre === '') {
        errorDiv.textContent = 'El nombre de la sede es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    // The client and the code are not sent: they cannot change
    var body = {
        nombre: nombre,
        categoria: document.getElementById('editarSedeCategoria').value,
        departamento: document.getElementById('editarSedeDepartamento').value,
        municipio: document.getElementById('editarSedeMunicipio').value,
        vereda: document.getElementById('editarSedeVereda').value,
        autoridadAmbiental: document.getElementById('editarSedeAutoridad').value,
        coordX: document.getElementById('editarSedeCoordX').value,
        coordY: document.getElementById('editarSedeCoordY').value,
        coordZ: document.getElementById('editarSedeCoordZ').value
    };

    fetch(BASE_URL + '/sedes/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        if (data.sede) {
            exitoDiv.textContent = 'Sede actualizada correctamente';
            exitoDiv.style.display = 'block';
            setTimeout(function() { mostrarPagina('sedes'); }, 1500);
        } else {
            errorDiv.textContent = data.mensaje || 'Error al actualizar';
            errorDiv.style.display = 'block';
        }
    });
}
// =====================
// SERVICIOS
// =====================
function cargarServicios() {
    fetch(BASE_URL + '/servicios', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaServicios');

        // Sin servicios mostramos un mensaje en vez de una tabla vacía
        if (data.servicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="estado-vacio"><div class="estado-vacio-icono">🧾</div><div class="estado-vacio-texto">Sin servicios registrados</div></div></td></tr>';
            return;
        }

        var html = '';
        data.servicios.forEach(function(servicio) {

            // El cliente viene poblado, pero si no existe evitamos un error al leerlo
            var clienteNombre = '-';
            var sedeNombre = '-';

            if (servicio.sede !== null && servicio.sede !== undefined) {
                sedeNombre = servicio.sede.nombre;

                if (servicio.sede.cliente !== null && servicio.sede.cliente !== undefined) {
                    clienteNombre = servicio.sede.cliente.razonSocial;
                }
            }

             // For trámites we also show which trámite it is
             var textoTipo = ETIQUETAS_TIPO_SERVICIO[servicio.tipo];

             if (servicio.tipo === 'tramite' && servicio.tipoTramite !== null && servicio.tipoTramite !== undefined) {
                 textoTipo = textoTipo + ': ' + servicio.tipoTramite.nombre;
             }

            // Calculamos el total y lo formateamos como dinero
            var total = calcularTotal(servicio.precio, servicio.descuento);

            html += '<tr>';
            html += '<td>' + escaparHtml(clienteNombre) + '<br><small>' + escaparHtml(sedeNombre) + '</small></td>';
            html += '<td><strong>' + escaparHtml(servicio.nombre) + '</strong></td>';
            html += '<td>' + escaparHtml(textoTipo) + '</td>';
            html += '<td>' + formatearDinero(total) + '</td>';
            html += '<td>' + badgePropuesta(servicio.estadoPropuesta) + '</td>';
            html += '<td>' + badgeEjecucion(servicio.estadoEjecucion) + '</td>';
            html += '<td><div class="acciones">';
            html += '<button class="btn btn-secondary btn-sm" onclick="irEditarServicio(\'' + servicio._id + '\')">✏️ Editar</button>';
            html += '<button class="btn btn-danger btn-sm" onclick="eliminarServicio(\'' + servicio._id + '\')">🗑 Eliminar</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    });
}

function eliminarServicio(id) {
    // Pedimos confirmación antes de borrar
    if (!confirm('¿Seguro que querés eliminar este servicio?')) { return; }

    fetch(BASE_URL + '/servicios/' + id, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(function() { cargarServicios(); });
}

// Regla general: muestra el campo de motivo solo si la propuesta está rechazada.
// Recibe los ids como parámetros para servir tanto al modal como a la página de editar
function aplicarReglaMotivo(idSelectEstado, idGrupo, idInputMotivo) {

    // Leemos qué opción está seleccionada
    var estadoSeleccionado = document.getElementById(idSelectEstado).value;
    var grupoMotivo = document.getElementById(idGrupo);

    if (estadoSeleccionado === 'rechazada') {
        grupoMotivo.style.display = 'flex';
    } else {
        // Ocultamos y borramos lo escrito para no guardar un motivo contradictorio
        grupoMotivo.style.display = 'none';
        document.getElementById(idInputMotivo).value = '';
    }
}

// Versión para el modal de crear (el HTML del modal no cambia, sigue llamando a esta)
function alternarMotivoRechazo() {
    aplicarReglaMotivo('servicioEstadoPropuesta', 'grupoMotivoRechazo', 'servicioMotivoRechazo');
}

// Versión para la página de editar
function alternarMotivoRechazoEditar() {
    aplicarReglaMotivo('editarServicioEstadoPropuesta', 'editarGrupoMotivoRechazo', 'editarServicioMotivoRechazo');
}

function abrirModalServicio() {

    var idsCamposTexto = [
        'servicioNombre', 'servicioDescripcion', 'servicioLink',
        'servicioPrecio', 'servicioAcuerdoPago', 'servicioMotivoRechazo'
    ];

    idsCamposTexto.forEach(function(idCampo) {
        document.getElementById(idCampo).value = '';
    });

    document.getElementById('servicioDescuento').value = '0';
    document.getElementById('servicioTipo').value = '';
    document.getElementById('servicioEstadoPropuesta').value = 'pendiente';
    document.getElementById('servicioEstadoEjecucion').value = 'sin_iniciar';

    // Apply both visibility rules so the hidden groups start hidden
    alternarMotivoRechazo();
    alternarTipoTramite();

    document.getElementById('servicioError').style.display = 'none';

    // List 1: sedes. The text shows code, sede name and client name
    fetch(BASE_URL + '/sedes', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var opcionesHtml = '<option value="">Seleccioná una sede</option>';

        data.sedes.forEach(function(sede) {

            var clienteNombre = '-';
            if (sede.cliente !== null && sede.cliente !== undefined) {
                clienteNombre = sede.cliente.razonSocial;
            }

            opcionesHtml += '<option value="' + sede._id + '">' + escaparHtml(sede.codigo) + ' — ' + escaparHtml(sede.nombre) + ' (' + escaparHtml(clienteNombre) + ')</option>';
        });

        document.getElementById('servicioSede').innerHTML = opcionesHtml;
    });

    // List 2: trámite types from the catalog
    fetch(BASE_URL + '/tipos-tramite', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var opcionesTipos = '<option value="">Seleccioná un trámite</option>';

        data.tipos.forEach(function(tipo) {
            opcionesTipos += '<option value="' + tipo._id + '">' + escaparHtml(tipo.nombre) + '</option>';
        });

        document.getElementById('servicioTipoTramite').innerHTML = opcionesTipos;
    });

    document.getElementById('modalServicio').classList.add('abierto');
}

function guardarServicio() {
    var errorDiv = document.getElementById('servicioError');
    errorDiv.style.display = 'none';

    // Leemos los valores del formulario
    var sedeId = document.getElementById('servicioSede').value;
    var tipoTramiteId = document.getElementById('servicioTipoTramite').value;
    var tipo = document.getElementById('servicioTipo').value;
    var nombre = document.getElementById('servicioNombre').value;
    var estadoPropuesta = document.getElementById('servicioEstadoPropuesta').value;
    var motivoRechazo = document.getElementById('servicioMotivoRechazo').value;

    // Un input numérico siempre entrega texto; un campo vacío lo tratamos como 0
    var precio = 0;
    var textoPrecio = document.getElementById('servicioPrecio').value;
    if (textoPrecio !== '') {
        precio = Number(textoPrecio);
    }

    var descuento = 0;
    var textoDescuento = document.getElementById('servicioDescuento').value;
    if (textoDescuento !== '') {
        descuento = Number(textoDescuento);
    }

    // Validaciones antes de enviar al servidor
    if (sedeId === '') {
        errorDiv.textContent = 'Seleccioná una sede';
        errorDiv.style.display = 'block';
        return;
    }

    if (tipo === 'tramite' && tipoTramiteId === '') {
        errorDiv.textContent = 'Seleccioná el tipo de trámite';
        errorDiv.style.display = 'block';
        return;
    }

    if (tipo === '') {
        errorDiv.textContent = 'Seleccioná el tipo de servicio';
        errorDiv.style.display = 'block';
        return;
    }

    if (nombre === '') {
        errorDiv.textContent = 'El nombre del servicio es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    if (precio < 0 || descuento < 0) {
        errorDiv.textContent = 'El precio y el descuento no pueden ser negativos';
        errorDiv.style.display = 'block';
        return;
    }

    // Un descuento mayor al precio dejaría un total negativo
    if (descuento > precio) {
        errorDiv.textContent = 'El descuento no puede ser mayor que el precio';
        errorDiv.style.display = 'block';
        return;
    }

    if (estadoPropuesta === 'rechazada' && motivoRechazo === '') {
        errorDiv.textContent = 'Indicá el motivo del rechazo';
        errorDiv.style.display = 'block';
        return;
    }

    // Las claves coinciden con las que lee servicio.controller.js
    var body = {
        sedeId: sedeId,
        tipoTramiteId: tipoTramiteId,
        tipo: tipo,
        nombre: nombre,
        descripcion: document.getElementById('servicioDescripcion').value,
        linkPropuesta: document.getElementById('servicioLink').value,
        precio: precio,
        descuento: descuento,
        acuerdoPago: document.getElementById('servicioAcuerdoPago').value,
        estadoPropuesta: estadoPropuesta,
        estadoEjecucion: document.getElementById('servicioEstadoEjecucion').value,
        motivoRechazo: motivoRechazo
    };

    fetch(BASE_URL + '/servicios', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        if (data.servicio) {
            cerrarModal('modalServicio');
            cargarServicios();
        } else {
            errorDiv.textContent = data.mensaje || 'Error al guardar';
            errorDiv.style.display = 'block';
        }
    });
}

function irEditarServicio(id) {
    fetch(BASE_URL + '/servicios/' + id, { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var servicio = data.servicio;

        if (data.servicio === undefined) {
            // Shows both "mensaje" and the real "error" from the server
            alert(JSON.stringify(data));
            return;
        }

        // Text "Client — Sede" for the locked field
        var textoSede = '-';

        if (servicio.sede !== null && servicio.sede !== undefined) {
            textoSede = servicio.sede.nombre;

            if (servicio.sede.cliente !== null && servicio.sede.cliente !== undefined) {
                textoSede = servicio.sede.cliente.razonSocial + ' — ' + servicio.sede.nombre;
            }
        }

        var textoTipo = ETIQUETAS_TIPO_SERVICIO[servicio.tipo];

        if (servicio.tipo === 'tramite' && servicio.tipoTramite !== null && servicio.tipoTramite !== undefined) {
            textoTipo = textoTipo + ' — ' + servicio.tipoTramite.nombre;
        }

        document.getElementById('editarServicioCliente').value = textoSede;
        document.getElementById('editarServicioTipo').value = textoTipo;

        // Campos editables; valorInput evita escribir "null" en los inputs
        document.getElementById('editarServicioId').value = servicio._id;
        document.getElementById('editarServicioNombre').value = servicio.nombre;
        document.getElementById('editarServicioDescripcion').value = valorInput(servicio.descripcion);
        document.getElementById('editarServicioLink').value = valorInput(servicio.linkPropuesta);
        document.getElementById('editarServicioPrecio').value = valorInput(servicio.precio);
        document.getElementById('editarServicioDescuento').value = valorInput(servicio.descuento);
        document.getElementById('editarServicioAcuerdoPago').value = valorInput(servicio.acuerdoPago);
        document.getElementById('editarServicioEstadoPropuesta').value = servicio.estadoPropuesta;
        document.getElementById('editarServicioEstadoEjecucion').value = servicio.estadoEjecucion;
        document.getElementById('editarServicioMotivoRechazo').value = valorInput(servicio.motivoRechazo);

        // Aplicamos la regla DESPUÉS de cargar los valores: si está rechazada, muestra el motivo ya cargado
        alternarMotivoRechazoEditar();

        // Limpiamos mensajes de intentos anteriores y mostramos la página
        document.getElementById('editarServicioError').style.display = 'none';
        document.getElementById('editarServicioExito').style.display = 'none';
        mostrarPagina('editarServicio');
    });
}

function actualizarServicio() {
    var id = document.getElementById('editarServicioId').value;
    var errorDiv = document.getElementById('editarServicioError');
    var exitoDiv = document.getElementById('editarServicioExito');

    errorDiv.style.display = 'none';
    exitoDiv.style.display = 'none';

    // Leemos los valores a validar
    var nombre = document.getElementById('editarServicioNombre').value;
    var estadoPropuesta = document.getElementById('editarServicioEstadoPropuesta').value;
    var motivoRechazo = document.getElementById('editarServicioMotivoRechazo').value;
    var precio = leerNumeroCampo('editarServicioPrecio');
    var descuento = leerNumeroCampo('editarServicioDescuento');

    // Mismas validaciones que el modal de crear
    if (nombre === '') {
        errorDiv.textContent = 'El nombre del servicio es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    if (precio < 0 || descuento < 0) {
        errorDiv.textContent = 'El precio y el descuento no pueden ser negativos';
        errorDiv.style.display = 'block';
        return;
    }

    if (descuento > precio) {
        errorDiv.textContent = 'El descuento no puede ser mayor que el precio';
        errorDiv.style.display = 'block';
        return;
    }

    if (estadoPropuesta === 'rechazada' && motivoRechazo === '') {
        errorDiv.textContent = 'Indicá el motivo del rechazo';
        errorDiv.style.display = 'block';
        return;
    }

    // Enviamos siempre estadoPropuesta Y motivoRechazo juntos, porque el controller
    // solo procesa el motivo dentro del bloque que se activa cuando llega el estado
    var body = {
        nombre: nombre,
        descripcion: document.getElementById('editarServicioDescripcion').value,
        linkPropuesta: document.getElementById('editarServicioLink').value,
        precio: precio,
        descuento: descuento,
        acuerdoPago: document.getElementById('editarServicioAcuerdoPago').value,
        estadoPropuesta: estadoPropuesta,
        motivoRechazo: motivoRechazo,
        estadoEjecucion: document.getElementById('editarServicioEstadoEjecucion').value
    };

    fetch(BASE_URL + '/servicios/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        if (data.servicio) {
            exitoDiv.textContent = 'Servicio actualizado correctamente';
            exitoDiv.style.display = 'block';
            setTimeout(function() { mostrarPagina('servicios'); }, 1500);
        } else {
            errorDiv.textContent = data.mensaje || 'Error al actualizar';
            errorDiv.style.display = 'block';
        }
    });
}

// Show the trámite type only when the service type is "tramite"
function alternarTipoTramite() {

    var tipoSeleccionado = document.getElementById('servicioTipo').value;
    var grupoTramite = document.getElementById('grupoTipoTramite');

    if (tipoSeleccionado === 'tramite') {
        grupoTramite.style.display = 'flex';
    } else {
        // Hide it and clear the value, so we do not send a trámite type by mistake
        grupoTramite.style.display = 'none';
        document.getElementById('servicioTipoTramite').value = '';
    }
}



// =====================
// PERMISOS
// =====================

// Shows or hides number and emission date, and changes the date label
function aplicarReglaTipoFecha(tipoFecha, idGrupoNumero, idGrupoEmision, idEtiqueta) {

    var grupoNumero = document.getElementById(idGrupoNumero);
    var grupoEmision = document.getElementById(idGrupoEmision);
    var etiqueta = document.getElementById(idEtiqueta);

    if (tipoFecha === 'vencimiento') {
        grupoNumero.style.display = 'flex';
        grupoEmision.style.display = 'flex';
        etiqueta.textContent = 'Fecha de vencimiento del permiso';
    } else if (tipoFecha === 'plazo') {
        grupoNumero.style.display = 'none';
        grupoEmision.style.display = 'none';
        etiqueta.textContent = 'Plazo (fecha límite)';
    } else {
        // Nothing selected yet
        grupoNumero.style.display = 'none';
        grupoEmision.style.display = 'none';
        etiqueta.textContent = 'Fecha de vencimiento';
    }
}

// Runs when the user changes the service in the modal
function alternarCamposPermiso() {

    var selectServicio = document.getElementById('permisoServicio');
    var opcionSeleccionada = selectServicio.options[selectServicio.selectedIndex];

    // The placeholder option has no attribute, so this is null
    var tipoFecha = opcionSeleccionada.getAttribute('data-tipofecha');

    aplicarReglaTipoFecha(tipoFecha, 'grupoPermisoNumero', 'grupoPermisoEmision', 'etiquetaPermisoFecha');

    // For deadlines we clear the hidden fields, so we never send them by mistake
    if (tipoFecha !== 'vencimiento') {
        document.getElementById('permisoNumero').value = '';
        document.getElementById('permisoFechaEmision').value = '';
    }
}

function cargarPermisos() {
    fetch(BASE_URL + '/permisos', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        var tbody = document.getElementById('tablaPermisos');

        if (data.permisos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="estado-vacio"><div class="estado-vacio-texto">Sin permisos ni plazos registrados</div></div></td></tr>';
            return;
        }

        var html = '';
        data.permisos.forEach(function(permiso) {

            // A deadline says "Plazo", a permit says "Vence"
            var etiquetaFecha = 'Vence: ';

            if (leerTipoFecha(permiso) === 'plazo') {
                etiquetaFecha = 'Plazo: ';
            }

            html += '<tr>';
            html += '<td><strong>' + textoSeguro(permiso.numero) + '</strong></td>';
            html += '<td>' + escaparHtml(permiso.nombre) + '</td>';
            html += '<td>' + escaparHtml(describirServicio(permiso.servicio)) + '</td>';
            html += '<td>' + etiquetaFecha + formatearFecha(permiso.fechaVencimiento) + '</td>';
            // estadoActual is calculated from the date. "estado" can be old
            html += '<td>' + badgeEstado(permiso.estadoActual) + '</td>';
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

    var idsCamposTexto = [
        'permisoNombre', 'permisoNumero', 'permisoFechaEmision',
        'permisoFechaVencimiento', 'permisoObservaciones'
    ];

    idsCamposTexto.forEach(function(idCampo) {
        document.getElementById(idCampo).value = '';
    });

    document.getElementById('permisoDiasAlerta').value = '30';
    document.getElementById('permisoError').style.display = 'none';

    // Only services of type trámite can have permits or deadlines
    fetch(BASE_URL + '/servicios?tipo=tramite', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var opcionesHtml = '<option value="">Seleccioná un servicio</option>';

        data.servicios.forEach(function(servicio) {

            // We need the trámite type to know the kind of date
            if (servicio.tipoTramite !== null && servicio.tipoTramite !== undefined) {
                opcionesHtml += '<option value="' + servicio._id + '" data-tipofecha="' + escaparHtml(servicio.tipoTramite.tipoFecha) + '">' + escaparHtml(describirServicio(servicio)) + '</option>';
            }
        });

        document.getElementById('permisoServicio').innerHTML = opcionesHtml;

        // Apply the rule now, so the hidden groups start hidden
        alternarCamposPermiso();
    });

    document.getElementById('modalPermiso').classList.add('abierto');
}

function guardarPermiso() {
    var errorDiv = document.getElementById('permisoError');
    errorDiv.style.display = 'none';

    var servicioId = document.getElementById('permisoServicio').value;
    var nombre = document.getElementById('permisoNombre').value;
    var fechaVencimiento = document.getElementById('permisoFechaVencimiento').value;
    var diasAlerta = leerNumeroCampo('permisoDiasAlerta');

    // The group is visible only for permits, so this tells us the kind
    var esPermiso = document.getElementById('grupoPermisoNumero').style.display === 'flex';

    var numero = document.getElementById('permisoNumero').value;
    var fechaEmision = document.getElementById('permisoFechaEmision').value;

    if (servicioId === '') {
        errorDiv.textContent = 'Seleccioná un servicio';
        errorDiv.style.display = 'block';
        return;
    }

    if (nombre === '') {
        errorDiv.textContent = 'El nombre es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    if (fechaVencimiento === '') {
        errorDiv.textContent = 'La fecha de vencimiento o plazo es obligatoria';
        errorDiv.style.display = 'block';
        return;
    }

    if (diasAlerta < 1) {
        errorDiv.textContent = 'Los días de alerta deben ser 1 o más';
        errorDiv.style.display = 'block';
        return;
    }

    if (esPermiso === true) {

        if (numero === '' || fechaEmision === '') {
            errorDiv.textContent = 'El número y la fecha de emisión son obligatorios en un permiso';
            errorDiv.style.display = 'block';
            return;
        }

        if (new Date(fechaVencimiento) < new Date(fechaEmision)) {
            errorDiv.textContent = 'El vencimiento no puede ser anterior a la emisión';
            errorDiv.style.display = 'block';
            return;
        }
    }

    var body = {
        servicioId: servicioId,
        nombre: nombre,
        fechaVencimiento: fechaVencimiento,
        diasAlerta: diasAlerta,
        observaciones: document.getElementById('permisoObservaciones').value
    };

    // Number and emission date go only with permits
    if (esPermiso === true) {
        body.numero = numero;
        body.fechaEmision = fechaEmision;
    }

    fetch(BASE_URL + '/permisos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
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
    if (!confirm('¿Seguro que querés eliminar este registro?')) { return; }

    fetch(BASE_URL + '/permisos/' + id, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(function() { cargarPermisos(); });
}

function irEditarPermiso(id) {
    fetch(BASE_URL + '/permisos/' + id, { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        var permiso = data.permiso;
        var tipoFecha = leerTipoFecha(permiso);

        if (data.permiso === undefined) {
            alert(JSON.stringify(data));
            return;
        }

        // Read-only text and a hidden copy of the kind, to use when we save
        document.getElementById('editarPermisoServicio').value = describirServicio(permiso.servicio);
        document.getElementById('editarPermisoTipoFecha').value = tipoFecha;

        document.getElementById('editarPermisoId').value = permiso._id;
        document.getElementById('editarPermisoNombre').value = permiso.nombre;
        document.getElementById('editarPermisoNumero').value = valorInput(permiso.numero);
        document.getElementById('editarPermisoFechaEmision').value = fechaParaInput(permiso.fechaEmision);
        document.getElementById('editarPermisoFechaVencimiento').value = fechaParaInput(permiso.fechaVencimiento);
        document.getElementById('editarPermisoDiasAlerta').value = permiso.diasAlerta;
        document.getElementById('editarPermisoObservaciones').value = valorInput(permiso.observaciones);

        // Once renewed it cannot be changed back, so we lock the checkbox
        var estaRenovado = permiso.estado === 'renovado';
        document.getElementById('editarPermisoRenovado').checked = estaRenovado;
        document.getElementById('editarPermisoRenovado').disabled = estaRenovado;

        // Apply the rule AFTER we load the values
        aplicarReglaTipoFecha(tipoFecha, 'editarGrupoPermisoNumero', 'editarGrupoPermisoEmision', 'editarEtiquetaPermisoFecha');

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

    var tipoFecha = document.getElementById('editarPermisoTipoFecha').value;
    var nombre = document.getElementById('editarPermisoNombre').value;
    var fechaVencimiento = document.getElementById('editarPermisoFechaVencimiento').value;
    var diasAlerta = leerNumeroCampo('editarPermisoDiasAlerta');
    var numero = document.getElementById('editarPermisoNumero').value;
    var fechaEmision = document.getElementById('editarPermisoFechaEmision').value;

    if (nombre === '') {
        errorDiv.textContent = 'El nombre es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    if (fechaVencimiento === '') {
        errorDiv.textContent = 'La fecha de vencimiento o plazo es obligatoria';
        errorDiv.style.display = 'block';
        return;
    }

    if (diasAlerta < 1) {
        errorDiv.textContent = 'Los días de alerta deben ser 1 o más';
        errorDiv.style.display = 'block';
        return;
    }

    if (tipoFecha === 'vencimiento') {

        if (numero === '' || fechaEmision === '') {
            errorDiv.textContent = 'El número y la fecha de emisión son obligatorios en un permiso';
            errorDiv.style.display = 'block';
            return;
        }

        if (new Date(fechaVencimiento) < new Date(fechaEmision)) {
            errorDiv.textContent = 'El vencimiento no puede ser anterior a la emisión';
            errorDiv.style.display = 'block';
            return;
        }
    }

    var body = {
        nombre: nombre,
        fechaVencimiento: fechaVencimiento,
        diasAlerta: diasAlerta,
        observaciones: document.getElementById('editarPermisoObservaciones').value
    };

    if (tipoFecha === 'vencimiento') {
        body.numero = numero;
        body.fechaEmision = fechaEmision;
    }

    // The only state we can send by hand is "renovado"
    if (document.getElementById('editarPermisoRenovado').checked === true) {
        body.estado = 'renovado';
    }

    fetch(BASE_URL + '/permisos/' + id, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {
        if (data.permiso) {
            exitoDiv.textContent = 'Registro actualizado correctamente';
            exitoDiv.style.display = 'block';
            setTimeout(function() { mostrarPagina('permisos'); }, 1500);
        } else {
            errorDiv.textContent = data.mensaje || 'Error al actualizar';
            errorDiv.style.display = 'block';
        }
    });
}

// =====================
// VENCIMIENTOS
// =====================
function cargarVencimientos() {
    fetch(BASE_URL + '/permisos/vencimientos', { headers: getHeaders() })
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(data) {

        if (data.resumen === undefined) {
            return;
        }

        document.getElementById('conteoVencidos').textContent = data.resumen.vencidos;
        document.getElementById('conteoPorVencer').textContent = data.resumen.porVencer;

        var listaVencidos = document.getElementById('listaVencidos');
        var listaPorVencer = document.getElementById('listaPorVencer');

        if (data.vencidos.length === 0) {
            listaVencidos.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-icono">✅</div><div class="estado-vacio-texto">Nada vencido</div></div>';
        } else {
            var htmlVencidos = '';

            data.vencidos.forEach(function(permiso) {
                htmlVencidos += armarItemAlerta(permiso);
            });

            listaVencidos.innerHTML = htmlVencidos;
        }

        if (data.porVencer.length === 0) {
            listaPorVencer.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-icono">✅</div><div class="estado-vacio-texto">Nada por vencer</div></div>';
        } else {
            var htmlPorVencer = '';

            data.porVencer.forEach(function(permiso) {
                htmlPorVencer += armarItemAlerta(permiso);
            });

            listaPorVencer.innerHTML = htmlPorVencer;
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
