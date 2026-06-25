const formJugadorCompleto = document.getElementById('form-jugador-completo');
const formClubes = document.getElementById('form-clubes');
const mensajeJugadorCompleto = document.getElementById('mensaje-jugador-completo');
const mensajeClubes = document.getElementById('mensaje-clubes');

async function enviarFormulario(form, url, mensajeElemento, metodo = 'POST') {
    mensajeElemento.textContent = 'Guardando...';

    const datos = new FormData(form);
    const payload = {};

    datos.forEach((value, key) => {
        payload[key] = value;
    });

    try {
        const respuesta = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const texto = await respuesta.text();
        mensajeElemento.textContent = texto;

        if (respuesta.ok) {
            form.reset();
        }
    } catch (error) {
        console.error(error);
        mensajeElemento.textContent = 'No se pudo conectar con el backend.';
    }
}

async function obtenerIdJugadorCreado(nombre, apellido, idEquipo) {
    const respuesta = await fetch('http://localhost:4000/jugadores');
    const jugadores = await respuesta.json();

    const jugador = jugadores
        .filter((item) => item.nombre === nombre && item.apellido === apellido && String(item.id_equipo) === String(idEquipo))
        .sort((a, b) => Number(b.id_jugador) - Number(a.id_jugador))[0];

    return jugador ? jugador.id_jugador : null;
}

if (formJugadorCompleto) {
    formJugadorCompleto.addEventListener('submit', async function (event) {
        event.preventDefault();

        const datos = new FormData(formJugadorCompleto);
        const payloadJugador = {
            nombre: datos.get('nombre'),
            apellido: datos.get('apellido'),
            pais: datos.get('pais'),
            posicion: datos.get('posicion'),
            poisicion: datos.get('posicion'),
            dorsal_equipo: Number(datos.get('dorsal_equipo')),
            dorsal_seleccion: Number(datos.get('dorsal_seleccion')),
            valor_mercado: Number(datos.get('valor_mercado')),
            id_equipo: Number(datos.get('id_equipo'))
        };

        mensajeJugadorCompleto.textContent = 'Creando jugador...';

        try {
            const respuestaJugador = await fetch('http://localhost:4000/jugadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadJugador)
            });

            const textoJugador = await respuestaJugador.text();
            if (!respuestaJugador.ok) {
                mensajeJugadorCompleto.textContent = textoJugador;
                return;
            }

            const idJugador = await obtenerIdJugadorCreado(
                payloadJugador.nombre,
                payloadJugador.apellido,
                payloadJugador.id_equipo
            );

            if (!idJugador) {
                mensajeJugadorCompleto.textContent = 'No se pudo obtener el ID del jugador creado.';
                return;
            }

            const payloadDatos = {
                id_jugador: idJugador,
                edad: Number(datos.get('edad')),
                altura: Number(datos.get('altura')),
                peso: Number(datos.get('peso')),
                pierna_habil: datos.get('pierna_habil')
            };

            const payloadEstadisticas = {
                id_jugador: idJugador,
                goles: Number(datos.get('goles')),
                asistencias: Number(datos.get('asistencias')),
                titulos_equipo: Number(datos.get('titulos_equipo')),
                titulos_seleccion: Number(datos.get('titulos_seleccion')),
                titulos_individuales: Number(datos.get('titulos_individuales'))
            };

            const payloadTrayectoria = {
                id_jugador: idJugador,
                id_equipo: Number(datos.get('id_equipo')),
                anio_traspaso: Number(datos.get('anio_traspaso')),
                anio_ingreso: Number(datos.get('anio_ingreso'))
            };

            mensajeJugadorCompleto.textContent = 'Guardando datos adicionales...';

            const respuestas = await Promise.all([
                fetch('http://localhost:4000/datos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadDatos)
                }),
                fetch('http://localhost:4000/estadisticas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadEstadisticas)
                }),
                fetch('http://localhost:4000/trayectoria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadTrayectoria)
                })
            ]);

            const textos = await Promise.all(respuestas.map((respuesta) => respuesta.text()));
            const hayError = respuestas.some((respuesta) => !respuesta.ok);

            if (hayError) {
                mensajeJugadorCompleto.textContent = textos.join(' | ');
            } else {
                mensajeJugadorCompleto.textContent = `${textoJugador} · Datos, estadísticas y trayectoria guardados.`;
                formJugadorCompleto.reset();
            }
        } catch (error) {
            console.error(error);
            mensajeJugadorCompleto.textContent = 'No se pudo conectar con el backend.';
        }
    });
}

if (formClubes) {
    formClubes.addEventListener('submit', function (event) {
        event.preventDefault();
        enviarFormulario(formClubes, 'http://localhost:4000/equipos', mensajeClubes);
    });
}
