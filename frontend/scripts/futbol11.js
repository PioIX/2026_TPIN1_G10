// ============================================================================
// POSICIONES DE LA FORMACIÓN
// ============================================================================
// Cada objeto representa una posición de la cancha y el grupo visual
// donde se mostrará (delanteros, mediocampistas, defensas o arquero).
const posiciones = [
    { numero: 7, nombre: 'ED', grupo: 'delanteros' },
    { numero: 9, nombre: 'DC', grupo: 'delanteros' },
    { numero: 11, nombre: 'EI', grupo: 'delanteros' },

    { numero: 8, nombre: 'MC', grupo: 'mediocampistas' },
    { numero: 10, nombre: 'MCO', grupo: 'mediocampistas' },
    { numero: 5, nombre: 'MCD', grupo: 'mediocampistas' },

    { numero: 3, nombre: 'LI', grupo: 'defensas' },
    { numero: 6, nombre: 'DFC', grupo: 'defensas' },
    { numero: 4, nombre: 'DFC', grupo: 'defensas' },
    { numero: 2, nombre: 'LD', grupo: 'defensas' },

    { numero: 1, nombre: 'ARQ', grupo: 'arquero' }
];

// URL donde se encuentra el backend
const urlApi = 'http://localhost:4000';

// ============================================================================
// ESTADO DEL JUEGO
// ============================================================================
// Guarda toda la información que cambia mientras se juega.
let estado = {
    equipo: [],                  // Jugadores colocados en cada posición
    posicionSeleccionada: null,  // Posición elegida actualmente
    paisActual: '',              // País que debe cumplir el jugador
    ronda: 0,                    // Número de ronda
    jugadores: [],               // Lista de jugadores obtenida del backend
    mensaje: 'Seleccioná una posición vacía y escribí el nombre del jugador.'
};

// ============================================================================
// INICIAR PARTIDA
// ============================================================================
// Reinicia todos los datos y comienza desde la ronda 1.
function iniciarJuego() {
    estado.equipo = Array(posiciones.length).fill(null);
    estado.posicionSeleccionada = null;
    estado.ronda = 0;
    estado.mensaje = 'Seleccioná una posición vacía y escribí el nombre del jugador.';
    siguienteRonda();
}

