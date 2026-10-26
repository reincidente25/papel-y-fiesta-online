// src/pages/admin/Suppliers.jsx
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/suppliersService';

const EMPTY = { nombre: '', contacto: '', telefono: '', email: '', cuit: '', rubro: '', notas: '', estado: 'activo' };

const Suppliers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => { setLoading(true); getSuppliers().then(setItems).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm({ ...EMPTY, ...s }); setEditId(s.id); setModal(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (editId) await updateSupplier(editId, form);
    else await createSupplier(form);
    setModal(false); load();
  };

  const remove = async (s) => {
    if (!window.confirm(`¿Eliminar proveedor "${s.nombre}"?`)) return;
    await deleteSupplier(s.id); load();
  };

  const kpis = useMemo(() => ({
    total: items.length,
    activos: items.filter((s) => (s.estado || 'activo') === 'activo').length,
    conEmail: items.filter((s) => s.email).length,
    conTel: items.filter((s) => s.telefono).length,
  }), [items]);

  const visible = items.filter((s) =>
    `${s.nombre || ''} ${s.cuit || ''} ${s.rubro || ''} ${s.contacto || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Proveedores">
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat info"><span className="stat-ic">🚚</span><div><div className="stat-v">{kpis.total}</div><div className="stat-l">Proveedores</div></div></div>
        <div className="stat ok"><span className="stat-ic">✅</span><div><div className="stat-v">{kpis.activos}</div><div className="stat-l">Activos</div></div></div>
        <div className="stat"><span className="stat-ic">📧</span><div><div className="stat-v">{kpis.conEmail}</div><div className="stat-l">Con email</div></div></div>
        <div className="stat"><span className="stat-ic">📞</span><div><div className="stat-v">{kpis.conTel}</div><div className="stat-l">Con teléfono</div></div></div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="spread" style={{ gap: 10, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="🔎 Buscar por nombre, CUIT o rubro..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={openNew}>+ Nuevo proveedor</button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>Proveedor</th><th>Rubro</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>CUIT</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={8} className="muted">No hay proveedores.</td></tr>
              ) : visible.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.nombre}</strong></td>
                  <td>{s.rubro || '—'}</td>
                  <td>{s.contacto || '—'}</td>
                  <td>{s.telefono || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.cuit || '—'}</td>
                  <td><span className={`badge ${(s.estado || 'activo') === 'activo' ? 'badge-success' : 'badge-muted'}`}>{(s.estado || 'activo') === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn" title="Editar" onClick={() => openEdit(s)}>✏️</button>
                      <button className="icon-btn danger" title="Eliminar" onClick={() => remove(s)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar proveedor' : 'Nuevo proveedor'}>
        <form onSubmit={save} className="form-grid">
          <div className="field full"><label>Nombre / Razón social *</label>
            <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
          <div className="field"><label>Rubro</label>
            <input className="input" value={form.rubro} onChange={(e) => set('rubro', e.target.value)} /></div>
          <div className="field"><label>CUIT</label>
            <input className="input" value={form.cuit} onChange={(e) => set('cuit', e.target.value)} /></div>
          <div className="field"><label>Contacto</label>
            <input className="input" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} /></div>
          <div className="field"><label>Teléfono</label>
            <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} /></div>
          <div className="field"><label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field"><label>Estado</label>
            <select className="select" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select></div>
          <div className="field full"><label>Notas</label>
            <textarea className="textarea" value={form.notas} onChange={(e) => set('notas', e.target.value)} /></div>
          <div className="form-actions full">
            <button type="submit" className="btn btn-primary">{editId ? 'Guardar' : 'Crear'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default Suppliers;
