// ==========================================
// CONFIGURACIÓN E INITIALIZACIÓN DE ESTADO
// ==========================================

// Dirección del servidor backend donde se buscan los datos de los jugadores
const API_URL = 'http://localhost:4000';

// 'estado' guarda la "memoria" del juego en tiempo real. Modificar estas variables cambia lo que pasa en la pantalla.
let estado = {
    preguntasRestantes: 10,
    categoria: null,       // Categoría seleccionada (club, pais, posicion, edad, altura)
    comparador: null,      // Comparador para números (mayor, menor, exactamente)
    valorRango: 180,       // Valor actual del deslizador (slider) para edad/altura
    periodo: 'actual',     // Filtro para clubes: 'actual' o 'pasado'
    juegoTerminado: false,
    jugadorSecreto: null,  // El jugador que el usuario debe adivinar
    respuestas: [],        // Historial de preguntas y respuestas mostradas
    pistaActiva: false,    // Controla si se visualiza la pista en pantalla
    jugadores: [],         // Lista limpia de todos los jugadores procesados
    sugerencias: { club: [], pais: [], posicion: [], nombres: [] } // Listas para el autoconsignado/autocompletado
};

// 'elementos' guarda las referencias directas a las etiquetas HTML para poder alterarlas o leer sus datos
const elementos = {
    botonActual: document.getElementById('actual'),
    botonPasado: document.getElementById('pasado'),
    botonesCategoria: {
        club: document.getElementById('club'), pais: document.getElementById('pais'),
        posicion: document.getElementById('posicion'), edad: document.getElementById('edad'),
        altura: document.getElementById('altura')
    },
    botonesComparador: {
        mayor: document.getElementById('mayor'), menor: document.getElementById('menor'), exactamente: document.getElementById('exactamente')
    },
    comparadorContainer: document.getElementById('comparador'),
    inputTexto: document.getElementById('input-texto'),
    inputRango: document.getElementById('input-rango'),
    valorRango: document.getElementById('valor-rango'),
    datalistSugerencias: document.getElementById('sugerencias'),
    datalistAdivinar: document.getElementById('sugerencias-adivinar'),
    btnPreguntar: document.getElementById('btn-preguntar'),
    btnAdivinar: document.getElementById('btn-adivinar'),
    btnCamara: document.getElementById('btn-camara'),
    btnMarcar: document.getElementById('btn-marcar'),
    preguntasRestantes: document.getElementById('preguntas-restantes'),
    cajaRespuestas: document.getElementById('caja-respuestas'),
    mensajeJuego: document.getElementById('mensaje-juego'),
    inputAdivinar: document.getElementById('input-adivinar'),
    pista: document.getElementById('pista')
};

// ==========================================
// FUNCIONES DE CONTROL DE JUEGO (LÓGICA)
// ==========================================

// Restablece todas las variables del juego a su punto de partida original
function inicializarJuego() {
    estado = {
        ...estado, // Copia la estructura base del estado anterior (como las listas de jugadores)
        preguntasRestantes: 10, categoria: null, comparador: null, valorRango: 180,
        periodo: 'actual', juegoTerminado: false, respuestas: [], pistaActiva: false
    };
    if (elementos.inputTexto) elementos.inputTexto.value = '';
    if (elementos.inputAdivinar) elementos.inputAdivinar.value = '';
    if (elementos.inputRango) elementos.inputRango.value = 180;
    
    seleccionarPeriodo('actual');
}

/**
 * EXPLICACIÓN AVANZADA: async/await y fetch
 * El juego necesita datos de un servidor externo. 'fetch' solicita esos datos. 
 * Como internet puede tardar, usamos 'async' (función asíncrona) y 'await' (espera),
 * lo que evita que el navegador se congele mientras se descargan los datos.
 */
