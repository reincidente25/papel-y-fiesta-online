// src/pages/admin/Suppliers.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/suppliersService';

const EMPTY = { nombre: '', contacto: '', telefono: '', email: '', cuit: '', notas: '' };

const Suppliers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const load = () => { setLoading(true); getSuppliers().then(setItems).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditId(s.id); setModal(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (editId) await updateSupplier(editId, form);
    else await createSupplier(form);
    setModal(false);
    load();
  };

  const remove = async (s) => {
    if (!window.confirm(`¿Eliminar proveedor "${s.nombre}"?`)) return;
    await deleteSupplier(s.id);
    load();
  };

  return (
    <AdminLayout title="Proveedores">
      <div className="toolbar">
        <p className="muted">{items.length} proveedores</p>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo proveedor</button>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>Proveedor</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>CUIT</th><th></th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="muted">No hay proveedores.</td></tr>
              ) : items.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.nombre}</strong></td>
                  <td>{s.contacto || '—'}</td>
                  <td>{s.telefono || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.cuit || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>✕</button>
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
          <div className="field"><label>Contacto</label>
            <input className="input" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} /></div>
          <div className="field"><label>Teléfono</label>
            <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} /></div>
          <div className="field"><label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field"><label>CUIT</label>
            <input className="input" value={form.cuit} onChange={(e) => set('cuit', e.target.value)} /></div>
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
