// src/pages/admin/Sales.jsx
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getSalesPage, getSalesStats, createSale } from '../../services/salesService';
import { getProducts } from '../../services/productsService';
import { getCustomers } from '../../services/customersService';
import { PAYMENT_METHODS, PAYMENT_METHODS_LIST, SALE_CHANNELS } from '../../constants';
import { formatMoney, formatDateTime, toDate } from '../../utils/format';

const PAGE = 20;

// Recargos por medio de pago
const RECARGO_DEBITO = 7;
const CREDITO_OPCIONES = [
  { cuotas: 1, recargo: 15, label: '1 pago (+15%)' },
  { cuotas: 2, recargo: 19, label: '2 pagos (+19%)' },
  { cuotas: 3, recargo: 19, label: '3 pagos (+19%)' },
];
const recargoPctDe = (metodo, cuotas) => {
  if (metodo === 'debito') return RECARGO_DEBITO;
  if (metodo === 'credito') return CREDITO_OPCIONES.find((c) => c.cuotas === cuotas)?.recargo || 0;
  return 0;
};

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ count: 0, totalHoy: 0, totalHistorico: 0 });
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado de la venta en curso
  const [lines, setLines] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [descTipo, setDescTipo] = useState('monto'); // 'monto' | 'porcentaje'
  const [cuotas, setCuotas] = useState(1);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [canal, setCanal] = useState('local');
  const [clienteId, setClienteId] = useState('');
  const [query, setQuery] = useState('');

  // Filtro por fecha y detalle
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getSalesPage({ pageSize: PAGE }), getSalesStats(), getProducts(), getCustomers()])
      .then(([pageRes, st, p, c]) => {
        setSales(pageRes.items);
        setCursor(pageRes.cursor);
        setHasMore(pageRes.hasMore);
        setStats(st);
        setProducts(p);
        setCustomers(c);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await getSalesPage({ pageSize: PAGE, cursor });
      setSales((prev) => [...prev, ...res.items]);
      setCursor(res.cursor);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const openNew = () => {
    setLines([]); setDescuento(0); setDescTipo('monto'); setCuotas(1);
    setMetodoPago('efectivo'); setCanal('local'); setClienteId(''); setQuery('');
    setModal(true);
  };

  const cambiarMetodo = (m) => {
    setMetodoPago(m);
    setCuotas(1); // débito = 1; crédito arranca en 1 pago
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
  const descValor = Number(descuento) || 0;
  const montoDesc = Math.min(descTipo === 'porcentaje' ? subtotal * (descValor / 100) : descValor, subtotal);
  const base = Math.max(0, subtotal - montoDesc);
  const recargoPct = recargoPctDe(metodoPago, cuotas);
  const recargoMonto = base * (recargoPct / 100);
  const total = base + recargoMonto;

  const save = async () => {
    if (lines.length === 0) return;
    setSaving(true);
    try {
      const cli = customers.find((c) => c.id === clienteId);
      await createSale({
        canal, items: lines, metodoPago,
        cliente: cli?.nombre || 'Consumidor final', clienteId,
        cuotas: metodoPago === 'credito' ? cuotas : (metodoPago === 'debito' ? 1 : 0),
        tipoDescuento: descTipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo',
        valorDesc: descValor, montoDesc, recargoPct, recargoMonto,
      });
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const filtered = sales.filter((s) => {
    const f = toDate(s.fecha);
    if (!f) return !desde && !hasta;
    if (desde && f < new Date(desde)) return false;
    if (hasta && f > new Date(hasta + 'T23:59:59')) return false;
    return true;
  });

  // Lookup de productos para mostrar imágenes en el detalle
  const prodMap = useMemo(() => {
    const m = new Map();
    for (const p of products) { m.set(p.id, p); if (p.codigo) m.set(p.codigo, p); }
    return m;
  }, [products]);
  const itemImg = (i) => (prodMap.get(i.productoId) || prodMap.get(i.codigo))?.imagen || '';

  const payChip = (m) => {
    const p = PAYMENT_METHODS[m];
    return <span className={`badge ${p?.badge || 'badge-muted'}`}>{p?.icon || '•'} {p?.label || m}</span>;
  };

  return (
    <AdminLayout title="Ventas">
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat info"><span className="stat-ic">🧾</span><div><div className="stat-v">{stats.count}</div><div className="stat-l">Ventas registradas</div></div></div>
        <div className="stat ok"><span className="stat-ic">📅</span><div><div className="stat-v">{formatMoney(stats.totalHoy)}</div><div className="stat-l">Vendido hoy</div></div></div>
        <div className="stat ok"><span className="stat-ic">💵</span><div><div className="stat-v">{formatMoney(stats.totalHistorico)}</div><div className="stat-l">Total histórico</div></div></div>
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
              <tr><th>Fecha y hora</th><th>Canal</th><th>Ítems</th><th>Pago</th><th>Cliente</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="muted">No hay ventas en el período.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(s)}>
                  <td>{formatDateTime(s.fecha)}</td>
                  <td><span className={`badge ${SALE_CHANNELS[s.canal]?.badge || 'badge-muted'}`}>{SALE_CHANNELS[s.canal]?.label || s.canal}</span></td>
                  <td>{s.items.reduce((n, i) => n + i.cantidad, 0)}</td>
                  <td>{payChip(s.metodoPago)}</td>
                  <td>{s.cliente || '—'}</td>
                  <td className="num"><strong>{formatMoney(s.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && hasMore && !desde && !hasta && (
        <div className="pager">
          <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
      {!loading && (desde || hasta) && hasMore && (
        <p className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
          El filtro por fecha aplica sobre las {sales.length} ventas cargadas. Limpiá el filtro para cargar más.
        </p>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva venta" width={1060}>
        <div className="pos-grid" style={{ minHeight: '62vh' }}>
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
            <select className="select" value={metodoPago} onChange={(e) => cambiarMetodo(e.target.value)}>
              {PAYMENT_METHODS_LIST.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
            </select></div>

          {metodoPago === 'debito' && (
            <p className="hint">1 cuota · recargo {RECARGO_DEBITO}%</p>
          )}
          {metodoPago === 'credito' && (
            <div className="field"><label>Cuotas</label>
              <select className="select" value={cuotas} onChange={(e) => setCuotas(Number(e.target.value))}>
                {CREDITO_OPCIONES.map((c) => <option key={c.cuotas} value={c.cuotas}>{c.label}</option>)}
              </select></div>
          )}

          <div className="field"><label>Descuento</label>
            <div className="row gap-8">
              <input className="input" type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} style={{ flex: 1 }} />
              <select className="select" style={{ width: 70 }} value={descTipo} onChange={(e) => setDescTipo(e.target.value)}>
                <option value="monto">$</option>
                <option value="porcentaje">%</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Cliente</label>
            <select className="select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Consumidor final</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select></div>

          <div className="spread" style={{ fontSize: '.88rem' }}><span className="muted">Subtotal</span><span>{formatMoney(subtotal)}</span></div>
          {montoDesc > 0 && <div className="spread" style={{ fontSize: '.88rem' }}><span className="muted">Descuento{descTipo === 'porcentaje' ? ` (${descValor}%)` : ''}</span><span>− {formatMoney(montoDesc)}</span></div>}
          {recargoMonto > 0 && <div className="spread" style={{ fontSize: '.88rem' }}><span className="muted">Recargo ({recargoPct}%)</span><span>+ {formatMoney(recargoMonto)}</span></div>}
          <div className="pos-total" style={{ marginTop: 0 }}><span>Total</span><span>{formatMoney(total)}</span></div>

          <button className="btn btn-primary btn-block" onClick={save} disabled={saving || lines.length === 0}>
            {saving ? 'Registrando...' : 'Registrar venta'}
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setModal(false)}>Cancelar</button>
        </aside>
        </div>
      </Modal>

      {/* Consulta de venta realizada (comprobante) */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detalle de venta" width={720}>
        {detail && (() => {
          const descuento = detail.montoDesc ?? detail.descuento ?? 0;
          const unidades = detail.items.reduce((n, i) => n + i.cantidad, 0);
          return (
            <div className="ticket-modal">
              <div className="ticket-head">
                <span className="brand" style={{ fontSize: '1.2rem' }}>
                  <span className="b-papel">Papel</span><span className="b-amp">&amp;</span><span className="b-fiesta">Fiesta</span>
                </span>
                <div className="t-date">{formatDateTime(detail.fecha)}</div>
              </div>

              <div className="ticket-info">
                <div className="ti"><span className="k">Cliente</span><span className="v">{detail.cliente || 'Consumidor final'}</span></div>
                <div className="ti"><span className="k">Canal</span><span className="v"><span className={`badge ${SALE_CHANNELS[detail.canal]?.badge || 'badge-muted'}`}>{SALE_CHANNELS[detail.canal]?.label || detail.canal}</span></span></div>
                <div className="ti"><span className="k">Medio de pago</span><span className="v">{payChip(detail.metodoPago)}{detail.cuotas > 0 ? ` · ${detail.cuotas} cuota${detail.cuotas > 1 ? 's' : ''}` : ''}</span></div>
                <div className="ti"><span className="k">Unidades</span><span className="v">{unidades} ({detail.items.length} ítem/s)</span></div>
              </div>

              <div className="sale-items">
                {detail.items.map((i, idx) => {
                  const img = itemImg(i);
                  return (
                    <div className="sale-item" key={idx}>
                      {img ? <img className="table-thumb" src={img} alt="" /> : <span className="table-thumb thumb-ph">📦</span>}
                      <div>
                        <div className="si-name">{i.nombre}</div>
                        <div className="si-meta">{i.codigo ? `${i.codigo} · ` : ''}{i.cantidad} × {formatMoney(i.precioUnit)}</div>
                      </div>
                      <div className="si-amount">{formatMoney(i.subtotal ?? i.precioUnit * i.cantidad)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="sale-totals">
                <div className="spread" style={{ marginBottom: 8, fontSize: '.98rem' }}><span className="muted">Subtotal</span><span>{formatMoney(detail.subtotal)}</span></div>
                {descuento > 0 && <div className="spread" style={{ marginBottom: 8, fontSize: '.98rem' }}><span className="muted">Descuento</span><span>− {formatMoney(descuento)}</span></div>}
                {detail.recargoMonto > 0 && <div className="spread" style={{ marginBottom: 8, fontSize: '.98rem' }}><span className="muted">Recargo ({detail.recargoPct}%)</span><span>+ {formatMoney(detail.recargoMonto)}</span></div>}
                <div className="pos-total" style={{ marginTop: 4 }}><span>Total</span><span>{formatMoney(detail.total)}</span></div>
              </div>

              <div className="ticket-actions">
                <button className="btn btn-ghost btn-block" onClick={() => window.print()}>🖨️ Imprimir</button>
                <button className="btn btn-primary btn-block" onClick={() => setDetail(null)}>Cerrar</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </AdminLayout>
  );
};

export default Sales;