async function cargarJugadores() {
    try {
        const respuesta = await fetch(`${API_URL}/jugadores`);
        const datos = await respuesta.json(); // Convierte la respuesta del servidor en formato JSON manipulable

        if (!Array.isArray(datos) || datos.length === 0) {
            estado.mensaje = 'No hay jugadores disponibles en el backend.';
        } else {
            construirJugadores(datos);
            seleccionarJugadorSecreto();
            estado.mensaje = 'Selecciona categoría y haz una pregunta.';
        }
    } catch (error) {
        console.error(error);
        estado.mensaje = 'Error al cargar jugadores. Verifica el backend.';
    }
    render(); // Redibuja la pantalla con los nuevos mensajes
}

/**
 * EXPLICACIÓN AVANZADA: Map() y Set()
 * Un 'Map' es un diccionario inteligente que organiza datos usando una clave única (el ID del jugador).
 * Un 'Set' es una lista matemática que ELIMINA automáticamente elementos duplicados (ideal para no repetir países o clubes).
 */
function construirJugadores(datos) {
    const jugadoresMap = new Map();

    datos.forEach((fila) => {
        const id = fila.id_jugador;
        if (!id) return; // Si la fila de la base de datos no tiene ID válido, la ignora

        // Si es la primera vez que vemos a este jugador, creamos su ficha técnica básica
        if (!jugadoresMap.has(id)) {
            jugadoresMap.set(id, {
                id,
                nombre: `${fila.nombre || ''} ${fila.apellido || ''}`.trim(),
                pais: fila.pais || fila.country || '',
                posicion: fila.posicion || '',
                edad: Number(fila.edad) || 0,
                altura: Number(fila.altura) || 0,
                trayectoria: [] // Aquí guardaremos los clubes por los que pasó
            });
        }

        const jugador = jugadoresMap.get(id);
        const club = fila.nombre_equipo || '';

        // Guardamos los textos en las listas globales de sugerencias
        if (jugador.pais) estado.sugerencias.pais.push(jugador.pais);
        if (jugador.posicion) estado.sugerencias.posicion.push(jugador.posicion);
        if (club) estado.sugerencias.club.push(club);
        if (jugador.nombre) estado.sugerencias.nombres.push(jugador.nombre);

        if (club) {
            jugador.trayectoria.push({ 
                club, 
                ingreso: Number(fila.anio_ingreso) || 0, 
                traspaso: Number(fila.anio_traspaso) || 0 
            });
        }
    });

    // Limpiamos los duplicados de las sugerencias convirtiéndolas a Set y luego de vuelta a Array
    Object.keys(estado.sugerencias).forEach(cat => {
        estado.sugerencias[cat] = Array.from(new Set(estado.sugerencias[cat])).sort();
    });

    // Procesamos la trayectoria deportiva de cada jugador
    estado.jugadores = Array.from(jugadoresMap.values()).map((jugador) => {
        // Ordena cronológicamente los clubes del jugador según el año de ingreso
        jugador.trayectoria.sort((a, b) => a.ingreso - b.ingreso || a.traspaso - b.traspaso);
        
        jugador.clubes = [...new Set(jugador.trayectoria.map(t => t.club))];
        // El club actual siempre será el último registro de su trayectoria ordenada
        jugador.clubActual = jugador.trayectoria.length ? jugador.trayectoria[jugador.trayectoria.length - 1].club : '';
        // Clubes pasados son todos menos el último
        jugador.clubesPasados = jugador.trayectoria.length > 1 
            ? jugador.trayectoria.slice(0, -1).map(t => t.club) 
            : [];
        return jugador;
    });
}

// Selecciona al azar un jugador de la lista procesada para que sea el personaje misterioso
function seleccionarJugadorSecreto() {
    if (estado.jugadores.length === 0) return;
    const index = Math.floor(Math.random() * estado.jugadores.length);
    estado.jugadorSecreto = estado.jugadores[index];
    estado.pistaActiva = false;
}

// ==========================================
// INTERACCIONES DEL USUARIO (SELECCIONES)
// ==========================================

