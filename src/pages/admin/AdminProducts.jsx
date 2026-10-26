// src/pages/admin/AdminProducts.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getProducts, deleteProduct, bulkUpdateProducts } from '../../services/productsService';
import { getCategories } from '../../services/categoriesService';
import { PRODUCT_STATUS } from '../../constants';
import { formatMoney, calcMargin } from '../../utils/format';

const PAGE_SIZE = 50;

const esStockBajo = (p) => p.stock > 0 && (p.stockMinimo > 0 ? p.stock <= p.stockMinimo : p.stock <= 5);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('todas');
  const [filterVis, setFilterVis] = useState('todos');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getProducts().then(setProducts).finally(() => setLoading(false)); };
  useEffect(load, []);
  useEffect(() => { getCategories({ soloActivas: false }).then(setCategories); }, []);

  // KPIs sobre todo el catálogo
  const kpis = useMemo(() => ({
    activos: products.filter((p) => p.estado === 'activo').length,
    stockBajo: products.filter(esStockBajo).length,
    sinStock: products.filter((p) => (p.stock || 0) <= 0).length,
    sinPrecio: products.filter((p) => !(p.precioVenta > 0)).length,
  }), [products]);

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    await deleteProduct(id);
    load();
  };

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (q && !`${p.codigo || ''} ${p.nombre || ''} ${p.nombreWeb || ''} ${p.categoriaNombre || ''}`.toLowerCase().includes(q)) return false;
      if (filterCat !== 'todas' && p.categoria !== filterCat) return false;
      if (filterVis === 'activos' && p.estado !== 'activo') return false;
      if (filterVis === 'pausados' && p.estado === 'activo') return false;
      if (filterVis === 'web' && !p.mostrarWeb) return false;
      if (filterVis === 'ocultos' && p.mostrarWeb) return false;
      if (filterVis === 'destacados' && !p.destacado) return false;
      return true;
    });
  }, [products, search, filterCat, filterVis]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  useEffect(() => { setPage(0); }, [search, filterCat, filterVis]);

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pageAllSelected = pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));
  const togglePage = () => setSelected((s) => {
    const n = new Set(s);
    if (pageAllSelected) pageItems.forEach((p) => n.delete(p.id)); else pageItems.forEach((p) => n.add(p.id));
    return n;
  });
  const clearSel = () => setSelected(new Set());
  const allFilteredSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const toggleAllFiltered = () => (allFilteredSelected ? clearSel() : setSelected(new Set(visible.map((p) => p.id))));

  const applyBulk = async (data, label) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`${label} en ${ids.length} producto(s)?`)) return;
    setBusy(true);
    try { await bulkUpdateProducts(ids, data); clearSel(); load(); } finally { setBusy(false); }
  };

  const descargar = () => {
    const cols = ['codigo', 'nombre', 'nombreWeb', 'categoriaNombre', 'precioCosto', 'precioVenta', 'stock', 'stockMinimo', 'estado', 'mostrarWeb', 'destacado'];
    const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [cols.join(','), ...visible.map((p) => cols.map((c) => esc(p[c])).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'productos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Productos">
      <div className="spread" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <p className="muted">{kpis.activos} productos activos · {categories.length} categorías</p>
        <div className="row gap-8">
          <button className="btn btn-ghost btn-sm" onClick={descargar}>⬇️ Descargar lista</button>
          <Link to="/admin/productos/nuevo" className="btn btn-primary btn-sm">+ Nuevo producto</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-row">
        <div className="stat ok"><span className="stat-ic">📦</span><div><div className="stat-v">{kpis.activos}</div><div className="stat-l">Activos</div></div></div>
        <div className="stat info"><span className="stat-ic">🏷️</span><div><div className="stat-v">{categories.length}</div><div className="stat-l">Categorías</div></div></div>
        <div className="stat warn"><span className="stat-ic">⚠️</span><div><div className="stat-v">{kpis.stockBajo}</div><div className="stat-l">Stock bajo</div></div></div>
        <div className="stat danger"><span className="stat-ic">🚫</span><div><div className="stat-v">{kpis.sinStock}</div><div className="stat-l">Sin stock</div></div></div>
        <div className="stat danger"><span className="stat-ic">💲</span><div><div className="stat-v">{kpis.sinPrecio}</div><div className="stat-l">Sin precio venta</div></div></div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="spread" style={{ gap: 10, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="🔎 Buscar por nombre, código o categoría..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select" style={{ maxWidth: 210 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select" style={{ maxWidth: 180 }} value={filterVis} onChange={(e) => setFilterVis(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="pausados">Pausados</option>
            <option value="web">En la web</option>
            <option value="ocultos">Ocultos de web</option>
            <option value="destacados">Destacados</option>
          </select>
        </div>
      </div>

      {/* Barra de acciones masivas */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.size} seleccionado(s)</span>
          {!allFilteredSelected && <button className="btn-link" onClick={() => setSelected(new Set(visible.map((p) => p.id)))}>Seleccionar los {visible.length} que coinciden</button>}
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
          <div className="spread" style={{ marginBottom: 10 }}>
            <span className="muted">{visible.length} productos</span>
            <label className="row gap-8" style={{ cursor: 'pointer', fontSize: '.85rem' }}>
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} /> Seleccionar todos ({visible.length})
            </label>
          </div>

          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}><input type="checkbox" checked={pageAllSelected} onChange={togglePage} /></th>
                  <th>Código / Nombre</th><th>Categoría</th>
                  <th className="num">P. Compra</th><th className="num">P. Venta</th>
                  <th>Stock</th><th>Estado</th><th>Web</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr><td colSpan={9} className="muted">No hay productos.</td></tr>
                ) : pageItems.map((p) => {
                  const st = PRODUCT_STATUS[p.estado] || PRODUCT_STATUS.borrador;
                  const stockCls = p.stock <= 0 ? 'stock-0' : (esStockBajo(p) ? 'stock-low' : 'stock-ok');
                  return (
                    <tr key={p.id} className={selected.has(p.id) ? 'row-sel' : ''}>
                      <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                      <td>
                        <div className="row gap-12">
                          <span className="code-chip">{p.codigo || '—'}</span>
                          <span><span className="prod-name">{p.nombreWeb || p.nombre}</span>{p.marca && <span className="prod-marca">{p.marca}</span>}</span>
                        </div>
                      </td>
                      <td>{p.categoriaNombre ? <span className="cat-chip-sm">{p.categoriaNombre}</span> : <span className="muted">—</span>}</td>
                      <td className="num">{formatMoney(p.precioCosto)}</td>
                      <td className="num">{formatMoney(p.precioVenta)}</td>
                      <td>
                        <span className={`stock-n ${stockCls}`}>{p.stock ?? 0}</span>
                        {p.stockMinimo > 0 && <span className="stock-min">mín.{p.stockMinimo}</span>}
                      </td>
                      <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td>{p.mostrarWeb ? <span className="badge badge-success">{p.destacado ? '★' : '🌐'}</span> : <span className="muted">—</span>}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/admin/productos/${p.id}`} className="icon-btn" title="Editar">✏️</Link>
                          <button className="icon-btn danger" title="Eliminar" onClick={() => handleDelete(p.id, p.nombre)}>🗑️</button>
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
