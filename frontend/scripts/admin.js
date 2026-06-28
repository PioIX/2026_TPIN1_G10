// admin.js - versión comentada
// Explicación casi línea por línea. Asume que la base de datos usa IDs auto-incrementales.

// Obtener referencias a elementos del DOM por su id
const formJugador = document.getElementById('form-jugador-completo'); // formulario para crear jugador completo
const formClubes = document.getElementById('form-clubes'); // formulario para crear clubes
const msgJugador = document.getElementById('mensaje-jugador-completo'); // elemento donde mostramos mensajes para jugador
const msgClubes = document.getElementById('mensaje-clubes'); // elemento donde mostramos mensajes para clubes

// Convierte un <form> en un objeto plano { campo: valor }
function formToObj(form) {
    const o = {}; // objeto resultado
    // FormData itera sobre los campos del formulario y añadimos cada par clave/valor al objeto
    new FormData(form).forEach((v, k) => o[k] = v);
    return o; // devolvemos el objeto con los valores del formulario
}

// Buscar el último id_jugador que coincide por nombre, apellido e id_equipo
// Recorremos el arreglo de jugadores desde el final para encontrar el más reciente
function buscarId(jugadores, nombre, apellido, idEquipo) {
    for (let i = jugadores.length - 1; i >= 0; i--) {
        const j = jugadores[i]; // jugador actual en la iteración
        // comparamos nombre, apellido y id_equipo (convertido a string para seguridad)
        if (j.nombre === nombre && j.apellido === apellido && String(j.id_equipo) === String(idEquipo)) return j.id_jugador;
    }
    return null; // si no se encuentra, devolvemos null
}

// Si existe el formulario de jugador, añadimos el manejador de submit
if (formJugador) {
    formJugador.addEventListener('submit', async function (e) {
        e.preventDefault(); // evitar comportamiento por defecto (recarga)
        msgJugador.textContent = 'Creando...'; // mensaje al usuario

        // tomamos los valores del formulario como objeto
        const f = formToObj(formJugador);

        // preparamos el objeto jugador que enviaremos al backend
        const jugador = {
            nombre: f.nombre,
            apellido: f.apellido,
            pais: f.pais,
            posicion: f.posicion,
            dorsal_equipo: Number(f.dorsal_equipo) || 0, // convertir a número o usar 0
            dorsal_seleccion: Number(f.dorsal_seleccion) || 0,
            valor_mercado: Number(f.valor_mercado) || 0,
            id_equipo: Number(f.id_equipo) || 0
        };

        try {
            // Enviamos el jugador al endpoint /jugadores mediante POST
            const res1 = await fetch('http://localhost:4000/jugadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jugador)
            });

            // El backend responde con texto (mensaje o error)
            const text1 = await res1.text();
            if (!res1.ok) { msgJugador.textContent = text1; return; } // si hubo error, mostramos y salimos

            // Pedimos la lista completa de jugadores para localizar el id recién creado
            // (esto asume que el backend guarda el nuevo jugador y lo incluye en /jugadores)
            const jugadores = await (await fetch('http://localhost:4000/jugadores')).json();

            // Buscamos el último id que coincida con nombre+apellido+id_equipo
            const idJugador = buscarId(jugadores, jugador.nombre, jugador.apellido, jugador.id_equipo);
            if (!idJugador) { msgJugador.textContent = 'No se obtuvo el ID.'; return; } // si no lo encontramos, avisar

            // Preparamos los objetos adicionales que van en tablas relacionadas
            const datos = {
                id_jugador: idJugador,
                edad: Number(f.edad) || 0,
                altura: Number(f.altura) || 0,
                peso: Number(f.peso) || 0,
                pierna_habil: f.pierna_habil
            };

            const estadisticas = {
                id_jugador: idJugador,
                goles: Number(f.goles) || 0,
                asistencias: Number(f.asistencias) || 0,
                titulos_equipo: Number(f.titulos_equipo) || 0,
                titulos_seleccion: Number(f.titulos_seleccion) || 0,
                titulos_individuales: Number(f.titulos_individuales) || 0
            };

            const trayectoria = {
                id_jugador: idJugador,
                id_equipo: Number(f.id_equipo) || 0,
                anio_traspaso: Number(f.anio_traspaso) || 0,
                anio_ingreso: Number(f.anio_ingreso) || 0
            };

            // Avisamos que guardamos las tablas relacionadas
            msgJugador.textContent = 'Guardando datos...';

            // Enviamos las 3 peticiones en paralelo y esperamos los resultados
            const r = await Promise.all([
                fetch('http://localhost:4000/datos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }),
                fetch('http://localhost:4000/estadisticas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(estadisticas) }),
                fetch('http://localhost:4000/trayectoria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trayectoria) })
            ]);

            // Leemos los textos de respuesta de cada petición (mensajes del backend)
            const texts = await Promise.all(r.map(x => x.text()));

            // Si alguna petición falló mostramos todos los mensajes unidos, si no, confirmamos y reseteamos el formulario
            if (r.some(x => !x.ok)) msgJugador.textContent = texts.join(' | ');
            else { msgJugador.textContent = text1 + ' · Guardado.'; formJugador.reset(); }

        } catch (err) {
            // Capturamos errores de red o excepciones y mostramos mensaje genérico
            console.error(err);
            msgJugador.textContent = 'No se pudo conectar con el backend.';
        }
    });
}

// Mismo patrón para el formulario de clubes: convertir formulario a objeto y POST a /equipos
if (formClubes) {
    formClubes.addEventListener('submit', async function (e) {
        e.preventDefault(); // evitar recarga
        msgClubes.textContent = 'Guardando...'; // mensaje al usuario
        const payload = formToObj(formClubes); // convertimos form a objeto
        try {
            // Enviamos el payload al backend
            const r = await fetch('http://localhost:4000/equipos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const t = await r.text(); // leemos texto de respuesta
            msgClubes.textContent = t; // mostramos mensaje del servidor
            if (r.ok) formClubes.reset(); // si fue OK, limpiamos el form
        } catch (err) {
            // error de conexión
            console.error(err);
            msgClubes.textContent = 'No se pudo conectar con el backend.';
        }
    });
}
