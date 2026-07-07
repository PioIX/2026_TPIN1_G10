const API_URL = 'http://localhost:4000';

const categorias = ['club', 'pais', 'posicion', 'edad', 'altura'];
const comparadores = ['mayor', 'menor', 'exactamente'];

let estado = {
    preguntasRestantes: 10,
    categoria: null,
    comparador: null,
    valorRango: 180,
    periodo: 'actual',
    juegoTerminado: false,
    jugadorSecreto: null,
    respuestas: [],
    pistaActiva: false,
    jugadores: [],
    sugerencias: {
        club: [],
        pais: [],
        posicion: [],
        nombres: []
    }
};

const elementos = {
    botonActual: document.getElementById('actual'),
    botonPasado: document.getElementById('pasado'),
    botonesCategoria: {
        club: document.getElementById('club'),
        pais: document.getElementById('pais'),
        posicion: document.getElementById('posicion'),
        edad: document.getElementById('edad'),
        altura: document.getElementById('altura')
    },
    botonesComparador: {
        mayor: document.getElementById('mayor'),
        menor: document.getElementById('menor'),
        exactamente: document.getElementById('exactamente')
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

function inicializarJuego() {
    estado.preguntasRestantes = 10;
    estado.categoria = null;
    estado.comparador = null;
    estado.valorRango = 180;
    estado.periodo = 'actual';
    estado.juegoTerminado = false;
    estado.jugadorSecreto = null;
    estado.respuestas = [];
    estado.pistaActiva = false;
    if (elementos.inputTexto) elementos.inputTexto.value = '';
    if (elementos.inputAdivinar) elementos.inputAdivinar.value = '';
    if (elementos.inputRango) elementos.inputRango.value = 180;
    if (elementos.valorRango) elementos.valorRango.textContent = '180 cm';
    elementos.comparadorContainer.classList.add('hidden');
    seleccionarPeriodo('actual');
    actualizarBotones();
    render();
}

async function cargarJugadores() {
    try {
        const respuesta = await fetch(`${API_URL}/jugadores`);
        const datos = await respuesta.json();
        if (!Array.isArray(datos) || datos.length === 0) {
            estado.mensaje = 'No hay jugadores disponibles en el backend.';
            render();
            return;
        }

        estado.jugadores = construirJugadores(datos);
        seleccionarJugadorSecreto();
        estado.mensaje = 'Selecciona categoría y haz una pregunta.';
        render();
    } catch (error) {
        console.error(error);
        estado.mensaje = 'Error al cargar jugadores. Verifica el backend.';
        render();
    }
}

function construirJugadores(datos) {
    const jugadoresMap = new Map();

    datos.forEach((fila) => {
        const id = fila.id_jugador;
        if (!id) return;

        if (!jugadoresMap.has(id)) {
            jugadoresMap.set(id, {
                id,
                nombre: `${fila.nombre || ''} ${fila.apellido || ''}`.trim(),
                pais: fila.pais || fila.country || '',
                posicion: fila.posicion || '',
                edad: Number(fila.edad) || 0,
                altura: Number(fila.altura) || 0,
                trayectoria: []
            });
        }

        const jugador = jugadoresMap.get(id);
        const club = fila.nombre_equipo || '';
        const ingreso = Number(fila.anio_ingreso) || 0;
        const traspaso = Number(fila.anio_traspaso) || 0;

        if (jugador.pais) estado.sugerencias.pais.push(jugador.pais);
        if (jugador.posicion) estado.sugerencias.posicion.push(jugador.posicion);
        if (club) estado.sugerencias.club.push(club);
        if (jugador.nombre) estado.sugerencias.nombres.push(jugador.nombre);

        if (club) {
            jugador.trayectoria.push({ club, ingreso, traspaso });
        }
    });

    estado.sugerencias.pais = Array.from(new Set(estado.sugerencias.pais)).sort();
    estado.sugerencias.posicion = Array.from(new Set(estado.sugerencias.posicion)).sort();
    estado.sugerencias.club = Array.from(new Set(estado.sugerencias.club)).sort();
    estado.sugerencias.nombres = Array.from(new Set(estado.sugerencias.nombres)).sort();

    return Array.from(jugadoresMap.values()).map((jugador) => {
        jugador.trayectoria.sort((a, b) => a.ingreso - b.ingreso || a.traspaso - b.traspaso);
        jugador.clubes = [...new Set(jugador.trayectoria.map((item) => item.club))];
        jugador.clubActual = jugador.trayectoria.length ? jugador.trayectoria[jugador.trayectoria.length - 1].club : '';
        jugador.clubesPasados = jugador.trayectoria.length > 1
            ? jugador.trayectoria.slice(0, -1).map((item) => item.club)
            : [];
        return jugador;
    });
}

function seleccionarJugadorSecreto() {
    if (estado.jugadores.length === 0) return;
    const index = Math.floor(Math.random() * estado.jugadores.length);
    estado.jugadorSecreto = estado.jugadores[index];
    estado.pistaActiva = false;
}

function seleccionarCategoria(categoria) {
    if (!categorias.includes(categoria)) return;
    estado.categoria = categoria;
    estado.comparador = null;
    estado.mensaje = `Categoría actual: ${categoria.toUpperCase()}.`;
    if (categoria === 'edad' || categoria === 'altura') {
        elementos.comparadorContainer.classList.remove('hidden');
    } else {
        elementos.comparadorContainer.classList.add('hidden');
    }
    actualizarBotones();
    render();
}

function seleccionarComparador(comparador) {
    if (!comparadores.includes(comparador)) return;
    if (!estado.categoria) {
        estado.mensaje = 'Primero elige una categoría.';
        render();
        return;
    }
    estado.comparador = comparador;
    actualizarBotones();
    render();
}

function seleccionarPeriodo(periodo) {
    if (periodo !== 'actual' && periodo !== 'pasado') return;
    estado.periodo = periodo;
    elementos.botonActual.classList.toggle('selected', periodo === 'actual');
    elementos.botonPasado.classList.toggle('selected', periodo === 'pasado');
    render();
}

function actualizarBotones() {
    categorias.forEach((categoria) => {
        const boton = elementos.botonesCategoria[categoria];
        if (!boton) return;
        boton.classList.toggle('selected', estado.categoria === categoria);
    });
    comparadores.forEach((comparador) => {
        const boton = elementos.botonesComparador[comparador];
        if (!boton) return;
        boton.classList.toggle('selected', estado.comparador === comparador);
    });
}

function configurarSliderPorCategoria() {
    if (!elementos.inputRango || !elementos.valorRango) return;
    if (estado.categoria === 'edad') {
        elementos.inputRango.min = 16;
        elementos.inputRango.max = 45;
        if (estado.valorRango < 16 || estado.valorRango > 45) {
            estado.valorRango = 25;
            elementos.inputRango.value = 25;
        }
        elementos.valorRango.textContent = `${estado.valorRango} años`;
    } else if (estado.categoria === 'altura') {
        elementos.inputRango.min = 150;
        elementos.inputRango.max = 210;
        if (estado.valorRango < 150 || estado.valorRango > 210) {
            estado.valorRango = 180;
            elementos.inputRango.value = 180;
        }
        elementos.valorRango.textContent = `${estado.valorRango} cm`;
    }
}

function actualizarDatalist() {
    if (!elementos.datalistSugerencias) return;
    const categoria = estado.categoria;
    const opciones = ['club', 'pais', 'posicion'].includes(categoria)
        ? estado.sugerencias[categoria]
        : [];
    elementos.datalistSugerencias.innerHTML = opciones
        .map((valor) => `<option value="${valor}"></option>`)
        .join('');
}

function actualizarDatalistAdivinar() {
    if (!elementos.datalistAdivinar) return;
    const opciones = estado.sugerencias.nombres;
    elementos.datalistAdivinar.innerHTML = opciones
        .map((valor) => `<option value="${valor}"></option>`)
        .join('');
}

function actualizarValorRango() {
    const valor = Number(elementos.inputRango.value);
    estado.valorRango = valor;
    if (estado.categoria === 'edad') {
        elementos.valorRango.textContent = `${valor} años`;
    } else {
        elementos.valorRango.textContent = `${valor} cm`;
    }
}

function normalizar(texto) {
    return String(texto || '').toLowerCase().trim();
}

function normalizarTextoFix(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .toLowerCase()
        .trim();
}

function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[ -]/g, '')
        .replace(/[-]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .replace(/[ -]/g, '')
        .toLowerCase()
        .trim();
}

function opcionValida(categoria, texto) {
    if (!texto) return false;
    const opciones = estado.sugerencias[categoria] || [];
    const valor = normalizarTexto(texto);
    return opciones.some((opcion) => normalizarTexto(opcion) === valor);
}

function entradaPreguntaValida() {
    if (!estado.categoria) return false;
    if (['edad', 'altura'].includes(estado.categoria)) {
        return !!estado.comparador;
    }
    return opcionValida(estado.categoria, elementos.inputTexto.value.trim());
}

function entradaAdivinarValida() {
    return opcionValida('nombres', elementos.inputAdivinar.value.trim());
}

function puedeHacerPregunta() {
    return !estado.juegoTerminado && estado.preguntasRestantes > 0 && entradaPreguntaValida();
}

function obtenerRespuestaPregunta() {
    if (!estado.categoria) {
        return { valido: false, respuesta: 'Debes elegir una categoría antes de preguntar.' };
    }

    const secreto = estado.jugadorSecreto;
    if (!secreto) return { valido: false, respuesta: 'No hay jugador secreto definido.' };

    const cat = estado.categoria;
    const comparador = estado.comparador;
    let resultado = '';
    let valido = true;

    if (cat === 'club') {
        const texto = elementos.inputTexto.value.trim();
        if (!texto) return { valido: false, respuesta: 'Debes escribir el club para preguntar.' };
        if (!opcionValida('club', texto)) {
            return { valido: false, respuesta: 'Selecciona un club válido de la lista.' };
        }
        const actual = normalizar(secreto.clubActual);
        const pasado = secreto.clubesPasados.map(normalizar);
        if (estado.periodo === 'actual') {
            if (!actual) return { valido: false, respuesta: 'No hay datos del club actual.' };
            resultado = normalizar(texto) === actual
                ? `Sí, actualmente juega en ${secreto.clubActual}.`
                : `No, actualmente no juega en ${elementos.inputTexto.value}.`;
        } else {
            if (pasado.length === 0) {
                return { valido: false, respuesta: 'No hay registros de clubes pasados.' };
            }
            resultado = pasado.includes(normalizar(texto))
                ? `Sí, en el pasado jugó en ${elementos.inputTexto.value}.`
                : `No, en el pasado no jugó en ${elementos.inputTexto.value}.`;
        }
    } else if (cat === 'pais') {
        const texto = elementos.inputTexto.value.trim();
        if (!texto) return { valido: false, respuesta: 'Debes escribir el país para preguntar.' };
        if (!opcionValida('pais', texto)) {
            return { valido: false, respuesta: 'Selecciona un país válido de la lista.' };
        }
        resultado = normalizar(texto) === normalizar(secreto.pais)
            ? `Sí, es de ${secreto.pais}.`
            : `No, no es de ${elementos.inputTexto.value}.`;
    } else if (cat === 'posicion') {
        const texto = elementos.inputTexto.value.trim();
        if (!texto) return { valido: false, respuesta: 'Debes escribir la posición para preguntar.' };
        if (!opcionValida('posicion', texto)) {
            return { valido: false, respuesta: 'Selecciona una posición válida de la lista.' };
        }
        resultado = normalizar(texto) === normalizar(secreto.posicion)
            ? `Sí, juega como ${secreto.posicion}.`
            : `No, no juega como ${elementos.inputTexto.value}.`;
    } else if (cat === 'edad') {
        if (!comparador) return { valido: false, respuesta: 'Elige mayor, menor o exactamente para edad.' };
        resultado = compararValor(secreto.edad, estado.valorRango, comparador, 'años');
    } else if (cat === 'altura') {
        if (!comparador) return { valido: false, respuesta: 'Elige mayor, menor o exactamente para altura.' };
        resultado = compararValor(secreto.altura, estado.valorRango, comparador, 'cm');
    }

    return { valido, respuesta: resultado };
}

function compararValor(valorReal, valorPregunta, comparador, unidad) {
    if (valorReal === 0) return `No hay datos de ${unidad}.`;
    switch (comparador) {
        case 'mayor':
            return valorReal > valorPregunta ? `Sí, su ${unidad} es mayor a ${valorPregunta}.` : `No, su ${unidad} no es mayor a ${valorPregunta}.`;
        case 'menor':
            return valorReal < valorPregunta ? `Sí, su ${unidad} es menor a ${valorPregunta}.` : `No, su ${unidad} no es menor a ${valorPregunta}.`;
        case 'exactamente':
            return valorReal === valorPregunta ? `Sí, su ${unidad} es exactamente ${valorPregunta}.` : `No, su ${unidad} no es ${valorPregunta}.`;
        default:
            return 'Comparador inválido.';
    }
}

function hacerPregunta() {
    if (estado.juegoTerminado) {
        estado.mensaje = 'La partida ya terminó. Reinicia para jugar de nuevo.';
        render();
        return;
    }

    const pregunta = obtenerRespuestaPregunta();
    if (!pregunta.valido) {
        estado.mensaje = pregunta.respuesta;
        render();
        return;
    }

    estado.respuestas.unshift(`Pregunta ${11 - estado.preguntasRestantes}: ${pregunta.respuesta}`);
    estado.preguntasRestantes -= 1;
    estado.mensaje = pregunta.respuesta;
    render();
}

function intentarAdivinar() {
    const texto = elementos.inputAdivinar.value.trim();
    if (!texto) {
        estado.mensaje = 'Escribe un nombre para adivinar.';
        render();
        return;
    }
    if (!opcionValida('nombres', texto)) {
        estado.mensaje = 'Selecciona un nombre válido de la lista para adivinar.';
        render();
        return;
    }
    const intento = normalizar(texto);
    if (!estado.jugadorSecreto) {
        estado.mensaje = 'No hay jugador secreto definido.';
        render();
        return;
    }

    const secreto = normalizar(estado.jugadorSecreto.nombre);
    if (intento === secreto) {
        estado.juegoTerminado = true;
        estado.mensaje = `¡Adivinaste! El jugador es ${estado.jugadorSecreto.nombre}.`;
        estado.respuestas.unshift(`✅ ACIERTO: ${estado.jugadorSecreto.nombre}`);
    } else {
        estado.preguntasRestantes = Math.max(0, estado.preguntasRestantes - 1);
        estado.mensaje = `No es ${elementos.inputAdivinar.value}. Sigue intentando.`;
        estado.respuestas.unshift(`❌ Fallaste: ${elementos.inputAdivinar.value}`);
    }
    render();
}

function mostrarPista() {
    if (!estado.jugadorSecreto) return;
    estado.pistaActiva = true;
    const jugador = estado.jugadorSecreto;
    const datos = [];
    if (jugador.pais) datos.push(`País: ${jugador.pais}`);
    if (jugador.club) datos.push(`Club: ${jugador.club}`);
    if (jugador.posicion) datos.push(`Posición: ${jugador.posicion}`);
    if (jugador.edad) datos.push(`Edad: ${jugador.edad}`);
    if (jugador.altura) datos.push(`Altura: ${jugador.altura} cm`);
    elementos.pista.textContent = datos.length > 0 ? datos.join(' • ') : 'No hay pista disponible.';
    render();
}

function render() {
    elementos.preguntasRestantes.textContent = `Tienes ${estado.preguntasRestantes} preguntas restantes:`;
    elementos.cajaRespuestas.innerHTML = estado.respuestas
        .slice(0, 10)
        .map((texto) => `<div class="respuesta">${texto}</div>`)
        .join('');
    elementos.mensajeJuego.textContent = estado.mensaje;

    if (estado.categoria === 'edad') {
        elementos.inputTexto.placeholder = 'Usa el control para elegir edad';
        elementos.inputTexto.disabled = true;
    } else if (estado.categoria === 'altura') {
        elementos.inputTexto.placeholder = 'Usa el control para elegir altura';
        elementos.inputTexto.disabled = true;
    } else if (['club', 'pais', 'posicion'].includes(estado.categoria)) {
        elementos.inputTexto.placeholder = 'Selecciona o escribe aquí';
        elementos.inputTexto.disabled = false;
    } else {
        elementos.inputTexto.placeholder = 'Elige una categoría';
        elementos.inputTexto.disabled = true;
    }

    if (['club', 'pais', 'posicion'].includes(estado.categoria)) {
        actualizarDatalist();
    }

    configurarSliderPorCategoria();
    actualizarBotones();

    elementos.btnPreguntar.disabled = !puedeHacerPregunta();
    elementos.btnAdivinar.disabled = estado.juegoTerminado || estado.preguntasRestantes <= 0 || !entradaAdivinarValida();
    elementos.btnCamara.disabled = estado.juegoTerminado;
    elementos.btnMarcar.disabled = estado.juegoTerminado || estado.respuestas.length === 0;
    actualizarDatalistAdivinar();

    if (estado.pistaActiva) {
        elementos.pista.classList.add('visible');
    } else {
        elementos.pista.classList.remove('visible');
        elementos.pista.textContent = 'Pulsa el icono de cámara para mostrar una pista.';
    }
}

function vincularEventos() {
    elementos.botonActual?.addEventListener('click', () => seleccionarPeriodo('actual'));
    elementos.botonPasado?.addEventListener('click', () => seleccionarPeriodo('pasado'));

    Object.entries(elementos.botonesCategoria).forEach(([categoria, boton]) => {
        if (!boton) return;
        boton.addEventListener('click', () => seleccionarCategoria(categoria));
    });

    Object.entries(elementos.botonesComparador).forEach(([comparador, boton]) => {
        if (!boton) return;
        boton.addEventListener('click', () => seleccionarComparador(comparador));
    });

    if (elementos.inputRango) {
        elementos.inputRango.addEventListener('input', () => {
            actualizarValorRango();
            render();
        });
    }

    elementos.inputTexto?.addEventListener('input', () => {
        actualizarDatalist();
        render();
    });
    elementos.inputAdivinar?.addEventListener('input', () => {
        actualizarDatalistAdivinar();
        render();
    });

    elementos.btnPreguntar?.addEventListener('click', hacerPregunta);
    elementos.btnAdivinar?.addEventListener('click', intentarAdivinar);
    elementos.btnCamara?.addEventListener('click', mostrarPista);
    elementos.btnMarcar?.addEventListener('click', marcarRespuesta);
}

function marcarRespuesta() {
    if (estado.respuestas.length === 0) {
        estado.mensaje = 'No hay respuesta para marcar.';
        render();
        return;
    }
    if (!estado.respuestas[0].startsWith('🏁')) {
        estado.respuestas[0] = `🏁 ${estado.respuestas[0]}`;
        estado.mensaje = 'Respuesta marcada.';
    } else {
        estado.mensaje = 'La respuesta ya está marcada.';
    }
    render();
}

vincularEventos();
inicializarJuego();
cargarJugadores();
