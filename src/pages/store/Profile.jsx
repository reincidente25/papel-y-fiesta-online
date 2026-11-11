// src/pages/store/Profile.jsx
// Perfil del cliente: datos personales + domicilios de entrega (con predeterminado).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import Modal from '../../components/common/Modal';
import MiniMap from '../../components/common/MiniMap';
import { useAuth } from '../../context/AuthContext';
import { buscarDirecciones, buscarCodigoPostal } from '../../services/geoService';
import './store.css';

const nuevoDomId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const DOM_VACIO = { id: '', etiqueta: '', calle: '', numero: '', piso: '', localidad: '', provincia: '', cp: '', notas: '' };

const Profile = () => {
  const { user, profile, saveProfile } = useAuth();

  const [datos, setDatos] = useState({ nombre: '', apellido: '', whatsapp: '', dni: '' });
  const [domicilios, setDomicilios] = useState([]);
  const [savingDatos, setSavingDatos] = useState(false);
  const [okDatos, setOkDatos] = useState(false);

  const [modal, setModal] = useState(null); // domicilio en edición (o null)
  const [savingDom, setSavingDom] = useState(false);

  // Autocompletado de direcciones (Georef)
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDatos({
      nombre: profile.nombre || user?.displayName || '',
      apellido: profile.apellido || '',
      whatsapp: profile.whatsapp || profile.telefono || '',
      dni: profile.dni || '',
    });
    setDomicilios(profile.domicilios || []);
  }, [profile, user]);

  // Busca direcciones (con debounce) mientras se escribe en el buscador.
  useEffect(() => {
    if (!modal) return undefined;
    if (busqueda.trim().length < 4) { setSugerencias([]); return undefined; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        setSugerencias(await buscarDirecciones(busqueda, { signal: ctrl.signal }));
      } catch { /* abortado o sin red */ }
      finally { setBuscando(false); }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [busqueda, modal]);

  if (!user) {
    return (
      <StoreLayout>
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <h3>Iniciá sesión para ver tu perfil</h3>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Volver al inicio</Link>
        </div>
      </StoreLayout>
    );
  }

  const setD = (k, v) => setDatos((d) => ({ ...d, [k]: v }));

  const guardarDatos = async (e) => {
    e.preventDefault();
    setSavingDatos(true); setOkDatos(false);
    try {
      await saveProfile({ ...datos });
      setOkDatos(true);
      setTimeout(() => setOkDatos(false), 2500);
    } finally {
      setSavingDatos(false);
    }
  };

  // ── Domicilios ──
  const persistirDoms = async (lista) => {
    setDomicilios(lista);
    await saveProfile({ domicilios: lista });
  };

  const abrirNuevo = () => { setBusqueda(''); setSugerencias([]); setModal({ ...DOM_VACIO, id: nuevoDomId() }); };
  const abrirEditar = (d) => { setBusqueda(''); setSugerencias([]); setModal({ ...d }); };

  // Completa los campos desde una sugerencia de Georef.
  const elegirSugerencia = async (s) => {
    setModal((m) => ({
      ...m,
      calle: s.calle, numero: s.numero || m.numero,
      localidad: s.localidad, provincia: s.provincia,
      lat: s.lat, lon: s.lon,
    }));
    setBusqueda('');
    setSugerencias([]);
    const cp = await buscarCodigoPostal(s.lat, s.lon);
    if (cp) setModal((m) => (m && !m.cp ? { ...m, cp } : m));
  };

  const guardarDom = async (e) => {
    e.preventDefault();
    if (!modal.calle.trim()) return;
    setSavingDom(true);
    try {
      const existe = domicilios.some((d) => d.id === modal.id);
      let lista = existe
        ? domicilios.map((d) => (d.id === modal.id ? modal : d))
        : [...domicilios, modal];
      // Si es el único, queda como predeterminado.
      if (lista.length === 1) lista = lista.map((d) => ({ ...d, predeterminado: true }));
      await persistirDoms(lista);
      setModal(null);
    } finally {
      setSavingDom(false);
    }
  };

  const eliminarDom = async (id) => {
    let lista = domicilios.filter((d) => d.id !== id);
    // Si borramos el predeterminado y queda alguno, el primero pasa a serlo.
    if (lista.length && !lista.some((d) => d.predeterminado)) {
      lista = lista.map((d, i) => ({ ...d, predeterminado: i === 0 }));
    }
    await persistirDoms(lista);
  };

  const marcarDefault = async (id) => {
    await persistirDoms(domicilios.map((d) => ({ ...d, predeterminado: d.id === id })));
  };

  const setM = (k, v) => setModal((m) => ({ ...m, [k]: v }));
  const resumen = (d) => [`${d.calle} ${d.numero}`, d.piso && `Piso ${d.piso}`, d.localidad, d.provincia, d.cp && `CP ${d.cp}`].filter(Boolean).join(' · ');

  return (
    <StoreLayout>
      <div className="container profile">
        <h1 className="page-title" style={{ marginTop: 28 }}>Mi perfil</h1>

        {/* Datos personales */}
        <form className="card profile-card" onSubmit={guardarDatos}>
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Datos personales</h2>
          <div className="form-grid">
            <div className="field"><label>Nombre</label>
              <input className="input" value={datos.nombre} onChange={(e) => setD('nombre', e.target.value)} /></div>
            <div className="field"><label>Apellido</label>
              <input className="input" value={datos.apellido} onChange={(e) => setD('apellido', e.target.value)} /></div>
            <div className="field"><label>WhatsApp</label>
              <input className="input" value={datos.whatsapp} onChange={(e) => setD('whatsapp', e.target.value)} placeholder="11 5555-1234" /></div>
            <div className="field"><label>DNI</label>
              <input className="input" value={datos.dni} onChange={(e) => setD('dni', e.target.value)} inputMode="numeric" /></div>
            <div className="field full"><label>Email</label>
              <input className="input" value={user.email} readOnly disabled />
              <span className="hint">El email se gestiona desde la cuenta.</span></div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingDatos}>{savingDatos ? 'Guardando…' : 'Guardar datos'}</button>
            {okDatos && <span className="save-ok">✓ Guardado</span>}
          </div>
        </form>

        {/* Domicilios */}
        <div className="toolbar" style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Domicilios de entrega</h2>
          <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>+ Agregar domicilio</button>
        </div>

        {domicilios.length === 0 ? (
          <div className="card" style={{ padding: 22 }}>
            <p className="muted">Todavía no cargaste domicilios. Agregá uno para agilizar tus pedidos.</p>
          </div>
        ) : (
          <div className="card dom-table-wrap">
            <table className="dom-table">
              <thead>
                <tr><th>Etiqueta</th><th>Dirección</th><th>Default</th><th className="dom-th-acc">Acciones</th></tr>
              </thead>
              <tbody>
                {domicilios.map((d) => (
                  <tr key={d.id} className={d.predeterminado ? 'is-default' : ''}>
                    <td data-label="Etiqueta"><strong>{d.etiqueta || 'Domicilio'}</strong></td>
                    <td data-label="Dirección">
                      {resumen(d)}
                      {d.notas && <span className="dom-notas">{d.notas}</span>}
                    </td>
                    <td data-label="Default">
                      {d.predeterminado
                        ? <span className="badge badge-success">★ Predeterminado</span>
                        : <button className="btn btn-ghost btn-sm" onClick={() => marcarDefault(d.id)}>Usar por defecto</button>}
                    </td>
                    <td data-label="Acciones" className="dom-td-acc">
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(d)}>Editar</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => eliminarDom(d.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal alta/edición de domicilio */}
      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal && domicilios.some((d) => d.id === modal.id) ? 'Editar domicilio' : 'Nuevo domicilio'} width={720}>
        {modal && (
          <form className="stack gap-12" onSubmit={guardarDom}>
            <div className="field dir-search">
              <label>Buscar dirección 🔎</label>
              <input className="input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej: Av. Corrientes 1234, Rosario" autoComplete="off" />
              <span className="hint">Escribí calle y altura; elegí de la lista para completar solo.</span>
              {(buscando || sugerencias.length > 0) && (
                <div className="dir-results">
                  {buscando && <div className="dir-item muted">Buscando…</div>}
                  {sugerencias.map((s, i) => (
                    <button type="button" className="dir-item" key={i} onClick={() => elegirSugerencia(s)}>
                      📍 {s.label}{s.localidad ? <span className="muted"> · {s.localidad}, {s.provincia}</span> : null}
                    </button>
                  ))}
                  {!buscando && sugerencias.length === 0 && busqueda.trim().length >= 4 && (
                    <div className="dir-item muted">Sin resultados. Podés cargarla a mano abajo.</div>
                  )}
                </div>
              )}
            </div>

            {modal.lat != null && (
              <>
                <span className="dir-geo">📌 Ubicación detectada</span>
                <MiniMap lat={modal.lat} lon={modal.lon} />
              </>
            )}

            <div className="field"><label>Etiqueta</label>
              <input className="input" value={modal.etiqueta} onChange={(e) => setM('etiqueta', e.target.value)} placeholder="Casa, Trabajo…" /></div>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / span 1' }}><label>Calle *</label>
                <input className="input" value={modal.calle} onChange={(e) => setM('calle', e.target.value)} required /></div>
              <div className="field"><label>Número</label>
                <input className="input" value={modal.numero} onChange={(e) => setM('numero', e.target.value)} /></div>
              <div className="field"><label>Piso / Depto</label>
                <input className="input" value={modal.piso} onChange={(e) => setM('piso', e.target.value)} /></div>
              <div className="field"><label>Localidad</label>
                <input className="input" value={modal.localidad} onChange={(e) => setM('localidad', e.target.value)} /></div>
              <div className="field"><label>Provincia</label>
                <input className="input" value={modal.provincia} onChange={(e) => setM('provincia', e.target.value)} /></div>
              <div className="field"><label>Código postal</label>
                <input className="input" value={modal.cp} onChange={(e) => setM('cp', e.target.value)} /></div>
            </div>
            <div className="field"><label>Notas para la entrega</label>
              <textarea className="textarea" value={modal.notas} onChange={(e) => setM('notas', e.target.value)} placeholder="Timbre, referencia, horario…" /></div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingDom}>{savingDom ? 'Guardando…' : 'Guardar domicilio'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </form>
        )}
      </Modal>
    </StoreLayout>
  );
};

export default Profile;