function seleccionarCategoria(categoria) {
    estado.categoria = categoria;
    estado.comparador = null; // Resetea el comparador matemático al cambiar de categoría
    estado.mensaje = `Categoría actual: ${categoria.toUpperCase()}.`;
    
    // Muestra u oculta los botones de "mayor/menor" dependiendo de si la categoría es numérica
    elementos.comparadorContainer.classList.toggle('hidden', !['edad', 'altura'].includes(categoria));
    render();
}

function seleccionarComparador(comparador) {
    if (!estado.categoria) {
        estado.mensaje = 'Primero elige una categoría.';
    } else {
        estado.comparador = comparador;
    }
    render();
}

function seleccionarPeriodo(periodo) {
    estado.periodo = periodo;
    elementos.botonActual.classList.toggle('selected', periodo === 'actual');
    elementos.botonPasado.classList.toggle('selected', periodo === 'pasado');
    render();
}

// ==========================================
// VALIDACIONES Y PROCESAMIENTO DE TEXTO
// ==========================================

/**
 * EXPLICACIÓN AVANZADA: RegEx (Expresiones Regulares) y Normalización
 * Para evitar que el juego falle si el usuario escribe "Messi" con espacios, acentos o mayúsculas,
 * esta función limpia los textos. '.normalize' remueve tildes y diéresis, y '.replace' elimina caracteres extraños, 
 * dejando un string estándar de texto plano y en minúsculas.
 */
function limpiarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Elimina marcas de acentos
        .replace(/[^a-zA-Z0-9 ]/g, '')     // Elimina símbolos especiales
        .toLowerCase()
        .trim();
}

// Comprueba si el texto que escribió el usuario coincide con alguna de nuestras opciones válidas
function opcionValida(categoria, texto) {
    if (!texto) return false;
    const opciones = estado.sugerencias[categoria] || [];
    return opciones.some((opcion) => limpiarTexto(opcion) === limpiarTexto(texto));
}

// Comprobaciones rápidas de estado para activar o desactivar botones en la interfaz
function entradaPreguntaValida() {
    if (!estado.categoria) return false;
    if (['edad', 'altura'].includes(estado.categoria)) return !!estado.comparador;
    return opcionValida(estado.categoria, elementos.inputTexto.value);
}

function puedeHacerPregunta() {
    return !estado.juegoTerminado && estado.preguntasRestantes > 0 && entradaPreguntaValida();
}

// ==========================================
// PROCESAMIENTO DE PREGUNTAS Y ADIVINANZAS
// ==========================================

function obtenerRespuestaPregunta() {
    const secreto = estado.jugadorSecreto;
    const cat = estado.categoria;
    const textoInput = elementos.inputTexto.value.trim();

    if (['club', 'pais', 'posicion'].includes(cat)) {
        if (!opcionValida(cat, textoInput)) return { valido: false, respuesta: `Selecciona un/a ${cat} válido/a.` };
        
        const textoLimpio = limpiarTexto(textoInput);

        if (cat === 'club') {
            if (estado.periodo === 'actual') {
                return { valido: true, respuesta: textoLimpio === limpiarTexto(secreto.clubActual) ? `Sí, actualmente juega en ${secreto.clubActual}.` : `No, actualmente no juega en ${textoInput}.` };
            } else {
                return { valido: true, respuesta: secreto.clubesPasados.map(limpiarTexto).includes(textoLimpio) ? `Sí, en el pasado jugó en ${textoInput}.` : `No, en el pasado no jugó en ${textoInput}.` };
            }
        }
        
        const valorSecreto = limpiarTexto(secreto[cat]);
        return {
            valido: true,
            respuesta: textoLimpio === valorSecreto ? `Sí, es de/juega como ${secreto[cat]}.` : `No, no es de/juega como ${textoInput}.`
        };
    }

    // Si es numérico (edad o altura), evalúa matemáticamente usando la regla del comparador
    const valorReal = secreto[cat];
    const unidad = cat === 'edad' ? 'años' : 'cm';
    
    if (valorReal === 0) return { valido: true, respuesta: `No hay datos de ${cat}.` };

    let seCumple = false;
    if (estado.comparador === 'mayor') seCumple = valorReal > estado.valorRango;
    if (estado.comparador === 'menor') seCumple = valorReal < estado.valorRango;
    if (estado.comparador === 'exactamente') seCumple = valorReal === estado.valorRango;

    return {
        valido: true,
        respuesta: seCumple ? `Sí, su ${cat} es ${estado.comparador} a ${estado.valorRango} ${unidad}.` : `No, su ${cat} no es ${estado.comparador} a ${estado.valorRango} ${unidad}.`
    };
}

