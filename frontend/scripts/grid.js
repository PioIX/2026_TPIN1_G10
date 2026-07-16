// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================
const BACKEND = "http://localhost:4000";
const MINIMO_JUGADORES = 3;
const MAXIMOS_INTENTOS = 1000;

// Aquí guardamos las fotos de los jugadores y escudos para no pedirlos mil veces a internet
const cacheFotosJugadores = {};
const cacheFotosEquipos = {};

// ==========================================
// UTILIDADES Y NORMALIZACIÓN
// ==========================================

// Convierte cualquier texto a minúsculas, sin espacios extra y sin tildes para comparar sin fallas
function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// Mezcla un array aleatoriamente (Algoritmo Fisher-Yates) para que cada grilla sea distinta
function mezclarArray(array) {
    const nuevoArray = [...array];
    for (let i = nuevoArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]];
    }
    return nuevoArray;
}

// ==========================================
// PROCESAMIENTO DE DATOS (ESTRUCTURAS)
// ==========================================

// Crea un objeto para saber rápido en qué equipos jugó cada jugador según su ID
function crearEquiposJugador(trayectorias) {
    const equiposJugador = {};
    trayectorias.forEach(({ id_jugador, id_equipo }) => {
        if (!equiposJugador[id_jugador]) equiposJugador[id_jugador] = new Set();
        equiposJugador[id_jugador].add(id_equipo);
    });
    return equiposJugador;
}

// Vincula jugadores bajo llaves combinadas de "pais_idEquipo" (ej: "argentina_5")
function crearConexiones(jugadores, equiposJugador) {
    const conexiones = {};
    jugadores.forEach(j => {
        const equipos = equiposJugador[j.id_jugador];
        if (!equipos) return;

        equipos.forEach(idEquipo => {
            const clave = `${normalizarTexto(j.pais)}_${idEquipo}`;
            if (!conexiones[clave]) conexiones[clave] = [];
            conexiones[clave].push({ id: j.id_jugador, nombre: j.nombre, apellido: j.apellido, pais: j.pais });
        });
    });
    return conexiones;
}

// Genera una lista con los nombres de todos los países únicos que tienen los jugadores
function obtenerPaises(jugadores) {
    const vistos = new Set();
    const paises = [];
    jugadores.forEach(j => {
        const normalizado = normalizarTexto(j.pais);
        if (j.pais && !vistos.has(normalizado)) {
            vistos.add(normalizado);
            paises.push({ nombre: j.pais });
        }
    });
    return paises;
}

// Busca qué jugadores coinciden con un país y un equipo en específico
function obtenerJugadoresCelda(pais, equipo, conexiones) {
    return conexiones[`${normalizarTexto(pais.nombre)}_${equipo.id}`] || [];
}

// ==========================================
// FILTROS Y VALIDACIÓN DE LA GRILLA
// ==========================================

// Elimina países que no tengan suficientes jugadores en al menos 3 equipos distintos
function filtrarPaises(paises, equipos, conexiones) {
    return paises.filter(pais => {
        let cantidadConexiones = 0;
        equipos.forEach(equipo => {
            if (obtenerJugadoresCelda(pais, equipo, conexiones).length >= MINIMO_JUGADORES) {
                cantidadConexiones++;
            }
        });
        return cantidadConexiones >= 3;
    });
}

// Elimina equipos que no tengan suficientes jugadores en al menos 3 países distintos
function filtrarEquipos(paises, equipos, conexiones) {
    return equipos.filter(equipo => {
        let cantidadConexiones = 0;
        paises.forEach(pais => {
            if (obtenerJugadoresCelda(pais, equipo, conexiones).length >= MINIMO_JUGADORES) {
                cantidadConexiones++;
            }
        });
        return cantidadConexiones >= 3;
    });
}

