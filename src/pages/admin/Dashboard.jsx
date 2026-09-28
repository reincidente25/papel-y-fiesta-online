// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getProducts } from '../../services/productsService';
import { getOrders } from '../../services/ordersService';
import { formatMoney } from '../../utils/format';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getOrders()])
      .then(([p, o]) => { setProducts(p); setOrders(o); })
      .finally(() => setLoading(false));
  }, []);

  const stockBajo = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const sinStock = products.filter((p) => p.stock <= 0).length;
  const valorInventario = products.reduce((n, p) => n + (Number(p.precioCosto) || 0) * (Number(p.stock) || 0), 0);

  return (
    <AdminLayout title="Dashboard">
      {loading ? <Loader /> : (
        <>
          <div className="kpi-grid">
            <div className="card kpi">
              <span className="kpi-icon">📦</span>
              <span className="kpi-value">{products.length}</span>
              <span className="kpi-label">Productos</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">🧾</span>
              <span className="kpi-value">{orders.length}</span>
              <span className="kpi-label">Pedidos</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">⚠️</span>
              <span className="kpi-value">{stockBajo + sinStock}</span>
              <span className="kpi-label">Alertas de stock</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">💰</span>
              <span className="kpi-value">{formatMoney(valorInventario)}</span>
              <span className="kpi-label">Valor inventario (costo)</span>
            </div>
          </div>

          <div className="toolbar">
            <h2 className="section-title">Stock a revisar</h2>
            <Link to="/admin/productos" className="btn btn-primary btn-sm">Gestionar productos</Link>
          </div>

          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {products.filter((p) => p.stock <= 5).length === 0 ? (
                  <tr><td colSpan={4} className="muted">Todo el stock está en orden 🎉</td></tr>
                ) : (
                  products.filter((p) => p.stock <= 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span className={`badge ${p.stock <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.stock <= 0 ? 'Sin stock' : 'Stock bajo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