// ============================================================================
// CARGAR JUGADORES DESDE EL BACKEND
// ============================================================================
// Hace una petición al servidor y guarda los jugadores recibidos.
async function cargarJugadores() {
    try {
        // Solicita los jugadores al backend
        const respuesta = await fetch(`${urlApi}/jugadores`);

        // Convierte la respuesta a JSON
        const datos = await respuesta.json();

        // Verifica que realmente llegó un arreglo con datos
        if (Array.isArray(datos) && datos.length > 0) {

            estado.jugadores = datos

                // Descarta registros inválidos
                .filter((jugador) => jugador && (jugador.pais || jugador.country))

                // Convierte cada jugador a un formato uniforme
                .map((jugador) => ({
                    id: jugador.id_jugador,
                    nombre: `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim() || 'Jugador',
                    pais: jugador.pais,
                    posicion: jugador.posicion || 'undefined'
                }));

            iniciarJuego();

        } else {

            estado.jugadores = [];
            estado.mensaje = 'No hay jugadores disponibles.';
            render();
        }

    } catch (error) {

        // Si ocurre un error de conexión o del servidor
        console.error(error);

        estado.jugadores = [];
        estado.mensaje = 'No se pudieron cargar los jugadores.';
        render();
    }
}

// ============================================================================
// CONTROL DE RONDAS
// ============================================================================
// Avanza a la siguiente ronda y elige un nuevo país aleatorio.
function siguienteRonda() {
    estado.ronda += 1;
    estado.paisActual = obtenerPaisAleatorio();
    estado.posicionSeleccionada = null;
    limpiarEntrada();
    render();
}

// Devuelve un país aleatorio de la lista de jugadores.
function obtenerPaisAleatorio() {

    // Set elimina países repetidos
    const paises = [...new Set(estado.jugadores.map((jugador) => jugador.pais))];

    if (paises.length === 0) {
        return 'Sin datos';
    }

    // Genera un índice aleatorio
    return paises[Math.floor(Math.random() * paises.length)];
}

// ============================================================================
// NORMALIZACIÓN DE TEXTO
// ============================================================================
// Convierte textos a un formato comparable.
// Ejemplo:
// "Messí" -> "MESSI"
function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[^a-zA-Z]/g, '')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}

// Vacía el input donde se escribe el jugador.
function limpiarEntrada() {
    const entrada = document.getElementById('entradaJugador');

    if (entrada) {
        entrada.value = '';
    }
}

// Cambia el mensaje mostrado al usuario.
function mostrarMensaje(texto) {
    estado.mensaje = texto;
    render();
}
// ============================================================================
// SELECCIÓN DE POSICIONES Y UBICACIÓN DIRECTA (CON VALIDADOR DE ROL)
// ============================================================================
function seleccionarPosicion(indice) {
    const posicion = posiciones[indice];

    // 1. Evita pisar posiciones que ya tienen un jugador
    if (estado.equipo[indice]) {
        mostrarMensaje(`${posicion.nombre} ya está ocupado.`);
        return;
    }

    const entrada = document.getElementById('entradaJugador');
    const texto = entrada ? entrada.value.trim() : '';

    // 2. Si el usuario no escribió nada en el input
    if (!texto) {
        mostrarMensaje(`Escribí primero el nombre del jugador para colocarlo en ${posicion.nombre}.`);
        return;
    }

    // 3. Busca coincidencias exactas por nombre
    const coincidencias = estado.jugadores.filter((jugador) => {
        return normalizarTexto(jugador.nombre) === normalizarTexto(texto);
    });

    // Error: No existe ese jugador
    if (coincidencias.length === 0) {
        mostrarMensaje('No encontré ese jugador.');
        return;
    }

    const jugador = coincidencias[0];

    // Error: El jugador existe pero no es del país de la ronda actual
    if (jugador.pais !== estado.paisActual) {
        mostrarMensaje('Ese jugador no pertenece al país mostrado.');
        return;
    }

    // ========================================================================
    // NUEVA VALIDACIÓN: Verificar si el jugador es apto para esta posición
    // ========================================================================
    // Convertimos el "10-7" del backend en un array de strings: ['10', '7']
    const posicionesPermitidas = String(jugador.posicion).split('-');
    
    // Verificamos si el número de la posición clickeada está en su lista
    if (!posicionesPermitidas.includes(String(posicion.numero))) {
        mostrarMensaje(`${jugador.nombre} no puede jugar de ${posicion.nombre}.`);
        return;
    }
    // ========================================================================

    // --- SI PASA TODAS LAS VALIDACIONES ---
    
    // Guarda el jugador en la posición de la cancha clickeada
    estado.equipo[indice] = jugador;

    // Cuenta cuántas posiciones están ocupadas
    const ocupadas = estado.equipo.filter(Boolean).length;

    limpiarEntrada();

    // Verifica si se completó todo el equipo
    if (ocupadas === posiciones.length) {
        estado.mensaje = '¡Formación completa!';
        render();
        return;
    }

    estado.mensaje = `${jugador.nombre} fue colocado con éxito en ${posicion.nombre}.`;

    // Avanza a la siguiente ronda (cambia de país)
    siguienteRonda();
}
// ============================================================================
// RENDER GENERAL
// ============================================================================
// Actualiza todos los elementos visibles de la pantalla.
function render() {

    document.getElementById('paisActual').textContent = estado.paisActual;
    document.getElementById('rondaActual').textContent = estado.ronda;

    document.getElementById('jugadoresColocados').textContent =
        estado.equipo.filter(Boolean).length;

    document.getElementById('mensajeJuego').textContent =
        estado.mensaje;

    // Calcula porcentaje completado
    const progreso =
        Math.round((estado.equipo.filter(Boolean).length / posiciones.length) * 100);

    // Actualiza barra de progreso
    document.getElementById('rellenoProgreso').style.width =
        `${progreso}%`;

    document.getElementById('textoProgreso').textContent =
        `${estado.equipo.filter(Boolean).length} de ${posiciones.length} posiciones completas`;

    renderCancha();
    renderSugerencias();
}

// ============================================================================
// DIBUJAR LA CANCHA
// ============================================================================
// Genera todos los casilleros visuales de la formación.
function renderCancha() {

    const grupos = {
        delanteros: document.getElementById('delanteros'),
        mediocampistas: document.getElementById('mediocampistas'),
        defensas: document.getElementById('defensas'),
        arquero: document.getElementById('arquero')
    };

    // Limpia la cancha antes de volver a dibujarla
    Object.values(grupos).forEach((grupo) => {
        grupo.innerHTML = '';
    });

    posiciones.forEach((posicion, indice) => {

        const casillero = document.createElement('button');

        casillero.className = 'casillero';
        casillero.type = 'button';

        // Resalta la posición seleccionada
        if (estado.posicionSeleccionada === indice) {
            casillero.classList.add('casilleroSeleccionado');
        }

        const asignado = estado.equipo[indice];

        // Si ya tiene jugador
        if (asignado) {

            casillero.classList.add('casilleroOcupado');

            casillero.innerHTML =
                `<strong>${posicion.numero} - ${posicion.nombre}</strong><span>${asignado.nombre}</span>`;

        } else {

            casillero.innerHTML =
                `<strong>${posicion.numero} - ${posicion.nombre}</strong><span>Vacío</span>`;
        }

        // Al hacer click se selecciona esa posición
        casillero.addEventListener('click', () => seleccionarPosicion(indice));

        // Se agrega al grupo correspondiente
        grupos[posicion.grupo].appendChild(casillero);
    });
}

// ============================================================================
// AUTOCOMPLETADO DE JUGADORES
// ============================================================================
// Muestra sugerencias mientras se escribe.
function renderSugerencias() {

    const lista = document.getElementById('sugerenciasJugadores');
    const entrada = document.getElementById('entradaJugador');

    lista.innerHTML = '';

    const valor = normalizarTexto(entrada ? entrada.value : '');

    const jugadores = estado.jugadores.filter((jugador) => {
        // 1. Verifica que el usuario haya escrito algo
        const coincideTexto = valor.length > 0 && normalizarTexto(jugador.nombre).includes(valor);
        
        // 2. Filtra estrictamente por el país de la ronda actual (normalizado)
        const coincidePais = normalizarTexto(jugador.pais) === normalizarTexto(estado.paisActual);

        // ====================================================================
        // NOTA: Para permitir que aparezcan TODOS los jugadores del juego 
        // (desactivar el filtro de país obligatorio), simplemente cambiá 
        // la línea de abajo por: return coincideTexto;
        // ====================================================================
        return coincideTexto && coincidePais;
    });

    // Limita las sugerencias a 12 resultados
    jugadores.slice(0, 12).forEach((jugador) => {

        const opcion = document.createElement('option');

        opcion.value = jugador.nombre;

        lista.appendChild(opcion);
    });
}
// ============================================================================
// EVENTOS
// ============================================================================

// Botón para reiniciar y volver a cargar los jugadores
const botonReiniciar = document.getElementById('botonReiniciar');

botonReiniciar.addEventListener('click', () => cargarJugadores());

// Input donde se escribe el jugador
const entradaJugador = document.getElementById('entradaJugador');

entradaJugador.addEventListener('input', () => {
    renderSugerencias();
});

// ============================================================================
// INICIO DEL PROGRAMA
// ============================================================================
// Se ejecuta automáticamente al cargar la página.
cargarJugadores();