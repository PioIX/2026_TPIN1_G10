
// URL donde está el servidor backend que tiene los datos de jugadores
const API_URL = 'http://localhost:4000';

const MAX_INTENTOS = 6;

// Colores para marcar las letras (en formato hexadecimal):

const COLOR_CORRECTO = '#4caf50';
const COLOR_CERCANO = '#f1c40f';
const COLOR_INCORRECTO = '#7f8c8d';

// ============================================================================
// BÚSQUEDA DE ELEMENTOS DEL HTML
// ============================================================================

// Busca el div donde se mostrarán las casillas del tablero
const tablero = document.getElementById('tablero');

// Busca el div donde se mostrarán mensajes como "Ganaste" o "Faltan letras"
const mensaje = document.getElementById('mensaje');

// Busca TODOS los botones del teclado en pantalla
const teclas = document.querySelectorAll('.tecla');

// Guarda la palabra que el jugador tiene que adivinar
// Empieza vacía porque se carga desde la BDD
let palabraSecreta = '';

// Cuál es la fila actual (0 = primera fila, 1 = segunda, etc.)
// El jugador tiene 6 filas para adivinar
let intentoActual = 0;

// En qué posición de la fila actual estoy escribiendo
// Si la palabra tiene 6 letras: 0, 1, 2, 3, 4, 5
let letraActual = 0;

let juegoTerminado = false;

// Lista que guarda TODAS las casillas del tablero
let celdas = [];


// ============================================================================
// FUNCIÓN: limpiarTexto
// ============================================================================
// PROPÓSITO: Convertir cualquier texto en un formato estándar para comparar
// Por ejemplo: "Álvarez" se convierte en "ALVAREZ"
// Esto es importante porque sin esta limpieza, "álvarez" y "ALVAREZ" serían
// considerados diferentes, lo cual sería un problema.
// ============================================================================

function limpiarTexto(texto) {
    return texto
        // .normalize('NFD')
        // NFD = Normal Form Decomposed
        // Esto SEPARA las letras con tilde de su acento
        // Ejemplo: Á se convierte en A + un marcador de acento separado
        .normalize('NFD')
        
        // .replace(/[^a-zA-Z]/g, '')
        // Esta es una EXPRESIÓN REGULAR (regex)
        // [^a-zA-Z] significa: "TODO lo que NO sea una letra (de a-z o A-Z)"
        // /g al final significa "global" = hazlo en toda la cadena
        // Resultado: elimina números, espacios, signos, etc.
        // Ejemplo: "Juan 123!" se convierte en "Juan"
        .replace(/[^a-zA-Z]/g, '')
        
        // .replace(/[\u0300-\u036f]/g, '')
        // \u0300-\u036f es el RANGO UNICODE de acentos combinados
        // Después de normalize(), los acentos quedan como caracteres separados
        // Esta línea los borra
        // Ejemplo: "Á" (ahora separado como A + acento) se convierte en "A"
        .replace(/[\u0300-\u036f]/g, '')
        
        .toUpperCase();
}


function mostrarMensaje(texto) {
    // mensaje.textContent = texto
    // textContent es una propiedad que CAMBIA el texto visible
    mensaje.textContent = texto;
}


// ============================================================================
// FUNCIÓN: crearTablero
// ============================================================================
// PROPÓSITO: Construir el tablero visual con filas y casillas
// CÓMO FUNCIONA:
// 1. Borra el tablero anterior (si hay)
// 2. Crea 6 filas (porque hay 6 intentos)
// 3. En cada fila crea N casillas (donde N = cantidad de letras de la palabra)
// 4. Todas las casillas empiezan con "_" (vacías)
// ============================================================================

