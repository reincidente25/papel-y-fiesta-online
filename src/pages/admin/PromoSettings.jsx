// src/pages/admin/PromoSettings.jsx
// Gestión del popup promocional de la landing.
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getPopup, savePopup, POPUP_DEFAULT } from '../../services/popupService';
import { uploadImage } from '../../services/storageService';
import '../store/store.css';

const PromoSettings = () => {
  const [form, setForm] = useState(POPUP_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { getPopup().then(setForm).finally(() => setLoading(false)); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const subirFoto = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSubiendo(true);
    try { set('imagen', await uploadImage(file, 'landing')); }
    finally { setSubiendo(false); }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true); setOk(false);
    try { const r = await savePopup(form); setForm(r); setOk(true); setTimeout(() => setOk(false), 2500); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout title="Popup promocional"><Loader /></AdminLayout>;

  const col = (c) => (c === 'negro' ? '#1a1a1a' : '#fff');
  const tieneImg = Boolean(form.imagen);
  const hayTexto = form.titulo || form.texto || (form.ctaLink && form.ctaTexto);

  return (
    <AdminLayout title="Popup promocional">
      <form onSubmit={guardar} className="editor-grid">
        <div className="card" style={{ padding: 24 }}>
          <label className="switch" style={{ marginBottom: 18 }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} />
            <span className="track" /><span className="switch-label">Mostrar el popup<small>Aparece al entrar a la página de inicio</small></span>
          </label>

          <div className="form-grid">
            <div className="field full"><label>Título</label>
              <input className="input" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej: ¡Vuelta al cole!" /></div>
            <div className="field full"><label>Texto</label>
              <textarea className="textarea" value={form.texto} onChange={(e) => set('texto', e.target.value)} placeholder="Ej: 20% off en toda la lista escolar hasta el 15/02." /></div>
            <div className="field"><label>Texto del enlace</label>
              <input className="input" value={form.ctaTexto} onChange={(e) => set('ctaTexto', e.target.value)} placeholder="Ver más" /></div>
            <div className="field"><label>Link (al hacer clic)</label>
              <input className="input" value={form.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} placeholder="/catalogo" /></div>
            <div className="field"><label>Color del título</label>
              <select className="select" value={form.tituloColor || 'blanco'} onChange={(e) => set('tituloColor', e.target.value)}>
                <option value="blanco">Blanco</option>
                <option value="negro">Negro</option>
              </select></div>
            <div className="field"><label>Color de la descripción</label>
              <select className="select" value={form.textoColor || 'blanco'} onChange={(e) => set('textoColor', e.target.value)}>
                <option value="blanco">Blanco</option>
                <option value="negro">Negro</option>
              </select></div>
            <div className="field"><label>Alineación horizontal</label>
              <select className="select" value={form.alignH || 'left'} onChange={(e) => set('alignH', e.target.value)}>
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select></div>
            <div className="field"><label>Alineación vertical</label>
              <select className="select" value={form.alignV || 'bottom'} onChange={(e) => set('alignV', e.target.value)}>
                <option value="top">Arriba</option>
                <option value="center">Centro</option>
                <option value="bottom">Abajo</option>
              </select></div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            {ok && <span className="save-ok" style={{ alignSelf: 'center' }}>✓ Guardado</span>}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>Al guardar cambios, el popup se vuelve a mostrar a quienes ya lo habían cerrado.</p>
        </div>

        <aside className="editor-aside">
          <div className="card" style={{ padding: 18 }}>
            <label className="aside-title">Imagen del popup</label>
            <div className="img-preview" style={{ marginBottom: 12, maxWidth: 200 }}>
              {form.imagen
                ? <img src={form.imagen} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                : <span className="ph">📷<br />Imagen de la<br />promoción</span>}
            </div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()} disabled={subiendo}>{subiendo ? 'Subiendo…' : '＋ Subir'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const u = window.prompt('URL de la imagen:', form.imagen || 'https://'); if (u !== null) set('imagen', u.startsWith('http') ? u : ''); }}>🔗 URL</button>
              {form.imagen && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('imagen', '')}>Quitar</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { subirFoto(e.target.files?.[0]); e.target.value = ''; }} />
            <span className="hint">Ideal vertical u horizontal grande (ej. 800×600).</span>
          </div>

          {/* Vista previa en vivo, debajo de la imagen */}
          <div className="card" style={{ padding: 18 }}>
            <label className="aside-title">Vista previa{!form.activo && <span className="muted" style={{ fontWeight: 400 }}> (desactivado)</span>}</label>
            <div className="promo-preview-box">
              <div className={`promo-pop2 texto-${form.textoColor || 'blanco'}`} style={{ maxHeight: 'none' }}>
                {tieneImg && <img className="promo-pop2-img" src={form.imagen} alt="" />}
                {hayTexto && (
                  <div className={`promo-pop2-content ${tieneImg ? `overlay v-${form.alignV || 'bottom'}` : 'plano'}`} style={{ textAlign: form.alignH || 'left' }}>
                    {form.titulo && <h3 style={{ color: col(form.tituloColor) }}>{form.titulo}</h3>}
                    {form.texto && <p>{form.texto}</p>}
                    {form.ctaLink && form.ctaTexto && <span className="promo-pop2-hint">{form.ctaTexto} →</span>}
                  </div>
                )}
                {!tieneImg && !hayTexto && <div className="promo-pop2-content plano muted">Cargá una imagen o un texto para ver la vista previa.</div>}
              </div>
            </div>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
};

export default PromoSettings;
