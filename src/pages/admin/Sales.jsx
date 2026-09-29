// src/pages/admin/Sales.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getSales, createSale } from '../../services/salesService';
import { getProducts } from '../../services/productsService';
import { PAYMENT_METHODS, PAYMENT_METHODS_LIST, SALE_CHANNELS } from '../../constants';
import { formatMoney, formatDate } from '../../utils/format';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado de la venta en curso
  const [lines, setLines] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [canal, setCanal] = useState('local');
  const [cliente, setCliente] = useState('');
  const [picker, setPicker] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getSales(), getProducts()])
      .then(([s, p]) => { setSales(s); setProducts(p); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setLines([]); setDescuento(0); setMetodoPago('efectivo'); setCanal('local'); setCliente(''); setPicker('');
    setModal(true);
  };

  const addLine = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((ls) => {
      const ex = ls.find((l) => l.productoId === p.id);
      if (ex) return ls.map((l) => l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...ls, { productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnit: p.precioVenta }];
    });
    setPicker('');
  };

  const setLine = (id, patch) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, ...patch } : l));
  const delLine = (id) => setLines((ls) => ls.filter((l) => l.productoId !== id));

  const subtotal = lines.reduce((n, l) => n + l.precioUnit * l.cantidad, 0);
  const total = subtotal - (Number(descuento) || 0);

  const save = async () => {
    if (lines.length === 0) return;
    setSaving(true);
    try {
      await createSale({ canal, items: lines, descuento, metodoPago, cliente });
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const totalDia = sales
    .filter((s) => new Date(s.fecha).toDateString() === new Date().toDateString())
    .reduce((n, s) => n + s.total, 0);

  return (
    <AdminLayout title="Ventas">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi"><span className="kpi-icon">🧾</span><span className="kpi-value">{sales.length}</span><span className="kpi-label">Ventas registradas</span></div>
        <div className="card kpi"><span className="kpi-icon">📅</span><span className="kpi-value">{formatMoney(totalDia)}</span><span className="kpi-label">Vendido hoy</span></div>
        <div className="card kpi"><span className="kpi-icon">💵</span><span className="kpi-value">{formatMoney(sales.reduce((n, s) => n + s.total, 0))}</span><span className="kpi-label">Total histórico</span></div>
      </div>

      <div className="toolbar">
        <h2 className="section-title">Historial</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva venta</button>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>N°</th><th>Fecha</th><th>Canal</th><th>Ítems</th><th>Pago</th><th>Cliente</th><th>Total</th></tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} className="muted">No hay ventas todavía.</td></tr>
              ) : sales.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id.slice(-4)}</td>
                  <td>{formatDate(s.fecha)}</td>
                  <td><span className={`badge ${SALE_CHANNELS[s.canal]?.badge || 'badge-muted'}`}>{SALE_CHANNELS[s.canal]?.label || s.canal}</span></td>
                  <td>{s.items.reduce((n, i) => n + i.cantidad, 0)}</td>
                  <td>{PAYMENT_METHODS[s.metodoPago]?.label || s.metodoPago}</td>
                  <td>{s.cliente || '—'}</td>
                  <td><strong>{formatMoney(s.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva venta" width={620}>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Agregar producto</label>
          <select className="select" value={picker} onChange={(e) => addLine(e.target.value)}>
            <option value="">Seleccioná un producto...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nombre} — {formatMoney(p.precioVenta)} (stock {p.stock})</option>)}
          </select>
        </div>

        {lines.length === 0 ? (
          <p className="muted" style={{ padding: '12px 0' }}>Agregá productos a la venta.</p>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div className="pos-line" style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>
              <span>Producto</span><span>Cant.</span><span>Precio</span><span></span>
            </div>
            {lines.map((l) => (
              <div className="pos-line" key={l.productoId}>
                <span>{l.nombre}</span>
                <input className="input" type="number" min="1" value={l.cantidad}
                  onChange={(e) => setLine(l.productoId, { cantidad: Math.max(1, Number(e.target.value)) })} />
                <input className="input" type="number" min="0" value={l.precioUnit}
                  onChange={(e) => setLine(l.productoId, { precioUnit: Number(e.target.value) })} />
                <button className="btn btn-ghost btn-sm" onClick={() => delLine(l.productoId)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="form-grid">
          <div className="field"><label>Canal</label>
            <select className="select" value={canal} onChange={(e) => setCanal(e.target.value)}>
              {Object.values(SALE_CHANNELS).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select></div>
          <div className="field"><label>Medio de pago</label>
            <select className="select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {PAYMENT_METHODS_LIST.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></div>
          <div className="field"><label>Descuento</label>
            <input className="input" type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} /></div>
          <div className="field"><label>Cliente (opcional)</label>
            <input className="input" value={cliente} onChange={(e) => setCliente(e.target.value)} /></div>
        </div>

        <div className="pos-total"><span>Total</span><span>{formatMoney(total)}</span></div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={save} disabled={saving || lines.length === 0}>
            {saving ? 'Registrando...' : 'Registrar venta'}
          </button>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default Sales;
