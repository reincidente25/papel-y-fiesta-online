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
  const [query, setQuery] = useState('');

  // Filtro por fecha y detalle
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getSales(), getProducts()])
      .then(([s, p]) => { setSales(s); setProducts(p); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setLines([]); setDescuento(0); setMetodoPago('efectivo'); setCanal('local'); setCliente(''); setQuery('');
    setModal(true);
  };

  const addLine = (p) => {
    setLines((ls) => {
      const ex = ls.find((l) => l.productoId === p.id);
      if (ex) return ls.map((l) => l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...ls, { productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnit: p.precioVenta, stock: p.stock }];
    });
    setQuery('');
  };

  const changeQty = (id, delta) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l));
  const delLine = (id) => setLines((ls) => ls.filter((l) => l.productoId !== id));

  const results = query.trim()
    ? products.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];
  const totalItems = lines.reduce((n, l) => n + l.cantidad, 0);

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

  const filtered = sales.filter((s) => {
    const f = new Date(s.fecha);
    if (desde && f < new Date(desde)) return false;
    if (hasta && f > new Date(hasta + 'T23:59:59')) return false;
    return true;
  });

  return (
    <AdminLayout title="Ventas">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi"><span className="kpi-icon">🧾</span><span className="kpi-value">{sales.length}</span><span className="kpi-label">Ventas registradas</span></div>
        <div className="card kpi"><span className="kpi-icon">📅</span><span className="kpi-value">{formatMoney(totalDia)}</span><span className="kpi-label">Vendido hoy</span></div>
        <div className="card kpi"><span className="kpi-icon">💵</span><span className="kpi-value">{formatMoney(sales.reduce((n, s) => n + s.total, 0))}</span><span className="kpi-label">Total histórico</span></div>
      </div>

      <div className="toolbar">
        <div className="row gap-12">
          <h2 className="section-title">Historial</h2>
          <div className="row gap-8">
            <input className="input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} title="Desde" />
            <span className="muted">→</span>
            <input className="input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} title="Hasta" />
            {(desde || hasta) && <button className="btn btn-ghost btn-sm" onClick={() => { setDesde(''); setHasta(''); }}>Limpiar</button>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva venta</button>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>N°</th><th>Fecha</th><th>Canal</th><th>Ítems</th><th>Pago</th><th>Cliente</th><th>Total</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="muted">No hay ventas en el período.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(s)}>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva venta" width={880}>
        <div className="pos-grid">
        <div>
        <div className="field pos-search" style={{ marginBottom: 6 }}>
          <label>Agregar productos</label>
          <input className="input" placeholder="🔎 Buscá por nombre y hacé clic para agregar..."
            value={query} onChange={(e) => setQuery(e.target.value)} />
          {results.length > 0 && (
            <div className="pos-results">
              {results.map((p) => {
                const sinStock = p.stock <= 0;
                return (
                  <div key={p.id} className={`pos-result ${sinStock ? 'disabled' : ''}`}
                    onClick={() => !sinStock && addLine(p)}>
                    {p.imagen && <img src={p.imagen} alt="" />}
                    <span className="pos-result-name">{p.nombre}</span>
                    <span className="pos-result-meta">{formatMoney(p.precioVenta)} · stock {p.stock}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lines.length === 0 ? (
          <div className="pos-empty">Todavía no agregaste productos. Buscá arriba y hacé clic para sumarlos.</div>
        ) : (
          <div className="pos-cart">
            {lines.map((l) => (
              <div className="pos-cart-item" key={l.productoId}>
                <div>
                  <div className="pos-cart-name">{l.nombre}</div>
                  <div className="pos-cart-price">{formatMoney(l.precioUnit)} c/u</div>
                </div>
                <div className="qty-mini">
                  <button type="button" onClick={() => changeQty(l.productoId, -1)}>−</button>
                  <span>{l.cantidad}</span>
                  <button type="button" onClick={() => changeQty(l.productoId, +1)}>+</button>
                </div>
                <span className="pos-line-total">{formatMoney(l.precioUnit * l.cantidad)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => delLine(l.productoId)}>✕</button>
              </div>
            ))}
            <p className="hint" style={{ textAlign: 'right' }}>{totalItems} unidad(es) · {lines.length} producto(s)</p>
          </div>
        )}
        </div>

        {/* Resumen / cobro */}
        <aside className="pos-aside">
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

          <div className="spread" style={{ fontSize: '.88rem' }}><span className="muted">Subtotal</span><span>{formatMoney(subtotal)}</span></div>
          {Number(descuento) > 0 && <div className="spread" style={{ fontSize: '.88rem' }}><span className="muted">Descuento</span><span>− {formatMoney(descuento)}</span></div>}
          <div className="pos-total" style={{ marginTop: 0 }}><span>Total</span><span>{formatMoney(total)}</span></div>

          <button className="btn btn-primary btn-block" onClick={save} disabled={saving || lines.length === 0}>
            {saving ? 'Registrando...' : 'Registrar venta'}
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setModal(false)}>Cancelar</button>
        </aside>
        </div>
      </Modal>

      {/* Consulta de venta realizada (comprobante) */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detalle de venta" width={460}>
        {detail && (
          <div>
            <div className="ticket-head">
              <span className="brand" style={{ fontSize: '1.1rem' }}>
                <span className="b-papel">Papel</span><span className="b-amp">&amp;</span><span className="b-fiesta">Fiesta</span>
              </span>
              <div className="t-num">Venta #{detail.id.slice(-6)}</div>
              <div className="t-date">{formatDate(detail.fecha)}</div>
            </div>

            <div className="ticket-info">
              <div className="ti"><span className="k">Canal</span><span className="v">{SALE_CHANNELS[detail.canal]?.label || detail.canal}</span></div>
              <div className="ti"><span className="k">Medio de pago</span><span className="v">{PAYMENT_METHODS[detail.metodoPago]?.label || detail.metodoPago}</span></div>
              <div className="ti"><span className="k">Cliente</span><span className="v">{detail.cliente || 'Consumidor final'}</span></div>
              <div className="ti"><span className="k">Unidades</span><span className="v">{detail.items.reduce((n, i) => n + i.cantidad, 0)}</span></div>
            </div>

            <table className="table" style={{ marginBottom: 12 }}>
              <thead><tr><th>Producto</th><th style={{ textAlign: 'center' }}>Cant.</th><th style={{ textAlign: 'right' }}>P. unit.</th><th style={{ textAlign: 'right' }}>Importe</th></tr></thead>
              <tbody>
                {detail.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.nombre}</td>
                    <td style={{ textAlign: 'center' }}>{i.cantidad}</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(i.precioUnit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(i.precioUnit * i.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="spread" style={{ marginBottom: 6 }}><span className="muted">Subtotal</span><span>{formatMoney(detail.subtotal)}</span></div>
            {detail.descuento > 0 && <div className="spread" style={{ marginBottom: 6 }}><span className="muted">Descuento</span><span>− {formatMoney(detail.descuento)}</span></div>}
            <div className="pos-total"><span>Total</span><span>{formatMoney(detail.total)}</span></div>

            <div className="ticket-actions">
              <button className="btn btn-ghost btn-block" onClick={() => window.print()}>🖨️ Imprimir</button>
              <button className="btn btn-primary btn-block" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default Sales;
