// src/pages/admin/Purchases.jsx
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getPurchasesPage, getPurchasesStats, createPurchase } from '../../services/purchasesService';
import { getSuppliers } from '../../services/suppliersService';
import { getProducts } from '../../services/productsService';
import { PAYMENT_METHODS, PAYMENT_METHODS_LIST, PURCHASE_STATUS, PURCHASE_STATUS_LIST } from '../../constants';
import { formatMoney, formatDateTime } from '../../utils/format';

const PAGE = 20;

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ count: 0, totalInvertido: 0 });
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  // Nueva compra
  const [proveedorId, setProveedorId] = useState('');
  const [estado, setEstado] = useState('recibida');
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [lines, setLines] = useState([]);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getPurchasesPage({ pageSize: PAGE }), getPurchasesStats(), getSuppliers(), getProducts()])
      .then(([pg, st, sup, prod]) => {
        setPurchases(pg.items); setCursor(pg.cursor); setHasMore(pg.hasMore);
        setStats(st); setSuppliers(sup); setProducts(prod);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await getPurchasesPage({ pageSize: PAGE, cursor });
      setPurchases((prev) => [...prev, ...res.items]);
      setCursor(res.cursor); setHasMore(res.hasMore);
    } finally { setLoadingMore(false); }
  };

  const openNew = () => {
    setProveedorId(''); setEstado('recibida'); setMetodoPago('transferencia'); setLines([]); setQuery('');
    setModal(true);
  };

  const addLine = (p) => {
    setLines((ls) => {
      const ex = ls.find((l) => l.productoId === p.id);
      if (ex) return ls.map((l) => l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...ls, { productoId: p.id, codigo: p.codigo || '', nombre: p.nombre, cantidad: 1, costoUnit: p.precioCosto || 0 }];
    });
    setQuery('');
  };
  const setLine = (id, patch) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, ...patch } : l));
  const changeQty = (id, delta) => setLines((ls) => ls.map((l) => l.productoId === id ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l));
  const delLine = (id) => setLines((ls) => ls.filter((l) => l.productoId !== id));

  const results = query.trim()
    ? products.filter((p) => `${p.codigo || ''} ${p.nombre || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];
  const total = lines.reduce((n, l) => n + l.costoUnit * l.cantidad, 0);
  const totalItems = lines.reduce((n, l) => n + l.cantidad, 0);

  const save = async () => {
    if (lines.length === 0) return;
    setSaving(true);
    try {
      const prov = suppliers.find((s) => s.id === proveedorId);
      await createPurchase({ proveedorId, proveedorNombre: prov?.nombre || '—', items: lines, estado, metodoPago });
      setModal(false); load();
    } finally { setSaving(false); }
  };

  const prodMap = useMemo(() => {
    const m = new Map();
    for (const p of products) { m.set(p.id, p); if (p.codigo) m.set(p.codigo, p); }
    return m;
  }, [products]);
  const itemImg = (i) => (prodMap.get(i.productoId) || prodMap.get(i.codigo))?.imagen || '';
  const promedio = stats.count ? stats.totalInvertido / stats.count : 0;

  return (
    <AdminLayout title="Compras">
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat info"><span className="stat-ic">🛒</span><div><div className="stat-v">{stats.count}</div><div className="stat-l">Compras</div></div></div>
        <div className="stat ok"><span className="stat-ic">💵</span><div><div className="stat-v">{formatMoney(stats.totalInvertido)}</div><div className="stat-l">Total invertido</div></div></div>
        <div className="stat"><span className="stat-ic">📊</span><div><div className="stat-v">{formatMoney(promedio)}</div><div className="stat-l">Promedio por compra</div></div></div>
      </div>

      <div className="spread" style={{ marginBottom: 14 }}>
        <h2 className="section-title">Historial</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva compra</button>
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr><th>Fecha y hora</th><th>Proveedor</th><th>Comprobante</th><th>Ítems</th><th>Estado</th><th className="num">Total</th></tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={6} className="muted">No hay compras registradas.</td></tr>
                ) : purchases.map((c) => {
                  const st = PURCHASE_STATUS[c.estado] || { label: c.estado, badge: 'badge-muted' };
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(c)}>
                      <td>{formatDateTime(c.fecha)}</td>
                      <td>{c.proveedor || c.proveedorNombre || '—'}</td>
                      <td className="muted">{c.factura ? `Fact. ${c.factura}` : (c.remito ? `Rem. ${c.remito}` : '—')}</td>
                      <td>{(c.items || []).reduce((n, i) => n + i.cantidad, 0)}</td>
                      <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td className="num"><strong>{formatMoney(c.total)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="pager">
              <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Cargando...' : 'Cargar más'}</button>
            </div>
          )}
        </>
      )}

      {/* Nueva compra */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva compra" width={1000}>
        <div className="pos-grid" style={{ minHeight: '58vh' }}>
          <div>
            <div className="field pos-search" style={{ marginBottom: 6 }}>
              <label>Agregar productos</label>
              <input className="input" placeholder="🔎 Buscá por código o nombre..."
                value={query} onChange={(e) => setQuery(e.target.value)} />
              {results.length > 0 && (
                <div className="pos-results">
                  {results.map((p) => (
                    <div key={p.id} className="pos-result" onClick={() => addLine(p)}>
                      {p.imagen && <img src={p.imagen} alt="" />}
                      <span className="pos-result-name">{p.codigo ? <span className="code-chip" style={{ marginRight: 8 }}>{p.codigo}</span> : null}{p.nombre}</span>
                      <span className="pos-result-meta">costo {formatMoney(p.precioCosto || 0)} · stock {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="pos-empty">Agregá productos a la compra buscándolos arriba.</div>
            ) : (
              <div className="pos-cart">
                {lines.map((l) => (
                  <div className="pos-cart-item" key={l.productoId} style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
                    <div><div className="pos-cart-name">{l.nombre}</div><div className="pos-cart-price">costo unitario</div></div>
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
                {PAYMENT_METHODS_LIST.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
              </select></div>

            <div className="pos-total" style={{ marginTop: 0 }}><span>Total</span><span>{formatMoney(total)}</span></div>
            <button className="btn btn-primary btn-block" onClick={save} disabled={saving || lines.length === 0}>
              {saving ? 'Registrando...' : 'Registrar compra'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setModal(false)}>Cancelar</button>
          </aside>
        </div>
      </Modal>

      {/* Detalle de compra */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detalle de compra" width={720}>
        {detail && (
          <div className="ticket-modal">
            <div className="ticket-info">
              <div className="ti"><span className="k">Proveedor</span><span className="v">{detail.proveedor || detail.proveedorNombre || '—'}</span></div>
              <div className="ti"><span className="k">Fecha</span><span className="v">{formatDateTime(detail.fecha)}</span></div>
              <div className="ti"><span className="k">Comprobante</span><span className="v">{detail.factura ? `Factura ${detail.factura}` : (detail.remito ? `Remito ${detail.remito}` : '—')}</span></div>
              <div className="ti"><span className="k">Estado</span><span className="v"><span className={`badge ${PURCHASE_STATUS[detail.estado]?.badge || 'badge-muted'}`}>{PURCHASE_STATUS[detail.estado]?.label || detail.estado}</span>{detail.metodoPago ? ` · ${PAYMENT_METHODS[detail.metodoPago]?.label || detail.metodoPago}` : ''}</span></div>
            </div>

            {(detail.items || []).length === 0 ? (
              <div className="pos-empty" style={{ margin: '16px 0' }}>Esta compra no tiene detalle de ítems cargado.</div>
            ) : (
              <div className="sale-items">
                {detail.items.map((i, idx) => {
                  const img = itemImg(i);
                  return (
                    <div className="sale-item" key={idx}>
                      {img ? <img className="table-thumb" src={img} alt="" /> : <span className="table-thumb thumb-ph">📦</span>}
                      <div>
                        <div className="si-name">{i.nombre}</div>
                        <div className="si-meta">{i.codigo ? `${i.codigo} · ` : ''}{i.cantidad} × {formatMoney(i.costoUnit)}</div>
                      </div>
                      <div className="si-amount">{formatMoney(i.subtotal ?? i.costoUnit * i.cantidad)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sale-totals">
              <div className="pos-total" style={{ marginTop: 4 }}><span>Total</span><span>{formatMoney(detail.total)}</span></div>
            </div>
            {detail.notas && <p className="hint" style={{ marginTop: 10 }}>📝 {detail.notas}</p>}

            <div className="ticket-actions">
              <button className="btn btn-primary btn-block" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default Purchases;
