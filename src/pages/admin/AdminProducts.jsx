// src/pages/admin/AdminProducts.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getProducts, deleteProduct } from '../../services/productsService';
import { PRODUCT_STATUS } from '../../constants';
import { formatMoney, calcMargin } from '../../utils/format';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getProducts().then(setProducts).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    await deleteProduct(id);
    load();
  };

  const visible = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Productos">
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔎 Buscar producto..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Link to="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th></th><th>Producto</th><th>Costo</th><th>Venta</th>
                <th>Margen</th><th>Stock</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={8} className="muted">No hay productos. Creá el primero.</td></tr>
              ) : visible.map((p) => {
                const st = PRODUCT_STATUS[p.estado] || PRODUCT_STATUS.borrador;
                return (
                  <tr key={p.id}>
                    <td><img className="table-thumb" src={p.imagen} alt="" /></td>
                    <td>{p.nombre}</td>
                    <td>{formatMoney(p.precioCosto)}</td>
                    <td>{formatMoney(p.precioVenta)}</td>
                    <td>{calcMargin(p.precioCosto, p.precioVenta)}%</td>
                    <td>{p.stock}</td>
                    <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/admin/productos/${p.id}`} className="btn btn-ghost btn-sm">Editar</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.nombre)}>✕</button>
                      </div>
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

export default AdminProducts;
