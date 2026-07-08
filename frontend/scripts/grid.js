// ==========================================================
// FUTBOL11 GRID - GENERADOR DE GRILLA
// ==========================================================
//
// Este archivo se encarga de:
// - Pedir los datos al backend.
// - Crear una grilla 3x3.
// - Buscar combinaciones válidas de países y equipos.
// - Mostrar jugadores cuando el usuario adivina.
//
// La idea principal es NO elegir países y equipos al azar.
// Primero analizamos qué conexiones existen realmente.
// ==========================================================

// Dirección del backend
const BACKEND = "http://localhost:4000";

// Mínimo de jugadores necesarios por casilla
const MINIMO_JUGADORES = 3;

// Cantidad máxima de búsquedas para encontrar una grilla
const MAXIMOS_INTENTOS = 1000;

// ==========================================================
// NORMALIZAR TEXTO
// ==========================================================
//
// Sirve para comparar textos sin problemas.
//
// Ejemplo:
//
// "España"
// "españa"
// "ESPAÑA"
//
// pasan a ser:
//
// "espana"
//
// También elimina tildes.
//

function normalizarTexto(texto) {
  if (!texto) {
    return "";
  }

  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ==========================================================
// MEZCLAR ARRAY
// ==========================================================
//
// Mezcla elementos de un array.
// Se usa para que las grillas no sean siempre iguales.
//

function mezclarArray(array) {
  const nuevoArray = [...array];

  for (let i = nuevoArray.length - 1; i > 0; i--) {
    const posicion = Math.floor(Math.random() * (i + 1));

    const auxiliar = nuevoArray[i];

    nuevoArray[i] = nuevoArray[posicion];

    nuevoArray[posicion] = auxiliar;
  }

  return nuevoArray;
}

// ==========================================================
// CREAR RELACION JUGADOR - EQUIPOS
// ==========================================================
//
// Guarda en qué equipos jugó cada jugador.
//
// Resultado:
//
// {
//    25: [3,8,10],
//    40: [5]
// }
//
// Esto evita recorrer trayectorias constantemente.
//

function crearEquiposJugador(trayectorias) {
  const equiposJugador = {};

  trayectorias.forEach((trayectoria) => {
    const idJugador = trayectoria.id_jugador;

    if (!equiposJugador[idJugador]) {
      equiposJugador[idJugador] = new Set();
    }

    equiposJugador[idJugador].add(trayectoria.id_equipo);
  });

  return equiposJugador;
}

// ==========================================================
// CREAR CONEXIONES PAIS - EQUIPO
// ==========================================================
//
// Esta es la estructura principal.
//
// Guarda:
//
// Argentina + Barcelona
//
// y devuelve todos los jugadores que cumplen.
//
// Ejemplo:
//
// conexiones[ "argentina_5" ]
//
// devuelve jugadores argentinos
// que jugaron en el equipo 5.
//

function crearConexiones(jugadores, equiposJugador) {
  const conexiones = {};

  jugadores.forEach((jugador) => {
    const equipos = equiposJugador[jugador.id_jugador];

    if (!equipos) {
      return;
    }

    equipos.forEach((idEquipo) => {
      const clave = normalizarTexto(jugador.pais) + "_" + idEquipo;

      if (!conexiones[clave]) {
        conexiones[clave] = [];
      }

      conexiones[clave].push({
        id: jugador.id_jugador,

        nombre: jugador.nombre,

        apellido: jugador.apellido,

        pais: jugador.pais,
      });
    });
  });

  return conexiones;
}

// ==========================================================
// CREAR LISTA DE PAISES
// ==========================================================
//
// Obtiene países únicos desde jugadores.
//

function obtenerPaises(jugadores) {
  const paises = [];

  const vistos = new Set();

  jugadores.forEach((jugador) => {
    if (!jugador.pais) {
      return;
    }

    const paisNormalizado = normalizarTexto(jugador.pais);

    if (!vistos.has(paisNormalizado)) {
      vistos.add(paisNormalizado);

      paises.push({
        nombre: jugador.pais,
      });
    }
  });

  return paises;
}

// ==========================================================
// CREAR LISTA DE EQUIPOS
// ==========================================================

function obtenerEquipos(equipos) {
  return equipos.map((equipo) => ({
    id: equipo.id_equipo,

    nombre: equipo.nombre_equipo,
  }));
}
// ==========================================================
// OBTENER JUGADORES DE UNA CELDA
// ==========================================================
//
// Una celda se forma con:
//
// PAIS + EQUIPO
//
// Ejemplo:
//
// Argentina + Barcelona
//
// Busca esa conexión en el índice creado antes.
//

function obtenerJugadoresCelda(pais, equipo, conexiones) {
  const clave = normalizarTexto(pais.nombre) + "_" + equipo.id;

  return conexiones[clave] || [];
}

// ==========================================================
// FILTRAR PAISES UTILES
// ==========================================================
//
// Eliminamos países que no tienen suficientes conexiones.
//
// Ejemplo:
//
// Si un país solamente tiene jugadores
// en un equipo, probablemente no pueda
// formar una grilla 3x3.
//

function filtrarPaises(paises, equipos, conexiones) {
  return paises.filter((pais) => {
    let cantidadConexiones = 0;

    equipos.forEach((equipo) => {
      const jugadores = obtenerJugadoresCelda(pais, equipo, conexiones);

      if (jugadores.length >= MINIMO_JUGADORES) {
        cantidadConexiones++;
      }
    });

    return cantidadConexiones >= 3;
  });
}

// ==========================================================
// FILTRAR EQUIPOS UTILES
// ==========================================================
//
// Hace lo mismo pero con equipos.
//

function filtrarEquipos(paises, equipos, conexiones) {
  return equipos.filter((equipo) => {
    let cantidadConexiones = 0;

    paises.forEach((pais) => {
      const jugadores = obtenerJugadoresCelda(pais, equipo, conexiones);

      if (jugadores.length >= MINIMO_JUGADORES) {
        cantidadConexiones++;
      }
    });

    return cantidadConexiones >= 3;
  });
}

// ==========================================================
// VALIDAR GRILLA
// ==========================================================
//
// Revisa las 9 celdas.
//
// Devuelve:
//
// true  -> la grilla sirve
//
// false -> hay alguna celda mala
//

function validarGrilla(paises, equipos, conexiones) {
  for (let fila = 0; fila < 3; fila++) {
    for (let columna = 0; columna < 3; columna++) {
      const jugadores = obtenerJugadoresCelda(
        paises[fila],
        equipos[columna],
        conexiones,
      );

      if (jugadores.length < MINIMO_JUGADORES) {
        return false;
      }
    }
  }

  return true;
}

// ==========================================================
// CREAR DATOS DE UNA GRILLA
// ==========================================================
//
// Convierte:
//
// paises + equipos
//
// en:
//
// {
//   r0_c0: jugadores,
//   r0_c1: jugadores,
//   ...
// }
//
// Este formato es el mismo que usaba
// tu código original.
//

function crearDatosGrilla(paises, equipos, conexiones) {
  const jugadoresPorCelda = {};

  for (let fila = 0; fila < 3; fila++) {
    for (let columna = 0; columna < 3; columna++) {
      const clave = `r${fila}_c${columna}`;

      jugadoresPorCelda[clave] = obtenerJugadoresCelda(
        paises[fila],
        equipos[columna],
        conexiones,
      );
    }
  }

  return jugadoresPorCelda;
}

// ==========================================================
// BUSCAR GRILLA
// ==========================================================
//
// Intenta encontrar una combinación válida.
//
// Primero usa filtros para reducir muchísimo
// la cantidad de posibilidades.
//
// Después prueba combinaciones mezcladas.
//
// Si encuentra una donde las 9 celdas tienen
// jugadores, la devuelve.
//

function buscarGrilla(paises, equipos, conexiones) {
  const paisesDisponibles = filtrarPaises(paises, equipos, conexiones);

  const equiposDisponibles = filtrarEquipos(
    paisesDisponibles,
    equipos,
    conexiones,
  );

  if (paisesDisponibles.length < 3 || equiposDisponibles.length < 3) {
    return null;
  }

  for (let intento = 0; intento < MAXIMOS_INTENTOS; intento++) {
    const paisesPrueba = mezclarArray(paisesDisponibles).slice(0, 3);

    const equiposPrueba = mezclarArray(equiposDisponibles).slice(0, 3);

    if (validarGrilla(paisesPrueba, equiposPrueba, conexiones)) {
      return {
        filas: paisesPrueba,

        columnas: equiposPrueba,

        jugadores: crearDatosGrilla(paisesPrueba, equiposPrueba, conexiones),
      };
    }
  }

  return null;
}
// ==========================================================
// CARGAR GRILLA
// ==========================================================
//
// Esta es la función principal.
//
// Hace:
//
// 1) Pide los datos al backend.
// 2) Prepara jugadores, equipos y trayectorias.
// 3) Crea las conexiones país-equipo.
// 4) Busca una grilla válida.
// 5) La manda a dibujar.
//
// ==========================================================

async function cargarGrilla() {
  try {
    const respuesta = await fetch(`${BACKEND}/grid`);

    const datos = await respuesta.json();

    // ------------------------------
    // Obtener información del backend
    // ------------------------------

    const equipos = Array.isArray(datos.equipos) ? datos.equipos : [];

    const jugadores = Array.isArray(datos.jugadores) ? datos.jugadores : [];

    const trayectorias = Array.isArray(datos.trayectorias)
      ? datos.trayectorias
      : [];

    if (equipos.length < 3 || jugadores.length === 0) {
      mostrarError("No hay suficientes datos para crear la grilla.");

      return;
    }

    // ------------------------------
    // Crear estructuras rápidas
    // ------------------------------

    const equiposJugador = crearEquiposJugador(trayectorias);

    const conexiones = crearConexiones(jugadores, equiposJugador);

    const paises = obtenerPaises(jugadores);

    const listaEquipos = obtenerEquipos(equipos);

    // ------------------------------
    // Buscar una grilla válida
    // ------------------------------

    const grilla = buscarGrilla(paises, listaEquipos, conexiones);

    if (!grilla) {
      mostrarError("No existe una combinación válida con los datos actuales.");

      return;
    }

    // ------------------------------
    // Dibujar grilla
    // ------------------------------

    renderGrid({
      rows: grilla.filas,

      cols: grilla.columnas,

      matches: grilla.jugadores,

      players: jugadores,
    });
  } catch (error) {
    console.error("Error cargando grilla:", error);

    mostrarError("Error al cargar la grilla.");
  }
}

// ==========================================================
// MOSTRAR ERROR
// ==========================================================
//
// Limpia la grilla y muestra un mensaje.
//

function mostrarError(mensaje) {
  const grilla = document.querySelector(".grid");

  if (grilla) {
    grilla.innerHTML = "";
  }

  const resultados = document.getElementById("results");

  if (resultados) {
    resultados.textContent = mensaje;
  }
}
// ==========================================================
// DIBUJAR GRILLA
// ==========================================================
//
// Recibe:
//
// filas    -> países
// columnas -> equipos
// matches  -> jugadores de cada celda
//
// Crea toda la tabla visual.
//
// ==========================================================
// CACHE DE IMÁGENES
// ==========================================================
//
// Guarda fotos ya buscadas para no repetir llamadas.
//

const cacheFotosJugadores = {};
const cacheFotosEquipos = {};

// ==========================================================
// BUSCAR FOTO DE JUGADOR
// ==========================================================

async function obtenerFotoJugador(nombreCompleto) {
  const clave = normalizarTexto(nombreCompleto);

  // Si ya la buscamos antes
  if (cacheFotosJugadores[clave]) {
    return cacheFotosJugadores[clave];
  }

  try {
    const respuesta = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(nombreCompleto)}`,
    );

    const datos = await respuesta.json();

    if (datos.player && datos.player.length > 0) {
      const jugador = datos.player[0];

      const foto = jugador.strCutout || jugador.strThumb || "";

      cacheFotosJugadores[clave] = foto;

      return foto;
    }
  } catch (error) {
    console.error("Error buscando jugador:", error);
  }

  return "";
}

// ==========================================================
// BUSCAR ESCUDO DE EQUIPO
// ==========================================================

async function obtenerEscudoEquipo(nombreEquipo) {
  const clave = normalizarTexto(nombreEquipo);

  if (cacheFotosEquipos[clave]) {
    return cacheFotosEquipos[clave];
  }

  try {
    const respuesta = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(nombreEquipo)}`,
    );

    const datos = await respuesta.json();

    if (datos.teams && datos.teams.length > 0) {
      const escudo = datos.teams[0].strBadge || "";

      cacheFotosEquipos[clave] = escudo;

      return escudo;
    }
  } catch (error) {
    console.error("Error buscando equipo:", error);
  }

  return "";
}
function renderGrid(datos) {
  const contenedor = document.querySelector(".grid");

  if (!contenedor) {
    return;
  }

  // Limpia una grilla anterior

  contenedor.innerHTML = "";

  // ------------------------------
  // Esquina superior izquierda
  // ------------------------------

  const esquina = document.createElement("div");

  esquina.className = "cell logo title";

  esquina.innerHTML = "FUTBOL11<br>GRID";

  contenedor.appendChild(esquina);

  // ------------------------------
  // Encabezados de equipos
  // ------------------------------

  for (let columna = 0; columna < 3; columna++) {
    const encabezado = document.createElement("div");

    encabezado.className = "cell logo";

    const equipo = datos.cols[columna];

    // Nombre del equipo
    encabezado.textContent = equipo.nombre;

    // Buscar escudo
    obtenerEscudoEquipo(equipo.nombre).then((escudo) => {
      if (escudo) {
        const imagen = document.createElement("img");

        imagen.src = escudo;

        imagen.style.width = "40px";

        imagen.style.height = "40px";

        imagen.style.objectFit = "contain";

        encabezado.prepend(imagen);
      }
    });
    contenedor.appendChild(encabezado);
  }

  // ------------------------------
  // Filas con países + casillas
  // ------------------------------

  for (let fila = 0; fila < 3; fila++) {
    // Nombre del país

    const pais = document.createElement("div");

    pais.className = "cell logo";

    pais.textContent = datos.rows[fila].nombre;

    contenedor.appendChild(pais);

    // Crear las 3 casillas

    for (let columna = 0; columna < 3; columna++) {
      const celda = document.createElement("div");

      celda.className = "cell player clickable";

      const clave = `r${fila}_c${columna}`;

      celda.dataset.key = clave;

      celda.textContent = "?";

      celda.addEventListener("click", () => {
        mostrarCelda(datos, fila, columna);
      });

      contenedor.appendChild(celda);
    }
  }
}
// ==========================================================
// MOSTRAR CELDA
// ==========================================================
//
// Se ejecuta cuando el usuario toca una casilla.
// Muestra un input para intentar adivinar el jugador.
//
function mostrarCelda(datos, fila, columna) {
  const clave = `r${fila}_c${columna}`;

  const jugadores =
    datos.matches && datos.matches[clave] ? datos.matches[clave] : [];

  const resultados = document.getElementById("results");

  if (!resultados) {
    return;
  }

  resultados.innerHTML = "";

  const titulo = document.createElement("h3");

  titulo.textContent = `Celda (${fila + 1}, ${columna + 1}) - ${jugadores.length} jugador(es)`;

  resultados.appendChild(titulo);

  // INPUT

  const input = document.createElement("input");

  input.type = "text";

  input.placeholder = "Buscar jugador...";

  input.id = "buscadorJugador";

  // DATALIST

  const lista = document.createElement("datalist");

  lista.id = "listaJugadores";

  jugadores.forEach((jugador) => {
    const opcion = document.createElement("option");

    opcion.value = `${jugador.nombre} ${jugador.apellido}`;

    lista.appendChild(opcion);
  });

  input.setAttribute("list", "listaJugadores");

  // BOTÓN

  const boton = document.createElement("button");

  boton.textContent = "Probar";

  boton.style.marginLeft = "10px";

  // IMPORTANTE:
  // Primero agregamos el input

  resultados.appendChild(input);

  resultados.appendChild(boton);

  resultados.appendChild(lista);

  const respuesta = document.createElement("p");

  resultados.appendChild(respuesta);

  function comprobar() {
    const buscado = normalizarTexto(input.value);

    const encontrado = jugadores.find((jugador) => {
      const nombre = normalizarTexto(`${jugador.nombre} ${jugador.apellido}`);

      return nombre === buscado;
    });

    if (encontrado) {
      respuesta.textContent = "Correcto";

      revelarCelda(clave, encontrado);
    } else {
      respuesta.textContent = "Jugador incorrecto";
    }
  }

  boton.addEventListener("click", comprobar);

  input.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      comprobar();
    }
  });
} // ==========================================================
// REVELAR CELDA
// ==========================================================
//
// Cambia la "?" por el jugador encontrado.
//
// También bloquea la celda para que no se pueda
// volver a modificar.
//