function crearTablero() {
    // tablero.innerHTML = ''
    // innerHTML es todo el contenido HTML dentro de un elemento
    // Ponerlo a '' vacía completamente el elemento
    // Sirve para limpiar el tablero anterior
    tablero.innerHTML = '';
    
    // celdas = []
    // Vacía la lista de casillas para empezar de cero
    // Después vamos a llenar esta lista con las nuevas casillas
    celdas = [];

    // for (let fila = 0; fila < MAX_INTENTOS; fila++)
    // Este for REPITE el código 6 veces (porque MAX_INTENTOS = 6)
    for (let fila = 0; fila < MAX_INTENTOS; fila++) {
        // Crea un nuevo elemento div (un rectángulo en HTML)
        // Este div representará UNA FILA del tablero
        const filaElement = document.createElement('div');
        
        // className = 'fila'
        // Con esta clase, el CSS del archivo styles.css le da estilo
        filaElement.className = 'fila';

        // for (let col = 0; col < palabraSecreta.length; col++)
        // Este for REPITE el código tantas veces como letras tenga la palabra
        // Si la palabra tiene 7 letras, este for se repite 7 veces
        for (let col = 0; col < palabraSecreta.length; col++) {
            // document.createElement('div')
            // Crea un nuevo div pequeño (UNA CASILLA)
            const celda = document.createElement('div');
            
            // celda.className = 'letra'
            celda.className = 'letra';
            
            // celda.textContent = '_'
            // Pone un guion bajo como contenido inicial
            celda.textContent = '_';
            
            // filaElement.appendChild(celda)
            // appendChild = "agregar como hijo"
            // Esto METE la casilla DENTRO de la fila
            filaElement.appendChild(celda);
            
            // celdas.push(celda)
            // push = "empujar" = agregar al final de la lista
            // Guarda la casilla en el arreglo celdas
            celdas.push(celda);
        }

        // tablero.appendChild(filaElement)
        // Agrega la fila completa DENTRO del tablero
        tablero.appendChild(filaElement);
    }
}



// FUNCIÓN: obtenerCelda

// PROPÓSITO: Encontrar UNA CASILLA específica por su fila y columna
// PARÁMETROS:
//   - fila: el número de fila (0, 1, 2, etc.)
//   - col: el número de columna (0, 1, 2, etc.)
// RETORNA: el elemento div de esa casilla
//
// ¿POR QUÉ NECESITA ESTA FUNCIÓN?
// Todas las casillas están guardadas en un arreglo PLANO (de una dimensión)
// Pero necesitamos acceder a ellas como si fuera una MATRIZ (fila y columna)
// Esta función CONVIERTE de 1D a 2D
//
// EJEMPLO VISUAL:
// Si la palabra tiene 5 letras, el tablero se ve así:
// Fila 0: [0] [1] [2] [3] [4]
// Fila 1: [5] [6] [7] [8] [9]
// Fila 2: [10][11][12][13][14]
//
// Para obtener la casilla de fila 2, columna 3:
// Aplicamos la fórmula: 2 * 5 + 3 = 13
// Y obtenemos el índice 13, que es exacto
// 

function obtenerCelda(fila, col) {
    // Accede al arreglo celdas usando la fórmula de conversión:
    // fila * palabraSecreta.length + col
    // 
    return celdas[fila * palabraSecreta.length + col];
}


// ============================================================================
// FUNCIÓN: obtenerIntento
// ============================================================================

function obtenerIntento() {
    // Calcula el ÍNDICE donde empieza la fila actual
    // Si estoy en la fila 2 y la palabra tiene 6 letras:
    // inicio = 2 * 6 = 12
    const inicio = intentoActual * palabraSecreta.length;
    
    // const fin = inicio + palabraSecreta.length
    // Calcula el ÍNDICE donde termina la fila actual
    // Si inicio es 12 y la palabra tiene 6 letras:
    // fin = 12 + 6 = 18
    const fin = inicio + palabraSecreta.length;

    // celdas.slice(inicio, fin)
    // slice() EXTRAE una porción del arreglo
    // Toma desde el índice inicio hasta fin (sin incluir fin)
  
    // .map((celda) => celda.textContent)
    // map() TRANSFORMA cada elemento aplicando una función
    // Para cada casilla, toma su textContent (el texto visible)

    // .join('')
    // join() FUSIONA todos los elementos en una sola cadena
    // Los elementos se unen sin nada entre ellos ('')
    // Ejemplo: ['A', 'L', 'V', 'A', 'R'] se convierte en "ALVAR"
    
    return celdas.slice(inicio, fin).map((celda) => celda.textContent).join('');
}


// ============================================================================
// FUNCIÓN: colorDeLetra
// ============================================================================
// PROPÓSITO: Decidir qué color debe tener una letra basándose en si es correcta


function colorDeLetra(letra, indice) {
    // if (letra === palabraSecreta[indice])
    // palabraSecreta[indice] accede a la letra en esa posición
    // Ejemplo: si palabraSecreta es "ALVAREZ" y indice es 0:
    // palabraSecreta[0] = 'A'
    // Si letra = 'A', entonces la condición es TRUE
    if (letra === palabraSecreta[indice]) {
        // La letra está en el lugar correcto: devuelve VERDE
        return COLOR_CORRECTO;
    }

    // if (palabraSecreta.includes(letra))
    // includes() busca si la letra existe DENTRO de la palabra
    // Devuelve true o false
    if (palabraSecreta.includes(letra)) {
        return COLOR_CERCANO;
    }

    // Si no pasó ninguna de las condiciones anteriores:
    return COLOR_INCORRECTO;
}


