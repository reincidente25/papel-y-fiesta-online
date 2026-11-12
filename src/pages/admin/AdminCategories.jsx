// src/pages/admin/AdminCategories.jsx
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoriesService';
import { getProducts } from '../../services/productsService';
import { uploadImage } from '../../services/storageService';

const EMPTY = { nombre: '', descripcion: '', imagen: '', orden: 999, activa: true };

const AdminCategories = () => {
  const [cats, setCats] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([getCategories({ soloActivas: false }), getProducts()])
      .then(([cs, prods]) => {
        setCats(cs);
        const map = {};
        for (const p of prods) if (p.categoria) map[p.categoria] = (map[p.categoria] || 0) + 1;
        setCounts(map);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => { setForm({ ...EMPTY, orden: cats.length + 1 }); setEditId(null); setModal(true); };
  const openEdit = (c) => {
    setForm({
      nombre: c.name || '', descripcion: c.descripcion || '',
      imagen: c.imagen || '', orden: c.orden ?? 999, activa: c.activa !== false,
    });
    setEditId(c.id); setModal(true);
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const subirFoto = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSubiendo(true);
    try { set('imagen', await uploadImage(file, 'categorias')); }
    finally { setSubiendo(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre, descripcion: form.descripcion,
        imagen: form.imagen, orden: Number(form.orden) || 999, activa: form.activa !== false,
      };
      if (editId) await updateCategory(editId, payload);
      else await createCategory(payload);
      setModal(false); load();
    } finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"? Los productos no se borran, pero quedan sin categoría asignada.`)) return;
    await deleteCategory(c.id); load();
  };

  const totalProd = Object.values(counts).reduce((n, v) => n + v, 0);
  const q = search.trim().toLowerCase();
  const visibles = cats.filter((c) => `${c.name || ''} ${c.id || ''} ${c.descripcion || ''}`.toLowerCase().includes(q));

  return (
    <AdminLayout title="Categorías">
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat info"><span className="stat-ic">🏷️</span><div><div className="stat-v">{cats.length}</div><div className="stat-l">Categorías</div></div></div>
        <div className="stat ok"><span className="stat-ic">✅</span><div><div className="stat-v">{cats.filter((c) => c.activa !== false).length}</div><div className="stat-l">Activas</div></div></div>
        <div className="stat"><span className="stat-ic">📦</span><div><div className="stat-v">{totalProd}</div><div className="stat-l">Productos categorizados</div></div></div>
      </div>

      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔎 Buscar categoría..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={openNew}>+ Nueva categoría</button>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th style={{ width: 64 }}>Imagen</th><th>Categoría</th><th>Descripción</th><th className="num">Productos</th><th>Orden</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr><td colSpan={7} className="muted">{cats.length === 0 ? 'Todavía no hay categorías. Creá la primera.' : 'No hay categorías que coincidan con la búsqueda.'}</td></tr>
              ) : visibles.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.imagen
                      ? <img className="table-thumb" src={c.imagen} alt="" loading="lazy" />
                      : <span className="table-thumb thumb-ph">{c.icon || '🏷️'}</span>}
                  </td>
                  <td><strong>{c.name}</strong><span className="muted" style={{ display: 'block', fontSize: '.78rem' }}>{c.id}</span></td>
                  <td className="muted" style={{ maxWidth: 320 }}>{c.descripcion || '—'}</td>
                  <td className="num">{counts[c.id] || 0}</td>
                  <td>{c.orden ?? '—'}</td>
                  <td><span className={`badge ${c.activa !== false ? 'badge-success' : 'badge-muted'}`}>{c.activa !== false ? 'Activa' : 'Oculta'}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar categoría' : 'Nueva categoría'} width={820}>
        <form onSubmit={save}>
          <div className="cat-modal">
            {/* Campos */}
            <div className="cat-modal-fields">
              <div className="field"><label>Nombre *</label>
                <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
                {editId && <span className="hint">Podés cambiar el nombre; el ID interno (<strong>{editId}</strong>) se mantiene.</span>}</div>

              <div className="field"><label>Descripción <span className="muted" style={{ fontWeight: 400 }}>(subtítulo en la landing)</span></label>
                <textarea className="textarea" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Ej: Todo para tus manualidades y arte" rows={3} /></div>

              <div className="cat-row2">
                <div className="field" style={{ maxWidth: 140 }}><label>Orden</label>
                  <input className="input" type="number" value={form.orden} onChange={(e) => set('orden', e.target.value)} /></div>
                <label className="switch cat-switch">
                  <input type="checkbox" checked={form.activa !== false} onChange={(e) => set('activa', e.target.checked)} />
                  <span className="track" /><span className="switch-label">Activa<small>Se muestra en la tienda</small></span>
                </label>
              </div>
            </div>

            {/* Imagen */}
            <aside className="cat-modal-img">
              <label className="aside-title">Imagen de la categoría</label>
              <div className="img-preview">
                {form.imagen
                  ? <img src={form.imagen} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                  : <span className="ph">📷<br />Foto para la tarjeta<br />de la landing</span>}
              </div>
              <div className="row gap-8" style={{ flexWrap: 'wrap', marginTop: 12 }}>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()} disabled={subiendo}>{subiendo ? 'Subiendo…' : '＋ Subir'}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const u = window.prompt('URL de la imagen:', form.imagen || 'https://'); if (u !== null) set('imagen', u.startsWith('http') ? u : ''); }}>🔗 URL</button>
                {form.imagen && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('imagen', '')}>Quitar</button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { subirFoto(e.target.files?.[0]); e.target.value = ''; }} />
            </aside>
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear categoría'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminCategories;
