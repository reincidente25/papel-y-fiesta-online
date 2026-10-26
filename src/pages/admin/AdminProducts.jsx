// src/pages/admin/AdminProducts.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getProducts, deleteProduct, bulkUpdateProducts } from '../../services/productsService';
import { PRODUCT_STATUS } from '../../constants';
import { formatMoney, calcMargin } from '../../utils/format';

const PAGE_SIZE = 50;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

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

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
      `${p.codigo || ''} ${p.nombre || ''} ${p.nombreWeb || ''}`.toLowerCase().includes(q)
    );
  }, [products, search]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset de página al buscar
  useEffect(() => { setPage(0); }, [search]);

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const pageAllSelected = pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));
  const togglePage = () => setSelected((s) => {
    const n = new Set(s);
    if (pageAllSelected) pageItems.forEach((p) => n.delete(p.id));
    else pageItems.forEach((p) => n.add(p.id));
    return n;
  });
  const selectAllFiltered = () => setSelected(new Set(visible.map((p) => p.id)));
  const clearSel = () => setSelected(new Set());

  const applyBulk = async (data, label) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`${label} en ${ids.length} producto(s)?`)) return;
    setBusy(true);
    try {
      await bulkUpdateProducts(ids, data);
      clearSel();
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title="Productos">
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔎 Buscar por nombre o código..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="row gap-12">
          <span className="muted">{visible.length} productos</span>
          <Link to="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>
        </div>
      </div>

      {/* Barra de acciones masivas */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.size} seleccionado(s)</span>
          {selected.size < visible.length && (
            <button className="btn-link" onClick={selectAllFiltered}>Seleccionar los {visible.length} que coinciden</button>
          )}
          <div className="bulk-actions">
            <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => applyBulk({ mostrarWeb: true }, 'Mostrar en web')}>🌐 Mostrar en web</button>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => applyBulk({ mostrarWeb: false, destacado: false }, 'Ocultar de la web')}>Ocultar</button>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => applyBulk({ mostrarWeb: true, destacado: true }, 'Marcar destacado')}>★ Destacar</button>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => applyBulk({ destacado: false }, 'Quitar destacado')}>Quitar destacado</button>
            <button className="btn btn-ghost btn-sm" onClick={clearSel}>Limpiar</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" checked={pageAllSelected} onChange={togglePage} /></th>
                  <th></th><th>Producto</th><th>Código</th><th>Costo</th><th>Venta</th>
                  <th>Margen</th><th>Stock</th><th>Estado</th><th>Web</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr><td colSpan={11} className="muted">No hay productos.</td></tr>
                ) : pageItems.map((p) => {
                  const st = PRODUCT_STATUS[p.estado] || PRODUCT_STATUS.borrador;
                  return (
                    <tr key={p.id} className={selected.has(p.id) ? 'row-sel' : ''}>
                      <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                      <td><img className="table-thumb" src={p.imagen} alt="" /></td>
                      <td>{p.nombreWeb || p.nombre}</td>
                      <td className="muted">{p.codigo || '—'}</td>
                      <td>{formatMoney(p.precioCosto)}</td>
                      <td>{formatMoney(p.precioVenta)}</td>
                      <td>{calcMargin(p.precioCosto, p.precioVenta)}%</td>
                      <td>{p.stock}</td>
                      <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td>
                        {p.mostrarWeb
                          ? <span className="badge badge-success">{p.destacado ? '★ web' : '🌐 web'}</span>
                          : <span className="badge badge-muted">—</span>}
                      </td>
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

          {pageCount > 1 && (
            <div className="pager">
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
              <span className="muted">Página {page + 1} de {pageCount}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