// ============================================================================
// FUNCIÓN: escribirLetra
// ============================================================================
// PROPÓSITO: Agregar una letra a la fila actual del tablero

function escribirLetra(letra) {
    // if (juegoTerminado) return
    // Si el juego ya terminó, NO HACE NADA
    if (juegoTerminado) return;
    
    // if (letraActual >= palabraSecreta.length) return
    // Si ya escribí todas las letras que caben en la fila, NO ESCRIBE MÁS
    // Si letraActual es 6 pero la palabra tiene solo 6 letras:
    // letraActual >= 6 es true, entonces NO escribe
    if (letraActual >= palabraSecreta.length) return;

    // const celda = obtenerCelda(intentoActual, letraActual)
    // Busca la casilla en la que voy a escribir
    const celda = obtenerCelda(intentoActual, letraActual);

    // if (celda.textContent === '_')
    // Verifica si la casilla está vacía (tiene un guion bajo)
    // Esto evita que sobreescriba una letra ya escrita
    if (celda.textContent === '_') {
        // celda.textContent = letra
        // Pone la letra en la casilla
        // Ejemplo: si letra es 'A', pone 'A' en lugar de '_'
        celda.textContent = letra;
        
        letraActual++;
    }
}

function borrarLetra() {
    // Si el juego terminó, no borra nada
    if (juegoTerminado) return;
    

    // Si no hay ninguna letra escrita (estoy en la posición 0), no hay nada que borrar
    if (letraActual === 0) return;

    // letraActual--
    letraActual--;
        const celda = obtenerCelda(intentoActual, letraActual);
    
    // Reemplaza el contenido de la casilla con un guion bajo
    celda.textContent = '_';
}



// PROPÓSITO: Validar la palabra escrita, marcar colores, y decidir qué pasa
// PROCESO:
// 1. Verifica que la fila esté completa
// 2. Marca cada letra con el color correcto
// 3. Si acierta, el jugador GANA
// 4. Si falla, pasa a la siguiente fila
// 5. Si se acabaron los intentos, el jugador PIERDE

function revisarIntento() {
    // Si el juego ya terminó, no vuelve a verificar
    if (juegoTerminado) return;

    // obtenerIntento() trae la palabra escrita (con posibles guiones bajos)
    // .replace(/_/g, '') REEMPLAZA todos los guiones bajos por NADA (vacío)
    // /g significa "global" = reemplaza TODOS los guiones bajos
    // Ejemplo: si la fila es "ALV___", después del replace es "ALV"
    // Esto es importante porque queremos saber si la fila está COMPLETA
    const intento = obtenerIntento().replace(/_/g, '');

    // Si no tienen la misma cantidad, significa que faltan letras
    if (intento.length !== palabraSecreta.length) {
        mostrarMensaje('Faltan letras');
        return; 
    }

    // Este bucle marca cada letra con el color correspondiente
    for (let i = 0; i < palabraSecreta.length; i++) {
        const celda = obtenerCelda(intentoActual, i);
        
        // style.background CAMBIA el color de fondo de la casilla
        // colorDeLetra(intento[i], i) DECIDE qué color debe ser
        celda.style.background = colorDeLetra(intento[i], i);
    }

    // Comprueba si la palabra que escribió ES EXACTAMENTE IGUAL a la secreta
    if (intento === palabraSecreta) {
        // El jugador ACERTÓ:
        
        // Marca que el juego terminó
        juegoTerminado = true;
        

        mostrarMensaje('¡Ganaste!');
        
        return; 
    }

    // Si llegamos aquí, significa que el usuario FALLÓ en este intento

    // intentoActual++
    intentoActual++;
    
    // letraActual = 0
    // Reinicia la posición de escritura a 0 para la nueva fila
    letraActual = 0;

    // Si ya usé 6 intentos (intentoActual llega a 6), perdí
    if (intentoActual >= MAX_INTENTOS) {
        // El jugador PERDIÓ:
        
        juegoTerminado = true;
        
        mostrarMensaje(`Perdiste. La palabra era ${palabraSecreta}`);
    }
}


// FUNCIÓN: manejarTecla
// PROPÓSITO: Decidir qué hacer según la tecla que presionó el usuario
// LÓGICA:
// - Si aprieta ENTER: valida la palabra
// - Si aprieta BACKSPACE: borra
// - Si aprieta una letra: escribe

