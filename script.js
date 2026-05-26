var map = L.map('map').setView([-0.2299, -78.5249], 13);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'OpenStreetMap'
}).addTo(map);

// CONTADOR REAL (NO MANUAL)
function actualizarTotal(){
document.getElementById("total").innerHTML =
document.querySelectorAll("#tablaReportes tr").length;
}

// MAPA + TABLA
function obtenerUbicacion(){

let tipo = document.getElementById("tipo").value;
let descripcion = document.getElementById("descripcion").value;

if(navigator.geolocation){

navigator.geolocation.getCurrentPosition(function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

// MAPA
L.marker([lat, lon])
.addTo(map)
.bindPopup("<b>" + tipo + "</b><br>" + descripcion);

map.setView([lat, lon], 15);

// TABLA
agregarTabla(tipo, descripcion, lat, lon);

// CONTADOR
actualizarTotal();

alert("Reporte registrado");

});

}else{
alert("GPS no compatible");
}

}

// TABLA
function agregarTabla(tipo, descripcion, lat, lon){

let tabla = document.getElementById("tablaReportes");

let fila = `
<tr>
    <td>${tipo}</td>
    <td>${descripcion}</td>
    <td>${lat.toFixed(4)}, ${lon.toFixed(4)}</td>
</tr>
`;

tabla.innerHTML += fila;
}

// FILTRO SIMPLE (SIN FIREBASE)
function filtrar(){

let filtro = document.getElementById("filtro").value;
let filas = document.querySelectorAll("#tablaReportes tr");

filas.forEach(fila => {

let tipo = fila.cells[0].innerText;

if(filtro === "Todos" || tipo === filtro){
fila.style.display = "";
}else{
fila.style.display = "none";
}

});

actualizarTotal();
}