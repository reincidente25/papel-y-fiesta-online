// src/pages/admin/HomeSettings.jsx
// Personalización de la landing (hero): imagen y textos.
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getHomeConfig, saveHomeConfig, HOME_DEFAULT } from '../../services/settingsService';
import { uploadImage } from '../../services/storageService';

const HomeSettings = () => {
  const [form, setForm] = useState(HOME_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getHomeConfig().then(setForm).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const subirFoto = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSubiendo(true);
    try { set('heroImagen', await uploadImage(file, 'landing')); }
    finally { setSubiendo(false); }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true); setOk(false);
    try { await saveHomeConfig(form); setOk(true); setTimeout(() => setOk(false), 2500); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout title="Landing"><Loader /></AdminLayout>;

  return (
    <AdminLayout title="Landing — Portada">
      <form onSubmit={guardar} className="editor-grid">
        <div className="card" style={{ padding: 24 }}>
          <div className="form-grid">
            <div className="field full"><label>Bajada (eyebrow)</label>
              <input className="input" value={form.heroEyebrow} onChange={(e) => set('heroEyebrow', e.target.value)} /></div>
            <div className="field full"><label>Título principal</label>
              <input className="input" value={form.heroTitulo} onChange={(e) => set('heroTitulo', e.target.value)} /></div>
            <div className="field full"><label>Subtítulo</label>
              <textarea className="textarea" value={form.heroSubtitulo} onChange={(e) => set('heroSubtitulo', e.target.value)} /></div>
            <div className="field"><label>Texto del botón</label>
              <input className="input" value={form.ctaTexto} onChange={(e) => set('ctaTexto', e.target.value)} /></div>
            <div className="field"><label>Link del botón</label>
              <input className="input" value={form.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} placeholder="/catalogo" /></div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
            {ok && <span className="save-ok" style={{ alignSelf: 'center' }}>✓ Guardado</span>}
          </div>
        </div>

        <aside className="editor-aside">
          <div className="card" style={{ padding: 18 }}>
            <label className="aside-title">Foto del hero</label>
            <div className="img-preview" style={{ marginBottom: 12 }}>
              {form.heroImagen
                ? <img src={form.heroImagen} alt="Hero" onError={(e) => { e.target.style.display = 'none'; }} />
                : <span className="ph">📷<br />Subí una foto<br />para el encabezado</span>}
            </div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()} disabled={subiendo}>
                {subiendo ? 'Subiendo…' : '＋ Subir foto'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                const u = window.prompt('URL de la imagen:', form.heroImagen || 'https://');
                if (u !== null) set('heroImagen', u.startsWith('http') ? u : '');
              }}>🔗 Por URL</button>
              {form.heroImagen && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('heroImagen', '')}>Quitar</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={(e) => { subirFoto(e.target.files?.[0]); e.target.value = ''; }} />
            <span className="hint">Ideal apaisada (ej. 1600×700). Si no cargás ninguna, se usa un degradado de marca.</span>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
};

export default HomeSettings;
