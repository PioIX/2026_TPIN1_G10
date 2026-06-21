const API_URL = "http://localhost:4000";

async function registrarUsuario(){
    let nombre = document.getElementById("nombre").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if(nombre === "" || email === "" || password === ""){
        ui.showModal("Error", "Por favor, complete todos los campos.");
        return;
    }
    if(!validateEmail(email)){
        ui.showModal("Error", "Por favor, ingrese un correo electrónico válido.");
        return;
    }
    if(!validatePassword(password)){
        ui.showModal("Error", "La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: nombre,
                email: email,
                password: password
            })
        });

        const msj = await response.text();
        
        if(msj === "El usuario ya existe"){
            ui.showModal("Error", "Este correo electrónico ya está registrado.");

        } else if(msj === "Usuario registrado"){
            ui.showModal("Éxito", "Usuario registrado correctamente. Redirigiendo...");
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 2000);
        } else {
            ui.showModal("Error", msj);
        }
    } catch(error) {
        ui.showModal("Error", "Error al conectar con el servidor: " + error.message);
        console.error("Error:", error);
    }
}

async function loginUsuario(){
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if(email === "" || password === ""){
        ui.showModal("Error", "Por favor, complete todos los campos.");
        return;
    }

    try {
        let response = await fetch(`${API_URL}/usuarios`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        let usuarios = await response.json();
        
        let usuarioEncontrado = usuarios.find(u => u.email === email && u.contrasena === password);
        
        if(usuarioEncontrado){
            ui.showModal("Éxito", "Inicio de sesión exitoso. Redirigiendo...");
            localStorage.setItem("usuarioId", usuarioEncontrado.id);
            localStorage.setItem("usuarioNombre", usuarioEncontrado.name);
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 2000);
        } else {
            ui.showModal("Error", "Correo o contraseña incorrectos.");
        }
    } catch(error) {
        ui.showModal("Error", "Error al conectar con el servidor: " + error.message);
        console.error("Error:", error);
    }
}

function validateEmail(email){
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password){
    return password.length >= 6;
}