function hacerPregunta() {
    const pregunta = obtenerRespuestaPregunta();
    if (!pregunta.valido) {
        estado.mensaje = pregunta.respuesta;
    } else {
        // '.unshift' agrega el elemento al PRINCIPIO del array para que lo último aparezca arriba de todo
        estado.respuestas.unshift(`Pregunta ${11 - estado.preguntasRestantes}: ${pregunta.respuesta}`);
        estado.preguntasRestantes -= 1;
        estado.mensaje = pregunta.respuesta;
    }
    render();
}

function intentarAdivinar() {
    const texto = elementos.inputAdivinar.value.trim();
    if (!opcionValida('nombres', texto)) {
        estado.mensaje = 'Selecciona un nombre válido de la lista.';
        render();
        return;
    }

    if (limpiarTexto(texto) === limpiarTexto(estado.jugadorSecreto.nombre)) {
        estado.juegoTerminado = true;
        estado.mensaje = `¡Adivinaste! El jugador es ${estado.jugadorSecreto.nombre}.`;
        estado.respuestas.unshift(`✅ ACIERTO: ${estado.jugadorSecreto.nombre}`);
        //agregar foto de jugador
        //pruebas del fetch
        // fetch("https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=avalos")
        //   .then(res => res.json())
        //   .then(data => {
        //     document.getElementById("fotoJugador").src =
        //       data.player[0].strCutout || data.player[0].strThumb;
        //   });
        let silueta = document.getElementById("silueta");
        silueta.innerHTML=""
        silueta.innerHTML = `<img id="fotoJugador" src="https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${estado.jugadorSecreto.nombre}&apikey=YOUR_API_KEY">`;

    } else {
        estado.preguntasRestantes = Math.max(0, estado.preguntasRestantes - 1);
        estado.mensaje = `No es ${texto}. Sigue intentando.`;
        estado.respuestas.unshift(`❌ Fallaste: ${texto}`);
    }
    render();
}

function mostrarPista() {
    if (!estado.jugadorSecreto) return;
    estado.pistaActiva = true;
    const j = estado.jugadorSecreto;
    elementos.pista.textContent = `País: ${j.pais || '?' } • Club Act: ${j.clubActual || '?'} • Posición: ${j.posicion || '?'} • Edad: ${j.edad || '?'} años • Altura: ${j.altura || '?'} cm`;
    render();
}

function marcarRespuesta() {
    if (estado.respuestas.length > 0 && !estado.respuestas[0].startsWith('🏁')) {
        estado.respuestas[0] = `🏁 ${estado.respuestas[0]}`;
        estado.mensaje = 'Respuesta marcada.';
        render();
    }
}

// ==========================================
// RENDERIZADO (DIBUJAR EN PANTALLA)
// ==========================================

