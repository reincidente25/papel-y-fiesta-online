// src/pages/admin/AdminOrders.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getOrders, updateOrderStatus } from '../../services/ordersService';
import { ORDER_STATUS, ORDER_STATUS_LIST, ORDER_NEXT_ACTIONS } from '../../constants';
import { formatMoney, formatDate } from '../../utils/format';
import { getPagos, transferenciaTexto } from '../../services/pagosService';

// Icono WhatsApp inline reutilizable.
const WaIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4h.02C22.6 28.8 28 23.4 28 16.8 28 9.4 22.6 3 16 3zm0 23.3c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.9.9.9-4.8-.2-.4c-1-1.6-1.5-3.4-1.5-5.3C4.9 10 9.9 5 16 5s11.1 5 11.1 11.1S22.1 26.3 16 26.3zm5.5-7.8c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/></svg>
);
const itemPrecio = (i) => (i.precio || i.precioUnit || 0) * i.cantidad;
const itemImg = (i) => i.imagen || '';

// Arma el link de WhatsApp (wa.me) a partir de un teléfono argentino libre.
const waLink = (telefono, mensaje = '') => {
  let d = String(telefono || '').replace(/\D/g, '');
  if (!d) return '';
  if (!d.startsWith('54')) {
    d = d.replace(/^0/, '');          // saca el 0 inicial
    d = '549' + d.replace(/^9/, '');  // AR móvil: 54 9 + número
  }
  return `https://wa.me/${d}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [noDisp, setNoDisp] = useState(() => new Set()); // índices de ítems sin stock
  const [pagos, setPagos] = useState({});

  const load = () => { setLoading(true); getOrders().then(setOrders).finally(() => setLoading(false)); };
  useEffect(load, []);
  useEffect(() => { getPagos().then(setPagos); }, []);

  // Al abrir otro pedido, todos los ítems arrancan como disponibles.
  useEffect(() => { setNoDisp(new Set()); }, [detail?.id]);
  const toggleDisp = (idx) => setNoDisp((prev) => {
    const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
  });

  // Arma y abre el mensaje de WhatsApp al validar el pedido.
  const validarYavisar = () => {
    const items = detail.items || [];
    const disp = items.filter((_, idx) => !noDisp.has(idx));
    const falt = items.filter((_, idx) => noDisp.has(idx));
    const nombre = detail.cliente || '';
    const linea = (i) => `🔸 ${i.nombre} x${i.cantidad}`;
    const transf = transferenciaTexto(pagos);
    let msg;
    if (falt.length === 0) {
      msg = `¡Hola ${nombre}! 👋🎉\n\nTu pedido en *Papel & Fiesta* está confirmado ✅\n\n🛍️ Tenemos todo disponible:\n${disp.map(linea).join('\n')}\n\n💰 Total: ${formatMoney(detail.total)}\n\n🏦 Para abonar por transferencia:\n${transf || '(datos a cargar)'}\n\n📲 Cuando transfieras, mandanos el comprobante por acá.\n\n¡Gracias por tu compra! 🎈✨`;
      changeStatus(detail.id, 'confirmado');
    } else {
      const totalDisp = disp.reduce((n, i) => n + itemPrecio(i), 0);
      msg = `¡Hola ${nombre}! 👋\n\nSobre tu pedido en *Papel & Fiesta*:\n\n✅ Disponibles:\n${disp.map(linea).join('\n') || '(ninguno)'}\n\n❌ Sin stock por el momento:\n${falt.map(linea).join('\n')}\n\n¿Querés avanzar con lo disponible (${formatMoney(totalDisp)})? 😊 Si confirmás, te paso los datos para transferir.\n\n¡Gracias! 🎈`;
    }
    const url = waLink(detail.telefono, msg);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const changeStatus = async (id, estado) => {
    await updateOrderStatus(id, estado);
    const updated = await getOrders();
    setOrders(updated);
    setDetail((d) => (d ? updated.find((o) => o.id === d.id) || null : null));
  };

  const visible = filter === 'todos' ? orders : orders.filter((o) => o.estado === filter);
  const pendientes = orders.filter((o) => o.estado === 'pendiente').length;

  return (
    <AdminLayout title="Pedidos web">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi"><span className="kpi-icon">🛍️</span><span className="kpi-value">{orders.length}</span><span className="kpi-label">Pedidos</span></div>
        <div className="card kpi"><span className="kpi-icon">⏳</span><span className="kpi-value">{pendientes}</span><span className="kpi-label">Pendientes de validar</span></div>
        <div className="card kpi"><span className="kpi-icon">💵</span><span className="kpi-value">{formatMoney(orders.filter((o) => o.estado !== 'cancelado').reduce((n, o) => n + o.total, 0))}</span><span className="kpi-label">Monto en pedidos</span></div>
      </div>

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {ORDER_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : visible.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🧾</div>
          <h3>No hay pedidos en este estado</h3>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>N°</th><th>Cliente</th><th>Fecha</th><th>Entrega</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {visible.map((o) => {
                const st = ORDER_STATUS[o.estado] || ORDER_STATUS.pendiente;
                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(o)}>
                    <td>#{o.id.slice(-6)}</td>
                    <td>{o.cliente || o.email || '—'}</td>
                    <td>{formatDate(o.creadoEn)}</td>
                    <td>{o.entrega === 'envio' ? 'Envío' : 'Retiro'}</td>
                    <td><strong>{formatMoney(o.total)}</strong></td>
                    <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                    <td>
                    <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                      {o.telefono && (
                        <a className="wa-btn wa-icon-only" href={waLink(o.telefono, `Hola ${o.cliente || ''}, te escribimos de Papel & Fiesta por tu pedido #${o.id.slice(-6)}.`)} target="_blank" rel="noopener noreferrer" title="WhatsApp" onClick={(e) => e.stopPropagation()}><WaIcon /></a>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setDetail(o); }}>Gestionar</button>
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Pedido #${detail.id.slice(-6)}` : ''} width={520}>
        {detail && (() => {
          const st = ORDER_STATUS[detail.estado] || ORDER_STATUS.pendiente;
          const actions = ORDER_NEXT_ACTIONS[detail.estado] || [];
          return (
            <div>
              <div className="spread" style={{ marginBottom: 12 }}>
                <span className={`badge ${st.badge}`}>{st.label}</span>
                <span className="muted">{formatDate(detail.creadoEn)}</span>
              </div>
              <p style={{ color: 'var(--text-soft)', marginBottom: 14 }}>{st.desc}</p>

              <div className="card" style={{ padding: 14, marginBottom: 14 }}>
                <div className="pay-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span className="muted">Cliente</span><span>{detail.cliente || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <span className="muted">Contacto</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {detail.telefono || detail.email || '—'}
                    {detail.telefono && (
                      <a className="wa-btn" href={waLink(detail.telefono, `Hola ${detail.cliente || ''}, te escribimos de Papel & Fiesta por tu pedido #${detail.id.slice(-6)}.`)} target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp">
                        <WaIcon /> WhatsApp
                      </a>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span className="muted">Entrega</span><span>{detail.entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</span></div>
                {detail.notas && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span className="muted">Notas</span><span>{detail.notas}</span></div>}
              </div>

              {detail.estado === 'pendiente' && <p className="hint" style={{ marginBottom: 8 }}>Marcá los productos que tenés disponibles antes de validar.</p>}
              <div className="ord-items">
                {detail.items.map((i, idx) => {
                  const falta = noDisp.has(idx);
                  const gestionable = detail.estado === 'pendiente';
                  return (
                    <div className={`ord-item ${falta ? 'is-off' : ''}`} key={idx}>
                      {itemImg(i) ? <img className="table-thumb" src={itemImg(i)} alt="" /> : <span className="table-thumb thumb-ph">📦</span>}
                      <div className="ord-item-info">
                        <div className="ord-item-name">{i.nombre}</div>
                        <div className="muted" style={{ fontSize: '.82rem' }}>{i.cantidad} × {formatMoney(i.precio || i.precioUnit || 0)}</div>
                      </div>
                      <div className="ord-item-amount">{formatMoney(itemPrecio(i))}</div>
                      {gestionable && (
                        <label className="ord-chk" title="¿Disponible?">
                          <input type="checkbox" checked={!falta} onChange={() => toggleDisp(idx)} />
                          <span>{falta ? 'Sin stock' : 'Disponible'}</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="pos-total"><span>Total</span><span>{formatMoney(detail.total)}</span></div>

              {detail.estado === 'pendiente' ? (
                <div className="form-actions" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={validarYavisar} disabled={!detail.telefono} title={!detail.telefono ? 'El pedido no tiene teléfono' : ''}>
                    <WaIcon /> Validar y avisar por WhatsApp
                  </button>
                  <button className="btn btn-ghost" onClick={() => changeStatus(detail.id, 'cancelado')}>Cancelar pedido</button>
                </div>
              ) : actions.length > 0 && (
                <div className="form-actions" style={{ flexWrap: 'wrap' }}>
                  {actions.map((a) => (
                    <button key={a.to} className={`btn ${a.style}`} onClick={() => changeStatus(detail.id, a.to)}>{a.label}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </AdminLayout>
  );
};

export default AdminOrders;
