// src/pages/admin/Purchases.jsx
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getPurchasesPage, getPurchasesStats, createPurchase } from '../../services/purchasesService';
import { getSuppliers } from '../../services/suppliersService';
import { getProducts } from '../../services/productsService';
import { PAYMENT_METHODS, PURCHASE_STATUS } from '../../constants';
import { formatMoney, formatDateTime } from '../../utils/format';

const PAGE = 20;
const EMPTY = { proveedorId: '', remito: '', factura: '', total: '', notas: '' };

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
  const [form, setForm] = useState(EMPTY);

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

  const openNew = () => { setForm(EMPTY); setModal(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const prov = suppliers.find((s) => s.id === form.proveedorId);
      await createPurchase({
        proveedorId: form.proveedorId, proveedorNombre: prov?.nombre || '—',
        remito: form.remito, factura: form.factura, notas: form.notas,
        total: Number(form.total) || 0, estado: 'recibida', items: [],
      });
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

      {/* Nueva compra (por monto total) */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva compra" width={560}>
        <form onSubmit={save} className="form-grid">
          <div className="field full"><label>Proveedor *</label>
            <select className="select" value={form.proveedorId} onChange={(e) => set('proveedorId', e.target.value)} required>
              <option value="">Seleccionar proveedor...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select></div>
          <div className="field"><label>N° Remito</label>
            <input className="input" value={form.remito} onChange={(e) => set('remito', e.target.value)} placeholder="ej: R-0001-00012345" /></div>
          <div className="field"><label>N° Factura</label>
            <input className="input" value={form.factura} onChange={(e) => set('factura', e.target.value)} placeholder="ej: FA-0001-00012345" /></div>
          <div className="field full"><label>Monto total *</label>
            <input className="input" type="number" min="0" step="0.01" value={form.total} onChange={(e) => set('total', e.target.value)} placeholder="$ 0.00" required /></div>
          <div className="field full"><label>Notas (opcional)</label>
            <textarea className="textarea" value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones de la compra..." /></div>
          <div className="form-actions full">
            <button type="submit" className="btn btn-primary" disabled={saving || !form.proveedorId || !form.total}>
              {saving ? 'Registrando...' : 'Registrar compra'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </form>
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
              <div className="pos-empty" style={{ margin: '16px 0' }}>Esta compra se registró por monto total (sin detalle de ítems).</div>
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