// Esta función sincroniza el estado de JS con lo que ve el usuario visualmente en el HTML
function render() {
    // 1. Textos informativos de estado en pantalla
    elementos.preguntasRestantes.textContent = `Tienes ${estado.preguntasRestantes} preguntas restantes:`;
    elementos.mensajeJuego.textContent = estado.mensaje;

    // 2. Renderizar historial de respuestas (solo las últimas 10)
    elementos.cajaRespuestas.innerHTML = estado.respuestas.slice(0, 10).map(t => `<div class="respuesta">${t}</div>`).join('');

    // 3. Control y formateo de los controles deslizantes de rangos
    if (elementos.inputRango && elementos.valorRango) {
        const esEdad = estado.categoria === 'edad';
        elementos.inputRango.min = esEdad ? 16 : 150;
        elementos.inputRango.max = esEdad ? 45 : 210;
        
        // Ajustar valor si se sale de los rangos permitidos
        if (esEdad && (estado.valorRango < 16 || estado.valorRango > 45)) estado.valorRango = 25;
        if (!esEdad && (estado.valorRango < 150 || estado.valorRango > 210)) estado.valorRango = 180;
        
        elementos.inputRango.value = estado.valorRango;
        elementos.valorRango.textContent = `${estado.valorRango} ${esEdad ? 'años' : 'cm'}`;
    }

    // 4. Activar/Desactivar y cambiar placeholders del cuadro de entrada de texto
    const catTexto = ['club', 'pais', 'posicion'].includes(estado.categoria);
    elementos.inputTexto.disabled = !catTexto;
    elementos.inputTexto.placeholder = catTexto ? 'Selecciona o escribe aquí' : (estado.categoria ? 'Usa el slider numérico' : 'Elige una categoría');

    // 5. Cargar listas desplegables (datalists) para autocompletado
    const opciones = catTexto ? estado.sugerencias[estado.categoria] : [];
    elementos.datalistSugerencias.innerHTML = opciones.map(v => `<option value="${v}"></option>`).join('');
    elementos.datalistAdivinar.innerHTML = estado.sugerencias.nombres.map(v => `<option value="${v}"></option>`).join('');

    // 6. Resaltar visualmente qué botones de categorías o comparadores están activos (.selected)
    Object.entries(elementos.botonesCategoria).forEach(([c, btn]) => btn?.classList.toggle('selected', estado.categoria === c));
    Object.entries(elementos.botonesComparador).forEach(([c, btn]) => btn?.classList.toggle('selected', estado.comparador === c));

    // 7. Gestión de habilitación de botones de acción
    elementos.btnPreguntar.disabled = !puedeHacerPregunta();
    elementos.btnAdivinar.disabled = estado.juegoTerminado || estado.preguntasRestantes <= 0 || !opcionValida('nombres', elementos.inputAdivinar.value);
    elementos.btnCamara.disabled = estado.juegoTerminado;
    elementos.btnMarcar.disabled = estado.juegoTerminado || estado.respuestas.length === 0;

    // 8. Visualización de pistas
    elementos.pista.classList.toggle('visible', estado.pistaActiva);
    if (!estado.pistaActiva) elementos.pista.textContent = 'Pulsa el icono de cámara para mostrar una pista.';
}

// ==========================================
// ASIGNACIÓN DE EVENTOS DEL NAVEGADOR
// ==========================================

function vincularEventos() {
    elementos.botonActual?.addEventListener('click', () => seleccionarPeriodo('actual'));
    elementos.botonPasado?.addEventListener('click', () => seleccionarPeriodo('pasado'));

    // Escucha clics en los botones de categoría y comparadores de forma automatizada
    Object.entries(elementos.botonesCategoria).forEach(([cat, btn]) => btn?.addEventListener('click', () => seleccionarCategoria(cat)));
    Object.entries(elementos.botonesComparador).forEach(([comp, btn]) => btn?.addEventListener('click', () => seleccionarComparador(comp)));

    // Evento que se ejecuta cada vez que el usuario mueve el control deslizante (slider)
    elementos.inputRango?.addEventListener('input', (e) => {
        estado.valorRango = Number(e.target.value);
        render();
    });

    // Eventos de entrada de teclado para actualizar interfaces al escribir
    elementos.inputTexto?.addEventListener('input', render);
    elementos.inputAdivinar?.addEventListener('input', render);

    // Enlace de botones principales a sus respectivas funciones lógicas
    elementos.btnPreguntar?.addEventListener('click', hacerPregunta);
    elementos.btnAdivinar?.addEventListener('click', intentarAdivinar);
    elementos.btnCamara?.addEventListener('click', mostrarPista);
    elementos.btnMarcar?.addEventListener('click', marcarRespuesta);
}

// ==========================================
// DISPARO INICIAL
// ==========================================
vincularEventos();
inicializarJuego();
cargarJugadores();