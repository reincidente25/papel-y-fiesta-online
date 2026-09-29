// src/pages/store/OrderStatus.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import Loader from '../../components/common/Loader';
import { getOrderById, updateOrderStatus } from '../../services/ordersService';
import { ORDER_STATUS, ORDER_FLOW } from '../../constants';
import { PAYMENT_INFO, STORE_INFO } from '../../config/store';
import { formatMoney, formatDate } from '../../utils/format';

const OrderStatus = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getOrderById(id).then(setOrder).finally(() => setLoading(false)); };
  useEffect(load, [id]);

  const informarPago = async () => {
    await updateOrderStatus(id, 'pago_informado');
    load();
  };

  if (loading) return <StoreLayout><Loader /></StoreLayout>;
  if (!order) {
    return (
      <StoreLayout>
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <h3>Pedido no encontrado</h3>
          <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16 }}>Ir al catálogo</Link>
        </div>
      </StoreLayout>
    );
  }

  const st = ORDER_STATUS[order.estado] || ORDER_STATUS.pendiente;
  const cancelado = order.estado === 'cancelado';
  // Mostrar datos de pago desde que se confirma el stock y hasta que se paga.
  const mostrarPago = ['confirmado', 'pago_informado'].includes(order.estado);

  return (
    <StoreLayout>
      <div className="container order-page">
        <div className="order-head">
          <span className="badge badge-success" style={{ marginBottom: 10 }}>Pedido recibido</span>
          <div className="order-num">Pedido #{order.id.slice(-6)}</div>
          <p className="muted">{formatDate(order.creadoEn)}</p>
        </div>

        {!cancelado ? (
          <div className="timeline">
            {ORDER_FLOW.map((key) => {
              const step = ORDER_STATUS[key];
              const done = st.step > step.step;
              const current = st.step === step.step;
              return (
                <div key={key} className={`tl-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                  <div className="tl-dot">{done ? '✓' : step.step + 1}</div>
                  <span className="tl-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="order-cancel">Este pedido fue cancelado. Ante cualquier duda, escribinos por WhatsApp.</div>
        )}

        <div className="card order-box" style={{ textAlign: 'center' }}>
          <span className={`badge ${st.badge}`}>{st.label}</span>
          <p style={{ marginTop: 12, color: 'var(--text-soft)' }}>{st.desc}</p>
        </div>

        {/* Datos de pago (solo cuando corresponde) */}
        {mostrarPago && (
          <div className="card order-box">
            <h3 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 6 }}>💳 Datos para transferir</h3>
            <p className="muted" style={{ marginBottom: 14 }}>Total a abonar: <strong style={{ color: 'var(--brand-ink)' }}>{formatMoney(order.total)}</strong></p>
            <div className="pay-row"><span className="k">Titular</span><span className="v">{PAYMENT_INFO.titular}</span></div>
            <div className="pay-row"><span className="k">Banco</span><span className="v">{PAYMENT_INFO.banco}</span></div>
            <div className="pay-row"><span className="k">CBU</span><span className="v">{PAYMENT_INFO.cbu}</span></div>
            <div className="pay-row"><span className="k">Alias</span><span className="v">{PAYMENT_INFO.alias}</span></div>
            <div className="pay-row"><span className="k">CUIT</span><span className="v">{PAYMENT_INFO.cuit}</span></div>
            <p className="hint" style={{ marginTop: 12 }}>{PAYMENT_INFO.aclaracion}</p>
            {order.estado === 'confirmado' ? (
              <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={informarPago}>
                Ya transferí
              </button>
            ) : (
              <p className="badge badge-muted" style={{ marginTop: 14 }}>Pago informado — verificando ✓</p>
            )}
          </div>
        )}

        {/* Detalle del pedido */}
        <div className="card order-box">
          <h3 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 14 }}>Tu pedido</h3>
          {order.items.map((i, idx) => (
            <div className="pay-row" key={idx}>
              <span className="k">{i.cantidad}× {i.nombre}</span>
              <span className="v">{formatMoney((i.precio || i.precioUnit || 0) * i.cantidad)}</span>
            </div>
          ))}
          <div className="pay-row" style={{ marginTop: 6 }}>
            <span className="v">Total</span>
            <span className="v" style={{ fontSize: '1.1rem' }}>{formatMoney(order.total)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p className="muted" style={{ fontSize: '.9rem' }}>¿Dudas? Escribinos por WhatsApp: {STORE_INFO.whatsapp}</p>
          <Link to="/catalogo" className="btn btn-ghost" style={{ marginTop: 12 }}>Seguir comprando</Link>
        </div>
      </div>
    </StoreLayout>
  );
};

export default OrderStatus;