function manejarTecla(tecla) {
    if (tecla === 'ENTER') {
        // Revisa el intento
        revisarIntento();
        return; 
    }

    // if (tecla === 'BKSP')
    if (tecla === 'BKSP') {
        borrarLetra();
        return; 
    }

    // if (/^[A-Z]$/.test(tecla))
    // Esta es una EXPRESIÓN REGULAR que verifica si tecla es una letra
    // /^[A-Z]$/ significa:
    //   ^ = inicio de la cadena, [A-Z] = una letra de A a Z, $ = fin de la cadena
    // .test(tecla) VERIFICA si tecla cumple con ese patrón
    if (/^[A-Z]$/.test(tecla)) {
        escribirLetra(tecla);
    }
}


// FUNCIÓN: iniciarJuego (ASYNC)
// PROPÓSITO: Cargar los datos del servidor y preparar todo para jugar
// ============================================================================

async function iniciarJuego() {
    try {
        const respuesta = await fetch(`${API_URL}/jugadores`);
        
        const datos = await respuesta.json();

        // Solo AGREGA a la nueva lista si cumple
        const jugadoresValidos = datos.filter((jugador) => {
            // jugador.apellido es el apellido del jugador
            // || '' significa "si no existe, usa cadena vacía"
            const apellido = limpiarTexto(jugador.apellido || '');
            
            // Esto filtra SOLO apellidos de 3 a 8 letras
            return apellido.length >= 3 && apellido.length <= 8;
        });

        // Si la lista de jugadores válidos está VACÍA
        if (jugadoresValidos.length === 0) {
            mostrarMensaje('No hay jugadores para jugar');
            return; 
        }

        // Esta línea ELIGE UN JUGADOR AL AZAR
        // Math.random() devuelve un número decimal entre 0 y 1
        // * jugadoresValidos.length lo multiplica por la cantidad de jugadores
        // Si hay 10 jugadores: 0.7234 * 10 = 7.234
        // Math.floor() lo redondea hacia abajo: 7
        // jugadoresValidos[7] accede al jugador número 7 de la lista
        const jugador = jugadoresValidos[
            Math.floor(Math.random() * jugadoresValidos.length)
        ];

        palabraSecreta = limpiarTexto(jugador.apellido || '');
        
        mostrarMensaje('Adivina el apellido');
        
        // Crea el tablero visual con casillas vacías
        crearTablero();

    } catch (error) {
        
        console.error(error);
        
        mostrarMensaje('No se pudo cargar el juego');
    }
}


// ESCUCHA DEL TECLADO FÍSICO

// PROPÓSITO: Detectar cuando el usuario presiona una tecla en su teclado
// Esto ocurre en CUALQUIER momento mientras la página esté activa

// addEventListener('keydown', ...) = "escucha cuando se presiona una tecla"
// 'keydown' es el evento que se dispara CUANDO se presiona la tecla
// La función (evento) => { ... } se ejecuta cada vez que ocurre ese evento
document.addEventListener('keydown', (evento) => {
    // evento.key DICE QUÉ TECLA se presionó
    // .toUpperCase() CONVIERTE la letra a mayúsculas
    const tecla = evento.key.toUpperCase();

    // Verifica si la tecla es BACKSPACE O DELETE (ambas sirven para borrar)
    if (tecla === 'BACKSPACE' || tecla === 'DELETE') {
        // Convierte la tecla en el código 'BKSP' que entiende manejarTecla()
        manejarTecla('BKSP');
        return;
    }

    if (tecla === 'ENTER') {
        manejarTecla('ENTER');
        return;
    }

    // Verifica si la tecla es una letra (A-Z)
    // (igual que en manejarTecla())
    if (/^[A-Z]$/.test(tecla)) {
        manejarTecla(tecla);
    }
});

// ESCUCHA DEL TECLADO EN PANTALLA
// PROPÓSITO: Detectar cuando el usuario hace click en un botón del teclado visual

// teclas es la lista de TODOS los botones del teclado (que buscamos al inicio)
// forEach() RECORRE cada botón uno por uno
teclas.forEach((boton) => {
    // addEventListener('click', ...) = "escucha cuando se hace click en este botón"
    // 'click' es el evento que se dispara cuando el usuario hace click
    // La función () => { ... } se ejecuta cada vez que hace click en ese botón
    boton.addEventListener('click', () => {
        // boton.textContent OBTIENE el texto del botón
        // .trim() QUITA espacios al inicio y final
        manejarTecla(boton.textContent.trim());
    });
});

 // Inicia el juego al cargar la página
iniciarJuego();