// Revisa que las 9 celdas (3x3) tengan el mínimo de jugadores requerido para poder jugar
function validarGrilla(paises, equipos, conexiones) {
    for (let f = 0; f < 3; f++) {
        for (let c = 0; c < 3; c++) {
            if (obtenerJugadoresCelda(paises[f], equipos[c], conexiones).length < MINIMO_JUGADORES) return false;
        }
    }
    return true;
}

// Estructura las soluciones finales organizadas por celdas (r0_c0, r0_c1...)
function crearDatosGrilla(paises, equipos, conexiones) {
    const jugadoresPorCelda = {};
    for (let f = 0; f < 3; f++) {
        for (let c = 0; c < 3; c++) {
            jugadoresPorCelda[`r${f}_c${c}`] = obtenerJugadoresCelda(paises[f], equipos[c], connections = conexiones);
        }
    }
    return jugadoresPorCelda;
}

// Busca de forma aleatoria una combinación de 3 países y 3 equipos que funcione perfectamente
function buscarGrilla(paises, equipos, conexiones) {
    const paisesDisponibles = filtrarPaises(paises, equipos, conexiones);
    const equiposDisponibles = filtrarEquipos(paisesDisponibles, equipos, conexiones);

    if (paisesDisponibles.length < 3 || equiposDisponibles.length < 3) return null;

    for (let i = 0; i < MAXIMOS_INTENTOS; i++) {
        const pPrueba = mezclarArray(paisesDisponibles).slice(0, 3);
        const ePrueba = mezclarArray(equiposDisponibles).slice(0, 3);

        if (validarGrilla(pPrueba, ePrueba, conexiones)) {
            return { filas: pPrueba, columnas: ePrueba, jugadores: crearDatosGrilla(pPrueba, ePrueba, conexiones) };
        }
    }
    return null;
}

// ==========================================
// CONSULTAS ASÍNCRONAS DE IMÁGENES (APIs)
// ==========================================

// Trae las URLs de las fotos o escudos desde el servidor de SportsDB y las guarda en la caché
async function consultarAPI(url, claveCache, propiedadDato) {
    const cache = propiedadDato === "player" ? cacheFotosJugadores : cacheFotosEquipos;
    if (cache[claveCache]) return cache[claveCache];

    try {
        const res = await fetch(url);
        const datos = await res.json();
        const lista = datos[propiedadDato];
        if (lista && lista.length > 0) {
            const recurso = lista[0].strCutout || lista[0].strThumb || lista[0].strBadge || "";
            cache[claveCache] = recurso;
            return recurso;
        }
    } catch (e) { console.error("Error en API externa:", e); }
    return "";
}

// ==========================================
// INTERFAZ DE USUARIO Y RENDERIZADO
// ==========================================

// Pide los datos de los jugadores al backend e inicia todo el proceso de la grilla
async function cargarGrilla() {
    try {
        const res = await fetch(`${BACKEND}/grid`);
        const datos = await res.json();

        const equipos = Array.isArray(datos.equipos) ? datos.equipos : [];
        const jugadores = Array.isArray(datos.jugadores) ? datos.jugadores : [];
        const trayectorias = Array.isArray(datos.trayectorias) ? datos.trayectorias : [];

        if (equipos.length < 3 || jugadores.length === 0) return mostrarError("No hay suficientes datos.");

        const conexiones = crearConexiones(jugadores, crearEquiposJugador(trayectorias));
        const listaEquipos = equipos.map(e => ({ id: e.id_equipo, nombre: e.nombre_equipo }));
        const grilla = buscarGrilla(obtenerPaises(jugadores), listaEquipos, conexiones);

        if (!grilla) return mostrarError("No existe una combinación válida con los datos actuales.");

        renderGrid({ rows: grilla.filas, cols: grilla.columnas, matches: grilla.jugadores, players: jugadores });
    } catch (e) {
        console.error(e);
        mostrarError("Error al cargar la grilla.");
    }
}

function mostrarError(msg) {
    const grid = document.querySelector(".grid");
    if (grid) grid.innerHTML = "";
    const res = document.getElementById("results");
    if (res) res.textContent = msg;
}

