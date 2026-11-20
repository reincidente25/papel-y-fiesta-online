// src/pages/store/MyOrders.jsx
// Listado de los pedidos del usuario logueado, en tabla con estado y detalle.
import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import './MyOrders.css';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUser, updateOrderStatus } from '../../services/ordersService';
import { ORDER_STATUS } from '../../constants';
import { STORE_INFO } from '../../config/store';
import { formatMoney, formatDate } from '../../utils/format';

const waUrl = (msg) => {
  const num = (STORE_INFO.whatsapp || '').replace(/[^\d]/g, '');
  return `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
};

// Link de WhatsApp al local con un mensaje prearmado por pedido.
const waLocal = (o) => waUrl(`¡Hola Papel & Fiesta! 👋 Te consulto por mi pedido *#${o.id.slice(-6)}* (${formatMoney(o.total)}).`);

// Link para informar el pago de un pedido.
const waInformarPago = (o) => waUrl(
  `¡Hola Papel & Fiesta! 👋\n\nYa realicé el pago de mi pedido *#${o.id.slice(-6)}* 💳\n`
  + `🧾 Total: ${formatMoney(o.total)}\n\n`
  + `Te adjunto el comprobante de la transferencia 📸 ¡Gracias! 🎉`,
);

// Etiquetas de entrega y pago.
export const entregaLabel = (o) => {
  if (o.entrega === 'envio') {
    const serv = o.envio?.servicio || 'Envío a domicilio';
    const aprox = o.envio?.precioAprox ? ` · ~${formatMoney(o.envio.precioAprox)} aprox.` : '';
    return `🚚 ${serv}${aprox}`;
  }
  return '🏪 Retiro en el local';
};
export const pagoLabel = (o) => {
  const m = o.metodoPago || 'transferencia';
  if (m === 'transferencia') return '🏦 Transferencia';
  if (m === 'debito') return '💳 Débito';
  const c = Number(o.cuotas) || 1;
  return `💳 Crédito${c > 1 ? ` · ${c} cuotas` : ''}`;
};

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getOrdersByUser(user.uid)
      .then((list) => {
        const ms = (o) => {
          const c = o.creadoEn;
          if (!c) return 0;
          if (typeof c === 'string') return new Date(c).getTime();
          if (c.seconds) return c.seconds * 1000;
          if (c.toMillis) return c.toMillis();
          return 0;
        };
        setOrders([...list].sort((a, b) => ms(b) - ms(a)));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const informarPago = (o) => {
    window.open(waInformarPago(o), '_blank', 'noopener');
    updateOrderStatus(o.id, 'pago_informado')
      .then(() => setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, estado: 'pago_informado' } : x))))
      .catch(() => {});
  };

  if (loading) return <StoreLayout><Loader /></StoreLayout>;

  if (!user) {
    return (
      <StoreLayout>
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <h3>Ingresá para ver tus pedidos</h3>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Ingresar</Link>
        </div>
      </StoreLayout>
    );
  }

  if (!orders.length) {
    return (
      <StoreLayout>
        <div className="empty">
          <div className="empty-icon">🧾</div>
          <h3>Todavía no hiciste ningún pedido</h3>
          <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16 }}>Ir al catálogo</Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container" style={{ padding: '24px 0 48px' }}>
        <h1 className="section-title" style={{ marginBottom: 6 }}>Mis pedidos</h1>
        <p className="muted" style={{ marginBottom: 20 }}>{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>

        <div className="table-wrap">
          <table className="table orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = ORDER_STATUS[o.estado] || ORDER_STATUS.pendiente;
                const items = o.items || [];
                const cant = items.reduce((a, i) => a + (i.cantidad || 0), 0);
                const abiertoEste = abierto === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr>
                      <td><strong>#{o.id.slice(-6)}</strong></td>
                      <td>{formatDate(o.creadoEn)}</td>
                      <td>{cant} art.</td>
                      <td><strong>{formatMoney(o.total)}</strong></td>
                      <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAbierto(abiertoEste ? null : o.id)}>
                          {abiertoEste ? 'Ocultar' : 'Ver detalle'}
                        </button>
                        <Link to={`/pedido/${o.id}`} className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }}>Seguir</Link>
                        {o.estado === 'confirmado' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => informarPago(o)} style={{ marginLeft: 6 }} title="Avisar que ya transferiste">
                            💳 Informar pago
                          </button>
                        ) : (
                          <a className="btn btn-wa btn-sm" href={waLocal(o)} target="_blank" rel="noreferrer" style={{ marginLeft: 6 }} title="Consultar por WhatsApp">
                            <span aria-hidden>💬</span> WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                    {abiertoEste && (
                      <tr className="order-detail-row">
                        <td colSpan={6}>
                          <div className="order-detail">
                            <div className="order-detail-meta">
                              <span>{entregaLabel(o)}</span>
                              <span>{pagoLabel(o)}</span>
                            </div>
                            {o.entrega === 'envio' && o.direccionTexto && (
                              <div className="order-detail-dir">📍 {o.direccionTexto}</div>
                            )}
                            {items.map((i, idx) => (
                              <div className="order-detail-item" key={idx}>
                                <span className="odi-prod">
                                  {i.imagen
                                    ? <img src={i.imagen} alt={i.nombre} className="odi-thumb" loading="lazy" />
                                    : <span className="odi-thumb odi-thumb-ph">🎁</span>}
                                  <span>{i.cantidad}× {i.nombre}{i.variante ? ` (${i.variante})` : ''}</span>
                                </span>
                                <span>{formatMoney((i.precio || i.precioUnit || 0) * (i.cantidad || 1))}</span>
                              </div>
                            ))}
                            <div className="order-detail-item total">
                              <span>Total</span>
                              <span>{formatMoney(o.total)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </StoreLayout>
  );
};

export default MyOrders;
