

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
