// src/components/common/MiniMap.jsx
// Mapa interactivo (OpenStreetMap + Leaflet). Gratis, sin API key.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pin propio (evita los íconos rotos de Leaflet con bundlers).
const pinIcon = L.divIcon({
  className: 'mini-pin',
  html: '<div class="mini-pin-dot">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

const MiniMap = ({ lat, lon, zoom = 16, height = 200 }) => {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null || !elRef.current) return undefined;
    if (!mapRef.current) {
      mapRef.current = L.map(elRef.current, { attributionControl: true, scrollWheelZoom: false }).setView([lat, lon], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapRef.current);
      markerRef.current = L.marker([lat, lon], { icon: pinIcon }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lon], zoom);
      markerRef.current.setLatLng([lat, lon]);
    }
    // Recalcula el tamaño (Leaflet necesita esto si el contenedor cambió).
    setTimeout(() => mapRef.current?.invalidateSize(), 50);
    return undefined;
  }, [lat, lon, zoom]);

  // Limpieza al desmontar.
  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  if (lat == null || lon == null) return null;
  return <div ref={elRef} className="mini-map" style={{ height }} />;
};

export default MiniMap;
