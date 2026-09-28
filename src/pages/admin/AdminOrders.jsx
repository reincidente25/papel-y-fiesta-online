// src/pages/admin/AdminOrders.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getOrders, updateOrderStatus } from '../../services/ordersService';
import { ORDER_STATUS, ORDER_STATUS_LIST } from '../../constants';
import { formatMoney, formatDate } from '../../utils/format';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getOrders().then(setOrders).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleStatus = async (id, estado) => {
    await updateOrderStatus(id, estado);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));
  };

  return (
    <AdminLayout title="Pedidos">
      {loading ? <Loader /> : orders.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🧾</div>
          <h3>Todavía no hay pedidos</h3>
          <p className="muted">Cuando un cliente finalice una compra vas a verla acá con su seguimiento.</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = ORDER_STATUS[o.estado] || ORDER_STATUS.pendiente;
                return (
                  <tr key={o.id}>
                    <td>#{o.id.slice(0, 6)}</td>
                    <td>{o.email}</td>
                    <td>{formatDate(o.creadoEn)}</td>
                    <td>{formatMoney(o.total)}</td>
                    <td>
                      <select className="select" style={{ maxWidth: 160 }} value={o.estado}
                        onChange={(e) => handleStatus(o.id, e.target.value)}>
                        {ORDER_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <span className={`badge ${st.badge}`} style={{ marginLeft: 8 }}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
