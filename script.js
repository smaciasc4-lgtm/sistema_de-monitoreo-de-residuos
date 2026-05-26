// Crear mapa
var map = L.map('map').setView([-0.2299, -78.5249], 13);

// Cargar mapa
L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'OpenStreetMap'
}).addTo(map);

// Contador
let total = 0;

// Función principal
function obtenerUbicacion(){

    let tipo =
    document.getElementById("tipo").value;

    let descripcion =
    document.getElementById("descripcion").value;

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(
        function(position){

            let lat = position.coords.latitude;
            let lon = position.coords.longitude;

            // Crear marcador
            L.marker([lat, lon])
            .addTo(map)
            .bindPopup(
                "<b>" + tipo + "</b><br>" +
                descripcion
            );

            // Mover mapa
            map.setView([lat, lon], 15);

            // Agregar tabla
            agregarTabla(
                tipo,
                descripcion,
                lat,
                lon
            );

            // Actualizar contador
            total++;

            document.getElementById("total")
            .innerHTML = total;

            alert("Reporte registrado");

        });

    }else{
        alert("GPS no compatible");
    }

}

// Función tabla
function agregarTabla(
tipo,
descripcion,
lat,
lon
){

    let tabla =
    document.getElementById("tablaReportes");

    let fila = `
    <tr>
        <td>${tipo}</td>
        <td>${descripcion}</td>
        <td>
        ${lat.toFixed(4)},
        ${lon.toFixed(4)}
        </td>
    </tr>
    `;

    tabla.innerHTML += fila;

}