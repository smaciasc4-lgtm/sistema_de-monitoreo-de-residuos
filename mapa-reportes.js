// Presentación Leaflet: agrupa visualmente, sin modificar los reportes.
window.MapaReportes = {
    crear(map, opciones) {
        const capa = L.markerClusterGroup({
            maxClusterRadius: 54,
            showCoverageOnHover: false,
            animate: false,
            spiderfyOnMaxZoom: true,
            spiderLegPolylineOptions: {weight: 1.5, color: '#94a3b8', opacity: .8},
            iconCreateFunction(cluster) {
                const marcadores = cluster.getAllChildMarkers();
                const cantidad = marcadores.reduce((s, m) => s + (m.options.cantidadReportes || 1), 0);
                const zonas = new Set(marcadores.map(m => m.options.grupoCritico).filter(Boolean));
                const mismaZona = zonas.size === 1 && marcadores.every(m => m.options.grupoCritico);
                return L.divIcon({className: 'siger-cluster' + (zonas.size ? ' con-criticos' : ''),
                    html: `<span class="cluster-cifra">${cantidad}</span><span class="cluster-etiqueta">${mismaZona ? 'crítico' : 'reportes'}</span>`,
                    iconSize: [60, 60], iconAnchor: [30, 30]});
            }
        }).addTo(map);
        let visibles = [], grupos = [], frame = null;
        function dibujar() {
            capa.clearLayers();
            const marcadores = [], agrupados = new Set();
            if (map.getZoom() < 18) {
                grupos.forEach(grupo => {
                    grupo.miembros.forEach(r => agrupados.add(r.id));
                    const marcador = L.marker([grupo.centro.lat, grupo.centro.lon], {
                        grupoCritico: grupo.id, cantidadReportes: grupo.miembros.length,
                        title: `Punto crítico: ${grupo.miembros.length} reportes visibles`,
                        icon: L.divIcon({className:'siger-punto-critico',
                            html:`<span class="critico-simbolo">!</span><strong>${grupo.miembros.length}</strong><span>PUNTO CRÍTICO</span>`,
                            iconSize:[82,72],iconAnchor:[41,36],popupAnchor:[0,-32]})
                    });
                    marcador.on('click', () => opciones.onGrupo(grupo.id));
                    marcadores.push(marcador);
                });
            }
            visibles.forEach(reporte => {
                if (agrupados.has(reporte.id) || !AgrupacionReportes.ubicacionValida(reporte)) return;
                const marcador = opciones.crearMarcador(reporte);
                const grupo = grupos.find(g => g.miembros.some(r => r.id === reporte.id));
                marcador.options.grupoCritico = grupo?.id;
                marcador.options.cantidadReportes = 1;
                marcador.bindPopup(opciones.textoPopup(reporte), {maxWidth:280});
                marcadores.push(marcador);
            });
            capa.addLayers(marcadores);
        }
        // Un cambio de escala afecta solo a los marcadores, no a la tabla ni Firestore.
        map.on('zoomend', () => {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => { frame = null; dibujar(); });
        });
        return {
            capa,
            get grupos() { return grupos; },
            actualizar(reportes, agrupacion) {
                visibles = reportes;
                const ids = new Set(visibles.map(r => r.id));
                grupos = agrupacion.criticos.map(g => ({...g, total:g.miembros.length, miembros:g.miembros.filter(r => ids.has(r.id))}))
                    .filter(g => g.miembros.length);
                document.getElementById('resumenReportesMapa').textContent = `${visibles.length} reporte${visibles.length === 1 ? '' : 's'} en esta vista`;
                document.getElementById('btnVerPuntosCriticos').textContent = `${grupos.length} punto${grupos.length === 1 ? '' : 's'} crítico${grupos.length === 1 ? '' : 's'} · Ver`;
                document.getElementById('btnVerPuntosCriticos').disabled = grupos.length === 0;
                dibujar();
            },
            separar(id) {
                const grupo = grupos.find(g => g.id === id);
                if (!grupo) return;
                const limites = L.latLngBounds(grupo.miembros.map(r => [Number(r.lat), Number(r.lon)]));
                const zoom = Math.min(20, Math.max(18, map.getBoundsZoom(limites, false, [140,140])));
                map.stop();
                map.setView(limites.getCenter(), zoom, {animate:false});
                document.getElementById('map').scrollIntoView({behavior:'smooth',block:'center'});
            }
        };
    }
};
