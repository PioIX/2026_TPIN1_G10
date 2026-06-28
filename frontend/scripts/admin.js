const formJugador = document.getElementById('form-jugador-completo');
const formClubes = document.getElementById('form-clubes');
const msgJugador = document.getElementById('mensaje-jugador-completo');
const msgClubes = document.getElementById('mensaje-clubes');

function formToObj(form) {
    const o = {};
    new FormData(form).forEach((v, k) => o[k] = v);
    return o;
}

function buscarId(jugadores, nombre, apellido, idEquipo) {
    for (let i = jugadores.length - 1; i >= 0; i--) {
        const j = jugadores[i];
        if (j.nombre === nombre && j.apellido === apellido && String(j.id_equipo) === String(idEquipo)) return j.id_jugador;
    }
    return null;
}

if (formJugador) {
    formJugador.addEventListener('submit', async function (e) {
        e.preventDefault();
        msgJugador.textContent = 'Creando...';
        const f = formToObj(formJugador);
        const jugador = {
            nombre: f.nombre,
            apellido: f.apellido,
            pais: f.pais,
            posicion: f.posicion,
            dorsal_equipo: Number(f.dorsal_equipo) || 0,
            dorsal_seleccion: Number(f.dorsal_seleccion) || 0,
            valor_mercado: Number(f.valor_mercado) || 0,
            id_equipo: Number(f.id_equipo) || 0
        };

        try {
            const res1 = await fetch('http://localhost:4000/jugadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jugador)
            });
            const text1 = await res1.text();
            if (!res1.ok) { msgJugador.textContent = text1; return; }

            const jugadores = await (await fetch('http://localhost:4000/jugadores')).json();
            const idJugador = buscarId(jugadores, jugador.nombre, jugador.apellido, jugador.id_equipo);
            if (!idJugador) { msgJugador.textContent = 'No se obtuvo el ID.'; return; }

            const datos = { id_jugador: idJugador, edad: Number(f.edad) || 0, altura: Number(f.altura) || 0, peso: Number(f.peso) || 0, pierna_habil: f.pierna_habil };
            const estadisticas = { id_jugador: idJugador, goles: Number(f.goles) || 0, asistencias: Number(f.asistencias) || 0, titulos_equipo: Number(f.titulos_equipo) || 0, titulos_seleccion: Number(f.titulos_seleccion) || 0, titulos_individuales: Number(f.titulos_individuales) || 0 };
            const trayectoria = { id_jugador: idJugador, id_equipo: Number(f.id_equipo) || 0, anio_traspaso: Number(f.anio_traspaso) || 0, anio_ingreso: Number(f.anio_ingreso) || 0 };

            msgJugador.textContent = 'Guardando datos...';
            const r = await Promise.all([
                fetch('http://localhost:4000/datos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }),
                fetch('http://localhost:4000/estadisticas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(estadisticas) }),
                fetch('http://localhost:4000/trayectoria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trayectoria) })
            ]);
            const texts = await Promise.all(r.map(x => x.text()));
            if (r.some(x => !x.ok)) msgJugador.textContent = texts.join(' | ');
            else { msgJugador.textContent = text1 + ' · Guardado.'; formJugador.reset(); }

        } catch (err) {
            console.error(err);
            msgJugador.textContent = 'No se pudo conectar con el backend.';
        }
    });
}

if (formClubes) {
    formClubes.addEventListener('submit', async function (e) {
        e.preventDefault();
        msgClubes.textContent = 'Guardando...';
        const payload = formToObj(formClubes);
        try {
            const r = await fetch('http://localhost:4000/equipos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const t = await r.text();
            msgClubes.textContent = t;
            if (r.ok) formClubes.reset();
        } catch (err) {
            console.error(err);
            msgClubes.textContent = 'No se pudo conectar con el backend.';
        }
    });
}
