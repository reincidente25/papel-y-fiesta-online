// src/pages/admin/Customers.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/customersService';
import { CUSTOMER_TYPES, CUSTOMER_TYPES_LIST } from '../../constants';
import { formatMoney } from '../../utils/format';

const EMPTY = { nombre: '', telefono: '', email: '', tipo: 'minorista', saldoCtaCte: 0, notas: '' };

const Customers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => { setLoading(true); getCustomers().then(setItems).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm(c); setEditId(c.id); setModal(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, saldoCtaCte: Number(form.saldoCtaCte) || 0 };
    if (editId) await updateCustomer(editId, payload);
    else await createCustomer(payload);
    setModal(false); load();
  };

  const remove = async (c) => {
    if (!window.confirm(`¿Eliminar cliente "${c.nombre}"?`)) return;
    await deleteCustomer(c.id); load();
  };

  const visible = items.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()));
  const deuda = items.reduce((n, c) => n + (c.saldoCtaCte || 0), 0);

  return (
    <AdminLayout title="Clientes">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi"><span className="kpi-icon">👥</span><span className="kpi-value">{items.length}</span><span className="kpi-label">Clientes</span></div>
        <div className="card kpi"><span className="kpi-icon">🏢</span><span className="kpi-value">{items.filter((c) => c.tipo === 'mayorista').length}</span><span className="kpi-label">Mayoristas</span></div>
        <div className="card kpi"><span className="kpi-icon">💳</span><span className="kpi-value">{formatMoney(deuda)}</span><span className="kpi-label">Total en cuenta corriente</span></div>
      </div>

      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔎 Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo cliente</button>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Teléfono</th><th>Email</th><th>Cta. corriente</th><th></th></tr></thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={6} className="muted">No hay clientes.</td></tr>
              ) : visible.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong></td>
                  <td><span className="badge badge-muted">{CUSTOMER_TYPES[c.tipo]?.label || c.tipo}</span></td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td style={{ color: c.saldoCtaCte > 0 ? 'var(--danger)' : 'var(--text-soft)', fontWeight: c.saldoCtaCte > 0 ? 700 : 400 }}>
                    {formatMoney(c.saldoCtaCte || 0)}
                  </td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={save} className="form-grid">
          <div className="field full"><label>Nombre *</label>
            <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
          <div className="field"><label>Tipo</label>
            <select className="select" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {CUSTOMER_TYPES_LIST.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <div className="field"><label>Teléfono</label>
            <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} /></div>
          <div className="field"><label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field"><label>Saldo cta. corriente</label>
            <input className="input" type="number" value={form.saldoCtaCte} onChange={(e) => set('saldoCtaCte', e.target.value)} /></div>
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

export default Customers;
