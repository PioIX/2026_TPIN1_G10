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
        respuesta = await realizarQuery(`SELECT * FROM Jugadores WHERE id_jugador=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Jugadores");
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

app.get('/jugadores', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Jugadores INNER JOIN Estadisticas on Estadisticas.id_jugador = Jugadores.id_jugador INNER JOIN Datos on Datos.id_jugador = Estadisticas.id_jugador WHERE Jugadores.id_jugador=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Jugadores INNER JOIN Estadisticas on Estadisticas.id_jugador = Jugadores.id_jugador INNER JOIN Datos on Datos.id_jugador = Estadisticas.id_jugador");
    }    
    res.send(respuesta);
})

app.get('/jugadores', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Jugadores INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Jugadores INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

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
    let jugadorExistente = await realizarQuery(`SELECT apellido FROM Jugadores WHERE apellido="${req.body.apellido}"`);
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
    let usuarioExistente = await realizarQuery(`SELECT email FROM Usuarios WHERE email="${req.body.email}"`);
    console.log(usuarioExistente)
    if (usuarioExistente.length > 0) {
        res.send("El usuario ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Usuarios (nombre_de_usuario,contrasena,email) VALUES
        ("${req.body.nombre_de_usuario}","${req.body.contrasena}","${req.body.email}");
        `)
        res.send("Usuario registrado")
    }
})

app.post('/datos', async function(req,res) {
    console.log(req.body)
    let datosExistentes = await realizarQuery(`SELECT id_jugador FROM Datos WHERE id_jugador=${req.body.id_jugador}`);
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
