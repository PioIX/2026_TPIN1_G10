var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');

var app = express(); //Inicializo express
var port = process.env.PORT || 4000; //Ejecuto el servidor en el puerto 4000

// Convierte una petición recibida (POST-GET...) a objeto JSON
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());

//Pongo el servidor a escuchar
app.listen(port, function(){
    console.log(`Server running in http://localhost:${port}`);
});

app.get('/', function(req, res){
    res.status(200).send({
        message: 'Entraste pa!'
    });
});

/**
 * req = request. en este objeto voy a tener todo lo que reciba del cliente
 * res = response. Voy a responderle al cliente
 */

//Pedidos GET

app.get('/usuarios', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Usuarios WHERE id_usuarios=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Usuarios");
    }    
    res.send(respuesta);
})

app.get('/datos', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Datos WHERE id_datos=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Datos");
    }    
    res.send(respuesta);
})

app.get('/estadisticas', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Estadisticas WHERE id_estadisticas=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Estadisticas");
    }    
    res.send(respuesta);
})

app.get('/jugadores', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT Jugadores.id_jugador, Jugadores.nombre, Jugadores.apellido, Jugadores.pais, Jugadores.posicion, Datos.edad, Datos.altura, Equipos.nombre_equipo, Trayectoria.anio_ingreso, Trayectoria.anio_traspaso FROM Jugadores LEFT JOIN Datos ON Datos.id_jugador = Jugadores.id_jugador LEFT JOIN Trayectoria ON Trayectoria.id_jugador = Jugadores.id_jugador LEFT JOIN Equipos ON Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`);
    } else {
        respuesta = await realizarQuery("SELECT Jugadores.id_jugador, Jugadores.nombre, Jugadores.apellido, Jugadores.pais, Jugadores.posicion, Datos.edad, Datos.altura, Equipos.nombre_equipo, Trayectoria.anio_ingreso, Trayectoria.anio_traspaso FROM Jugadores LEFT JOIN Datos ON Datos.id_jugador = Jugadores.id_jugador LEFT JOIN Trayectoria ON Trayectoria.id_jugador = Jugadores.id_jugador LEFT JOIN Equipos ON Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

app.get('/trayectoria', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Trayectoria WHERE id_trayectoria=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Trayectoria");
    }    
    res.send(respuesta);
})

app.get('/equipos', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Equipos WHERE id_equipos=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Equipos");
    }    
    res.send(respuesta);
})

// Endpoint para generar la grilla 3x3 con filas/columnas aleatorias
app.get('/grid', async function(req, res) {
    try {
        const jugadores = await realizarQuery("SELECT id_jugador, nombre, apellido, pais FROM Jugadores");
        const equipos = await realizarQuery("SELECT id_equipo, nombre_equipo FROM Equipos");
        const trayectorias = await realizarQuery("SELECT id_jugador, id_equipo FROM Trayectoria");
        return res.json({ equipos, jugadores, trayectorias });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: 'Error fetching grid data' });
    }
});

app.get('/datos', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Datos INNER JOIN Estadisticas on Estadisticas.id_jugador = Datos.id_jugador INNER JOIN Jugadores on Jugadores.id_jugador = Datos.id_jugador INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Datos INNER JOIN Estadisticas on Estadisticas.id_jugador = Datos.id_jugador INNER JOIN Jugadores on Jugadores.id_jugador = Datos.id_jugador INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

//Pedidos POST

app.post('/jugadores', async function(req,res) {
    console.log(req.body)
    let jugadorExistente = await realizarQuery(`SELECT apellido FROM Jugadores WHERE Jugadores.apellido="${req.body.apellido}"`);
    console.log(jugadorExistente)
    if (jugadorExistente.length > 0) {
        res.send("El jugador ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Jugadores (pais,posicion,dorsal_equipo,dorsal_seleccion,valor_mercado,nombre,apellido,id_equipo) VALUES
        ("${req.body.pais}","${req.body.poisicion}",${req.body.dorsal_equipo},${req.body.dorsal_seleccion},${req.body.valor_mercado},"${req.body.nombre}","${req.body.apellido}",${req.body.id_equipo});
        `)
        res.send("Jugador agregado")
    }
})

