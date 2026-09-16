// Reglas geográficas independientes del mapa y de la base de datos.
(function (raiz) {
    'use strict';
    const DISTANCIA_METROS = 100;
    const MIN_REPORTES = 3;
    const R = 6371008.8;
    const rad = n => n * Math.PI / 180;
    const activo = r => ['Pendiente', 'En revisión'].includes(r.estado || 'Pendiente');
    const ubicacionValida = r => r.lat !== null && r.lon !== null && r.lat !== '' && r.lon !== ''
        && Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon))
        && Math.abs(Number(r.lat)) <= 90 && Math.abs(Number(r.lon)) <= 180;
    function distancia(a, b) {
        const dlat = rad(Number(b.lat) - Number(a.lat));
        const dlon = rad(Number(b.lon) - Number(a.lon));
        const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(Number(a.lat))) * Math.cos(rad(Number(b.lat))) * Math.sin(dlon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
    }
    function agrupar(reportes) {
        // Orden estable: el orden de llegada de Firestore no cambia los grupos.
        const validos = reportes.filter(r => activo(r) && ubicacionValida(r)).slice()
            .sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const grupos = [];
        const celdas = new Map();
        // Cuadrícula cartesiana sobre la esfera: candidatos en 27 celdas vecinas.
        function celda(r) {
            const lat = rad(Number(r.lat)), lon = rad(Number(r.lon));
            return [R * Math.cos(lat) * Math.cos(lon), R * Math.cos(lat) * Math.sin(lon), R * Math.sin(lat)]
                .map(v => Math.floor(v / DISTANCIA_METROS));
        }
        for (const reporte of validos) {
            const xyz = celda(reporte), candidatos = new Set();
            for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
                for (const indice of celdas.get([xyz[0] + x, xyz[1] + y, xyz[2] + z].join(',')) || []) candidatos.add(indice);
            }
            let elegido = null;
            for (const indice of [...candidatos].sort((a, b) => a - b)) {
                // Distancia máxima entre cualquier par; evita agrupaciones en cadena.
                if (grupos[indice].every(otro => distancia(otro, reporte) <= DISTANCIA_METROS)) { elegido = indice; break; }
            }
            if (elegido === null) {
                elegido = grupos.length;
                grupos.push([]);
                const clave = xyz.join(',');
                if (!celdas.has(clave)) celdas.set(clave, []);
                celdas.get(clave).push(elegido);
            }
            grupos[elegido].push(reporte);
        }
        const criticos = grupos.filter(g => g.length >= MIN_REPORTES).map(miembros => {
            const centro = {lat: miembros.reduce((s, r) => s + Number(r.lat), 0) / miembros.length,
                lon: miembros.reduce((s, r) => s + Number(r.lon), 0) / miembros.length};
            const destino = miembros.reduce((mejor, r) => distancia(r, centro) < distancia(mejor, centro) ? r : mejor);
            return {id: String(miembros[0].id), miembros, centro, destino};
        });
        const porReporte = new Map();
        criticos.forEach(grupo => grupo.miembros.forEach(r => porReporte.set(r.id, grupo)));
        return {criticos, porReporte};
    }
    const api = {DISTANCIA_METROS, MIN_REPORTES, activo, ubicacionValida, distancia, agrupar};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else raiz.AgrupacionReportes = api;
})(globalThis);
