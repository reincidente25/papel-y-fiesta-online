// src/pages/admin/AdminOrders.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getOrders, updateOrderStatus } from '../../services/ordersService';
import { ORDER_STATUS, ORDER_STATUS_LIST, ORDER_NEXT_ACTIONS } from '../../constants';
import { formatMoney, formatDate } from '../../utils/format';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('todos');

  const load = () => { setLoading(true); getOrders().then(setOrders).finally(() => setLoading(false)); };
  useEffect(load, []);

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
                    <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setDetail(o); }}>Gestionar</button></td>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span className="muted">Contacto</span><span>{detail.telefono || detail.email || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span className="muted">Entrega</span><span>{detail.entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</span></div>
                {detail.notas && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span className="muted">Notas</span><span>{detail.notas}</span></div>}
              </div>

              <table className="table" style={{ marginBottom: 14 }}>
                <thead><tr><th>Producto</th><th>Cant.</th><th style={{ textAlign: 'right' }}>Importe</th></tr></thead>
                <tbody>
                  {detail.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>{i.nombre}</td>
                      <td>{i.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney((i.precio || i.precioUnit || 0) * i.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pos-total"><span>Total</span><span>{formatMoney(detail.total)}</span></div>

              {actions.length > 0 && (
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
