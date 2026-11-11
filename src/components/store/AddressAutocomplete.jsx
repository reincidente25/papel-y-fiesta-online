// src/components/store/AddressAutocomplete.jsx
// Buscador de dirección (Georef) + campos editables. Devuelve el domicilio por onChange.
import { useEffect, useState } from 'react';
import { buscarDirecciones } from '../../services/geoService';
import MiniMap from '../common/MiniMap';

const AddressAutocomplete = ({ value, onChange }) => {
  const dir = value || {};
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const set = (k, v) => onChange?.({ ...dir, [k]: v });

  useEffect(() => {
    if (busqueda.trim().length < 4) { setSugerencias([]); return undefined; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBuscando(true);
      try { setSugerencias(await buscarDirecciones(busqueda, { signal: ctrl.signal })); }
      catch { /* abortado o sin red */ }
      finally { setBuscando(false); }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [busqueda]);

  const elegir = (s) => {
    onChange?.({ ...dir, calle: s.calle, numero: s.numero || dir.numero, localidad: s.localidad, provincia: s.provincia, lat: s.lat, lon: s.lon });
    setBusqueda('');
    setSugerencias([]);
  };

  return (
    <div className="stack gap-12">
      <div className="field dir-search">
        <label>Buscar dirección 🔎</label>
        <input className="input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: Av. Corrientes 1234, Rosario" autoComplete="off" />
        {(buscando || sugerencias.length > 0) && (
          <div className="dir-results">
            {buscando && <div className="dir-item muted">Buscando…</div>}
            {sugerencias.map((s, i) => (
              <button type="button" className="dir-item" key={i} onClick={() => elegir(s)}>
                📍 {s.label}{s.localidad ? <span className="muted"> · {s.localidad}, {s.provincia}</span> : null}
              </button>
            ))}
            {!buscando && sugerencias.length === 0 && busqueda.trim().length >= 4 && (
              <div className="dir-item muted">Sin resultados. Cargala a mano abajo.</div>
            )}
          </div>
        )}
      </div>
      {dir.lat != null && (
        <>
          <span className="dir-geo">📌 Ubicación detectada</span>
          <MiniMap lat={dir.lat} lon={dir.lon} />
        </>
      )}
      <div className="form-grid">
        <div className="field"><label>Calle *</label>
          <input className="input" value={dir.calle || ''} onChange={(e) => set('calle', e.target.value)} required /></div>
        <div className="field"><label>Número</label>
          <input className="input" value={dir.numero || ''} onChange={(e) => set('numero', e.target.value)} /></div>
        <div className="field"><label>Piso / Depto</label>
          <input className="input" value={dir.piso || ''} onChange={(e) => set('piso', e.target.value)} /></div>
        <div className="field"><label>Localidad</label>
          <input className="input" value={dir.localidad || ''} onChange={(e) => set('localidad', e.target.value)} /></div>
        <div className="field"><label>Provincia</label>
          <input className="input" value={dir.provincia || ''} onChange={(e) => set('provincia', e.target.value)} /></div>
        <div className="field"><label>Código postal</label>
          <input className="input" value={dir.cp || ''} onChange={(e) => set('cp', e.target.value)} /></div>
      </div>
    </div>
  );
};

export default AddressAutocomplete;