// Dibuja visualmente el tablero 3x3 en el archivo HTML
function renderGrid(datos) {
    const contenedor = document.querySelector(".grid");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    // Celda de la esquina (Título del juego)
    const esquina = document.createElement("div");
    esquina.className = "cell logo title";
    esquina.innerHTML = "FULBO11<br>GRID";
    contenedor.appendChild(esquina);

    // Encabezados de Equipos (Columnas de arriba)
    datos.cols.forEach(eq => {
        const th = document.createElement("div");
        th.className = "cell logo";
        th.textContent = eq.nombre;
        
        consultarAPI(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(eq.nombre)}`, normalizarTexto(eq.nombre), "teams")
            .then(escudo => {
                if (!escudo) return;
                const img = Object.assign(document.createElement("img"), { src: escudo, style: "width:40px; height:40px; object-fit:contain;" });
                th.prepend(img);
            });
        contenedor.appendChild(th);
    });

    // Filas con los nombres de los Países (Izquierda) y sus 3 casillas de respuestas
    for (let f = 0; f < 3; f++) {
        const tdPais = document.createElement("div");
        tdPais.className = "cell logo";
        tdPais.textContent = datos.rows[f].nombre;
        contenedor.appendChild(tdPais);

        for (let c = 0; c < 3; c++) {
            const celda = document.createElement("div");
            celda.className = "cell player clickable";
            const clave = `r${f}_c${c}`;
            celda.dataset.key = clave;
            celda.textContent = "?";
            celda.addEventListener("click", () => mostrarCelda(datos, f, c));
            contenedor.appendChild(celda);
        }
    }
}

// Despliega el buscador interactivo abajo de la grilla al presionar cualquier casilla "?"
function mostrarCelda(datos, fila, columna) {
    const clave = `r${fila}_c${columna}`;
    const jugadores = datos.matches?.[clave] || [];
    const resultados = document.getElementById("results");
    if (!resultados) return;

    resultados.innerHTML = `
        <h3>Celda (${fila + 1}, ${columna + 1}) - ${jugadores.length} jugador(es)</h3>
        <input type="text" placeholder="Buscar jugador..." id="buscadorJugador" list="listaJugadores">
        <button id="btnProbar" style="margin-left: 10px;">Probar</button>
        <datalist id="listaJugadores">
            ${jugadores.map(j => `<option value="${j.nombre} ${j.apellido}"></option>`).join('')}
        </datalist>
        <p id="respuestaFeed"></p>
    `;

    const input = document.getElementById("buscadorJugador");
    const respuesta = document.getElementById("respuestaFeed");

    const comprobar = () => {
        const buscado = normalizarTexto(input.value);
        const encontrado = jugadores.find(j => normalizarTexto(`${j.nombre} ${j.apellido}`) === buscado);

        if (encontrado) {
            respuesta.textContent = "Correcto";
            revelarCelda(clave, encontrado);
        } else {
            respuesta.textContent = "Jugador incorrecto";
        }
    };

    document.getElementById("btnProbar").addEventListener("click", comprobar);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") comprobar(); });
}

// Cambia el signo "?" por el nombre del jugador descubierto y renderiza su imagen oficial
function revelarCelda(clave, jugador) {
    const celda = document.querySelector(`[data-key="${clave}"]`);
    if (!celda) return;

    celda.innerHTML = `
        <div style="font-weight: 700;">${jugador.apellido}</div>    `;

    const nombreCompleto = `${jugador.nombre} ${jugador.apellido}`;
    consultarAPI(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(nombreCompleto)}`, normalizarTexto(nombreCompleto), "player")
        .then(foto => {
            if (!foto) return;
            const img = Object.assign(document.createElement("img"), { src: foto, style: "width:60px; height:60px; object-fit:contain;" });
            celda.prepend(img);
        });

    celda.classList.add("found");
    celda.style.pointerEvents = "none"; // Congela la casilla para que ya no se pueda clickear
}

// Disparador inicial
cargarGrilla();