function revelarCelda(clave, jugador) {
  const celda = document.querySelector(`[data-key="${clave}"]`);

  if (!celda) {
    return;
  }

  // Limpia el signo de pregunta

  celda.innerHTML = "";

  // Nombre completo

  const nombre = document.createElement("div");

  nombre.textContent = `${jugador.nombre} ${jugador.apellido}`;

  nombre.style.fontWeight = "700";

  // País

  const pais = document.createElement("div");

  pais.textContent = jugador.pais || "";

  pais.style.fontSize = "12px";

  celda.appendChild(nombre);

  celda.appendChild(pais);
  // Buscar foto del jugador

  obtenerFotoJugador(`${jugador.nombre} ${jugador.apellido}`).then((foto) => {
    if (foto) {
      const imagen = document.createElement("img");

      imagen.src = foto;

      imagen.style.width = "60px";

      imagen.style.height = "60px";

      imagen.style.objectFit = "contain";

      celda.prepend(imagen);
    }
  });
  // Clase visual de encontrado

  celda.classList.add("found");

  // Evita volver a tocar la celda

  celda.style.pointerEvents = "none";
}

// ==========================================================
// INICIAR APLICACIÓN
// ==========================================================
//
// Cuando termina de cargar el archivo,
// genera la primera grilla.
//

cargarGrilla();
