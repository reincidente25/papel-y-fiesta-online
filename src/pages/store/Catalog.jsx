// src/pages/store/Catalog.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';
import Loader from '../../components/common/Loader';
import { getPublicProducts } from '../../services/productsService';
import './store.css';

const SORTS = {
  relevancia: { label: 'Relevancia', fn: (a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) },
  precio_asc: { label: 'Precio: menor a mayor', fn: (a, b) => a.precioVenta - b.precioVenta },
  precio_desc:{ label: 'Precio: mayor a menor', fn: (a, b) => b.precioVenta - a.precioVenta },
  nombre:     { label: 'Nombre (A-Z)', fn: (a, b) => a.nombre.localeCompare(b.nombre) },
};

const Catalog = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('relevancia');

  const cat = params.get('cat') || 'todas';

  useEffect(() => {
    getPublicProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  // Categorías que realmente tienen productos en la web (con su conteo web).
  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (!p.categoria) continue;
      const e = map.get(p.categoria) || { id: p.categoria, name: p.categoriaNombre || p.categoria, cantidad: 0 };
      e.cantidad += 1;
      map.set(p.categoria, e);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const setCat = (id) => {
    if (id === 'todas') params.delete('cat');
    else params.set('cat', id);
    setParams(params, { replace: true });
  };

  const visible = useMemo(() => {
    let list = [...products];
    if (cat !== 'todas') list = list.filter((p) => p.categoria === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => `${p.nombreWeb || ''} ${p.nombre || ''}`.toLowerCase().includes(q));
    }
    return list.sort(SORTS[sort].fn);
  }, [products, cat, search, sort]);

  return (
    <StoreLayout>
      <div className="container catalog-layout">
        {/* Filtros */}
        <aside className="filters">
          <div className="filter-group">
            <h4>Categorías</h4>
            <div className="filter-list">
              <button className={`filter-btn ${cat === 'todas' ? 'active' : ''}`} onClick={() => setCat('todas')}>
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`filter-btn ${cat === c.id ? 'active' : ''}`}
                  onClick={() => setCat(c.id)}
                >
                  {c.icon ? `${c.icon} ` : ''}{c.name}{c.cantidad ? ` (${c.cantidad})` : ''}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Resultados */}
        <div>
          <div className="catalog-toolbar">
            <input
              className="input"
              style={{ maxWidth: 320 }}
              placeholder="🔎 Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="select" style={{ maxWidth: 220 }} value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <Loader />
          ) : visible.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <h3>No encontramos productos</h3>
              <p className="muted">Probá con otra categoría o término de búsqueda.</p>
            </div>
          ) : (
            <div className="product-grid">
              {visible.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
};

export default Catalog;