app.post('/usuarios', async function(req,res) {
    console.log(req.body)
    let usuarioExistente = await realizarQuery(`SELECT email FROM Usuarios WHERE Usuarios.email="${req.body.email}"`);
    console.log(usuarioExistente)
    if (usuarioExistente.length > 0) {
        res.send("El usuario ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Usuarios (nombre_de_usuario,password,email) VALUES
        ("${req.body.nombre_de_usuario}","${req.body.password}","${req.body.email}");
        `)
        res.send("Usuario registrado")
    }
})

app.post('/datos', async function(req,res) {
    console.log(req.body)
    let datosExistentes = await realizarQuery(`SELECT id_jugador FROM Datos WHERE Datos.id_jugador=${req.body.id_jugador}`);
    console.log(datosExistentes)
    if (datosExistentes.length > 0) {
        res.send("Los datos ya existen");
    } else {
        await realizarQuery(`
        INSERT INTO Datos (edad,altura,peso,pierna_habil,id_jugador) VALUES
        (${req.body.edad},${req.body.altura},${req.body.peso},"${req.body.pierna_habil}",${req.body.id_jugador});
        `)
        res.send("Datos agregados")
    }
})

app.post('/estadisticas', async function(req,res) {
    console.log(req.body)
    let estadisticasExistentes = await realizarQuery(`SELECT id_jugador FROM Estadisticas WHERE Estadisticas.id_jugador="${req.body.id_jugador}"`);
    console.log(estadisticasExistentes)
    if (estadisticasExistentes.length > 0) {
        res.send("Las estadisticas ya existen");
    } else {
        await realizarQuery(`
        INSERT INTO Estadisticas (goles,asistencias,titulos_equipo,titulos_seleccion,titulos_individuales,id_jugador) VALUES
        (${req.body.goles},${req.body.asistencias},${req.body.titulos_equipo},${req.body.titulos_seleccion},${req.body.titulos_individuales},${req.body.id_jugador});
        `)
        res.send("Estadisticas agregadas")
    }
})

app.post('/trayectoria', async function(req,res) {
    console.log(req.body)
    let trayectoriaExistente = await realizarQuery(`SELECT id_equipo FROM Trayectoria WHERE Trayectoria.id_equipo="${req.body.id_equipo}"`);
    console.log(trayectoriaExistente)
    if (trayectoriaExistente.length > 0) {
        res.send("La trayectoria ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Trayectoria (id_equipo,id_jugador,anio_traspaso,anio_ingreso) VALUES
        (${req.body.id_equipo},${req.body.id_jugador},${req.body.anio_traspaso},${req.body.anio_ingreso});
        `)
        res.send("Trayectoria agregada")
    }
})

app.post('/equipos', async function(req,res) {
    console.log(req.body)
    let equipoExistente = await realizarQuery(`SELECT nombre_equipo FROM Equipos WHERE Equipos.nombre_equipo="${req.body.nombre_equipo}"`);
    console.log(equipoExistente)
    if (equipoExistente.length > 0) {
        res.send("El equipo ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Equipos (anio_creacion,titulos_nacionales,titulos_internacionales,ciudad,presidente,dt_actual,apodo,cantidad_socios,estadio,nombre_equipo) VALUES
        (${req.body.anio_creacion},${req.body.titulos_nacionales},${req.body.titulos_internacionales},"${req.body.ciudad}","${req.body.presidente}","${req.body.dt_actual}","${req.body.apodo}",${req.body.cantidad_socios},"${req.body.estadio}","${req.body.nombre_equipo}");
        `)
        res.send("Equipo agregado")
    }
})
