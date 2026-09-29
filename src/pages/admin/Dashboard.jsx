// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getProducts } from '../../services/productsService';
import { getOrders } from '../../services/ordersService';
import { getSales } from '../../services/salesService';
import { getCashBalance } from '../../services/cashService';
import { formatMoney, formatDate } from '../../utils/format';
import { SALE_CHANNELS } from '../../constants';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getOrders(), getSales(), getCashBalance()])
      .then(([p, o, s, b]) => { setProducts(p); setOrders(o); setSales(s); setBalance(b); })
      .finally(() => setLoading(false));
  }, []);

  const hoy = new Date().toDateString();
  const ventasHoy = sales.filter((s) => new Date(s.fecha).toDateString() === hoy);
  const totalHoy = ventasHoy.reduce((n, s) => n + s.total, 0);
  const stockAlerta = products.filter((p) => p.stock <= 5).length;
  const valorInventario = products.reduce((n, p) => n + (Number(p.precioCosto) || 0) * (Number(p.stock) || 0), 0);

  return (
    <AdminLayout title="Dashboard">
      {loading ? <Loader /> : (
        <>
          <div className="kpi-grid">
            <div className="card kpi"><span className="kpi-icon">📅</span><span className="kpi-value">{formatMoney(totalHoy)}</span><span className="kpi-label">Vendido hoy ({ventasHoy.length})</span></div>
            <div className="card kpi"><span className="kpi-icon">💰</span><span className="kpi-value">{formatMoney(balance)}</span><span className="kpi-label">Saldo en caja</span></div>
            <div className="card kpi"><span className="kpi-icon">🛍️</span><span className="kpi-value">{orders.length}</span><span className="kpi-label">Pedidos web</span></div>
            <div className="card kpi"><span className="kpi-icon">⚠️</span><span className="kpi-value">{stockAlerta}</span><span className="kpi-label">Alertas de stock</span></div>
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="card kpi"><span className="kpi-icon">📦</span><span className="kpi-value">{products.length}</span><span className="kpi-label">Productos en catálogo</span></div>
            <div className="card kpi"><span className="kpi-icon">🏷️</span><span className="kpi-value">{formatMoney(valorInventario)}</span><span className="kpi-label">Valor inventario (a costo)</span></div>
          </div>

          <div className="toolbar">
            <h2 className="section-title">Últimas ventas</h2>
            <Link to="/admin/ventas" className="btn btn-primary btn-sm">Registrar venta</Link>
          </div>
          <div className="table-wrap card" style={{ marginBottom: 28 }}>
            <table className="table">
              <thead><tr><th>Fecha</th><th>Canal</th><th>Ítems</th><th>Total</th></tr></thead>
              <tbody>
                {sales.slice(0, 5).length === 0 ? (
                  <tr><td colSpan={4} className="muted">Sin ventas.</td></tr>
                ) : sales.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.fecha)}</td>
                    <td><span className={`badge ${SALE_CHANNELS[s.canal]?.badge || 'badge-muted'}`}>{SALE_CHANNELS[s.canal]?.label || s.canal}</span></td>
                    <td>{s.items.reduce((n, i) => n + i.cantidad, 0)}</td>
                    <td><strong>{formatMoney(s.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="toolbar">
            <h2 className="section-title">Stock a revisar</h2>
            <Link to="/admin/productos" className="btn btn-ghost btn-sm">Ver productos</Link>
          </div>
          <div className="table-wrap card">
            <table className="table">
              <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Estado</th></tr></thead>
              <tbody>
                {products.filter((p) => p.stock <= 5).length === 0 ? (
                  <tr><td colSpan={4} className="muted">Todo el stock está en orden 🎉</td></tr>
                ) : products.filter((p) => p.stock <= 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria}</td>
                    <td>{p.stock}</td>
                    <td><span className={`badge ${p.stock <= 0 ? 'badge-danger' : 'badge-warning'}`}>{p.stock <= 0 ? 'Sin stock' : 'Stock bajo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
