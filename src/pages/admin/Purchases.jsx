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
  const [detail, setDetail] = useState(null);

  const [proveedorId, setProveedorId] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [lines, setLines] = useState([]);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getPurchases(), getSuppliers(), getProducts()])
      .then(([c, p, pr]) => { setPurchases(c); setSuppliers(p); setProducts(pr); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setProveedorId(''); setEstado('pendiente'); setMetodoPago('transferencia'); setLines([]); setQuery('');
    setModal(true);
  };

  const addLine = (p) => {
    setLines((ls) => {
      const ex = ls.find((l) => l.productoId === p.id);
      if (ex) return ls.map((l) => l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...ls, { productoId: p.id, nombre: p.nombre, cantidad: 1, costoUnit: p.precioCosto || 0 }];
    });
    setQuery('');
  };
  const setLine = (id, patch) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, ...patch } : l));
  const changeQty = (id, delta) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l));
  const delLine = (id) => setLines((ls) => ls.filter((l) => l.productoId !== id));

  const results = query.trim()
    ? products.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];
  const total = lines.reduce((n, l) => n + l.costoUnit * l.cantidad, 0);
  const totalItems = lines.reduce((n, l) => n + l.cantidad, 0);

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
              <tr><th>N°</th><th>Fecha</th><th>Proveedor</th><th>Ítems</th><th>Pago</th><th>Estado</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={8} className="muted">No hay compras registradas.</td></tr>
              ) : purchases.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(c)}>
                  <td>#{c.id.slice(-4)}</td>
                  <td>{formatDate(c.fecha)}</td>
                  <td>{c.proveedorNombre}</td>
                  <td>{c.items.reduce((n, i) => n + i.cantidad, 0)}</td>
                  <td>{PAYMENT_METHODS[c.metodoPago]?.label || c.metodoPago}</td>
                  <td><span className={`badge ${PURCHASE_STATUS[c.estado]?.badge || 'badge-muted'}`}>{PURCHASE_STATUS[c.estado]?.label || c.estado}</span></td>
                  <td><strong>{formatMoney(c.total)}</strong></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setDetail(c); }}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nueva compra */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva compra" width={880}>
        <div className="pos-grid">
          <div>
            <div className="field pos-search" style={{ marginBottom: 6 }}>
              <label>Agregar productos</label>
              <input className="input" placeholder="🔎 Buscá por nombre y hacé clic para agregar..."
                value={query} onChange={(e) => setQuery(e.target.value)} />
              {results.length > 0 && (
                <div className="pos-results">
                  {results.map((p) => (
                    <div key={p.id} className="pos-result" onClick={() => addLine(p)}>
                      {p.imagen && <img src={p.imagen} alt="" />}
                      <span className="pos-result-name">{p.nombre}</span>
                      <span className="pos-result-meta">costo {formatMoney(p.precioCosto || 0)} · stock {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="pos-empty">Todavía no agregaste productos. Buscá arriba y hacé clic para sumarlos.</div>
            ) : (
              <div className="pos-cart">
                {lines.map((l) => (
                  <div className="pos-cart-item" key={l.productoId} style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
                    <div>
                      <div className="pos-cart-name">{l.nombre}</div>
                      <div className="pos-cart-price">costo unitario</div>
                    </div>
                    <input className="input" type="number" min="0" style={{ width: 110 }} value={l.costoUnit}
                      onChange={(e) => setLine(l.productoId, { costoUnit: Number(e.target.value) })} />
                    <div className="qty-mini">
                      <button type="button" onClick={() => changeQty(l.productoId, -1)}>−</button>
                      <span>{l.cantidad}</span>
                      <button type="button" onClick={() => changeQty(l.productoId, +1)}>+</button>
                    </div>
                    <span className="pos-line-total">{formatMoney(l.costoUnit * l.cantidad)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => delLine(l.productoId)}>✕</button>
                  </div>
                ))}
                <p className="hint" style={{ textAlign: 'right' }}>{totalItems} unidad(es) · {lines.length} producto(s)</p>
              </div>
            )}
          </div>

          <aside className="pos-aside">
            <div className="field"><label>Proveedor</label>
              <select className="select" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Seleccioná...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select></div>
            <div className="field"><label>Estado</label>
              <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {PURCHASE_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select></div>
            <div className="field"><label>Medio de pago</label>
              <select className="select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                {PAYMENT_METHODS_LIST.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select></div>

            <div className="pos-total" style={{ marginTop: 0 }}><span>Total</span><span>{formatMoney(total)}</span></div>
            <button className="btn btn-primary btn-block" onClick={save} disabled={saving || lines.length === 0}>
              {saving ? 'Registrando...' : 'Registrar compra'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setModal(false)}>Cancelar</button>
          </aside>
        </div>
      </Modal>

      {/* Consulta de compra */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detalle de compra" width={560}>
        {detail && (
          <div>
            <div className="ticket-info">
              <div className="ti"><span className="k">Proveedor</span><span className="v">{detail.proveedorNombre}</span></div>
              <div className="ti"><span className="k">Fecha</span><span className="v">{formatDate(detail.fecha)}</span></div>
              <div className="ti"><span className="k">Medio de pago</span><span className="v">{PAYMENT_METHODS[detail.metodoPago]?.label || detail.metodoPago}</span></div>
              <div className="ti"><span className="k">Estado</span><span className="v"><span className={`badge ${PURCHASE_STATUS[detail.estado]?.badge || 'badge-muted'}`}>{PURCHASE_STATUS[detail.estado]?.label || detail.estado}</span></span></div>
            </div>
            <table className="table" style={{ marginBottom: 12 }}>
              <thead><tr><th>Producto</th><th style={{ textAlign: 'center' }}>Cant.</th><th style={{ textAlign: 'right' }}>Costo u.</th><th style={{ textAlign: 'right' }}>Importe</th></tr></thead>
              <tbody>
                {detail.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.nombre}</td>
                    <td style={{ textAlign: 'center' }}>{i.cantidad}</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(i.costoUnit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(i.costoUnit * i.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pos-total"><span>Total</span><span>{formatMoney(detail.total)}</span></div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default Purchases;
