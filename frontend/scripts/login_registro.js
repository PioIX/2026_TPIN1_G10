    function registrarUsuario(){
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
    ui.showModal("Éxito", "Usuario registrado correctamente.");
//agregado a bdd, cambio de pantalla, etc.




}

function loginUsuario(){
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if(email === "" || password === ""){
        ui.showModal("Error", "Por favor, complete todos los campos.");
        return;
    }else{
        ui.showModal("Éxito", "Inicio de sesión exitoso.");
        //validar contra bdd, cambio de pantalla, etc.
    }
}

function validateEmail(email){
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);

}

function validatePassword(password){
    return password.length >= 6;
}
