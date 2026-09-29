// src/pages/admin/Purchases.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getPurchases, createPurchase } from '../../services/purchasesService';
import { getSuppliers } from '../../services/suppliersService';
import { getProducts } from '../../services/productsService';
import { PAYMENT_METHODS, PAYMENT_METHODS_LIST, PURCHASE_STATUS, PURCHASE_STATUS_LIST } from '../../constants';
import { formatMoney, formatDate } from '../../utils/format';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [proveedorId, setProveedorId] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [lines, setLines] = useState([]);
  const [picker, setPicker] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getPurchases(), getSuppliers(), getProducts()])
      .then(([c, p, pr]) => { setPurchases(c); setSuppliers(p); setProducts(pr); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setProveedorId(''); setEstado('pendiente'); setMetodoPago('transferencia'); setLines([]); setPicker('');
    setModal(true);
  };

  const addLine = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((ls) => {
      const ex = ls.find((l) => l.productoId === p.id);
      if (ex) return ls.map((l) => l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...ls, { productoId: p.id, nombre: p.nombre, cantidad: 1, costoUnit: p.precioCosto || 0 }];
    });
    setPicker('');
  };
  const setLine = (id, patch) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, ...patch } : l));
  const delLine = (id) => setLines((ls) => ls.filter((l) => l.productoId !== id));

  const total = lines.reduce((n, l) => n + l.costoUnit * l.cantidad, 0);

  const save = async () => {
    if (lines.length === 0) return;
    setSaving(true);
    try {
      const prov = suppliers.find((s) => s.id === proveedorId);
      await createPurchase({ proveedorId, proveedorNombre: prov?.nombre || '—', items: lines, estado, metodoPago });
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Compras">
      <div className="toolbar">
        <p className="muted">{purchases.length} compras · Total invertido {formatMoney(purchases.reduce((n, c) => n + c.total, 0))}</p>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva compra</button>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>N°</th><th>Fecha</th><th>Proveedor</th><th>Ítems</th><th>Pago</th><th>Estado</th><th>Total</th></tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={7} className="muted">No hay compras registradas.</td></tr>
              ) : purchases.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id.slice(-4)}</td>
                  <td>{formatDate(c.fecha)}</td>
                  <td>{c.proveedorNombre}</td>
                  <td>{c.items.reduce((n, i) => n + i.cantidad, 0)}</td>
                  <td>{PAYMENT_METHODS[c.metodoPago]?.label || c.metodoPago}</td>
                  <td><span className={`badge ${PURCHASE_STATUS[c.estado]?.badge || 'badge-muted'}`}>{PURCHASE_STATUS[c.estado]?.label || c.estado}</span></td>
                  <td><strong>{formatMoney(c.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva compra" width={620}>
        <div className="form-grid" style={{ marginBottom: 8 }}>
          <div className="field"><label>Proveedor</label>
            <select className="select" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Seleccioná...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select></div>
          <div className="field"><label>Estado</label>
            <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {PURCHASE_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select></div>
          <div className="field full"><label>Medio de pago</label>
            <select className="select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {PAYMENT_METHODS_LIST.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></div>
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <label>Agregar producto</label>
          <select className="select" value={picker} onChange={(e) => addLine(e.target.value)}>
            <option value="">Seleccioná un producto...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock {p.stock})</option>)}
          </select>
        </div>

        {lines.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="pos-line" style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>
              <span>Producto</span><span>Cant.</span><span>Costo u.</span><span></span>
            </div>
            {lines.map((l) => (
              <div className="pos-line" key={l.productoId}>
                <span>{l.nombre}</span>
                <input className="input" type="number" min="1" value={l.cantidad}
                  onChange={(e) => setLine(l.productoId, { cantidad: Math.max(1, Number(e.target.value)) })} />
                <input className="input" type="number" min="0" value={l.costoUnit}
                  onChange={(e) => setLine(l.productoId, { costoUnit: Number(e.target.value) })} />
                <button className="btn btn-ghost btn-sm" onClick={() => delLine(l.productoId)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="pos-total"><span>Total</span><span>{formatMoney(total)}</span></div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={save} disabled={saving || lines.length === 0}>
            {saving ? 'Registrando...' : 'Registrar compra'}
          </button>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default Purchases;
