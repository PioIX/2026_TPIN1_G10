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
    if(password.length < 6){    
        ui.showModal("Error", "La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    ui.showModal("Éxito", "Usuario registrado correctamente.");
//agregado a bdd, cambio de pantala, etc.




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

fetch("https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=carvajal")
  .then(res => res.json())
  .then(data => {
    document.getElementById("fotoJugador").src =
      data.player[0].strCutout || data.player[0].strThumb;
  });

  
fetch("https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=independiente")
  .then(res => res.json())
  .then(data => {
    document.getElementById("fotoEquipo").src =
      data.teams[0].strBadge; // Escudo
  })
