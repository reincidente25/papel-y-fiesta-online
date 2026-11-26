// src/pages/store/Catalog.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';
import Loader from '../../components/common/Loader';
import { getPublicProducts } from '../../services/productsService';
import { formatMoney } from '../../utils/format';
import './store.css';

const SORTS = {
  relevancia: { label: 'Relevancia', fn: (a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) },
  precio_asc: { label: 'Precio: menor a mayor', fn: (a, b) => a.precioVenta - b.precioVenta },
  precio_desc: { label: 'Precio: mayor a menor', fn: (a, b) => b.precioVenta - a.precioVenta },
  nombre: { label: 'Nombre (A-Z)', fn: (a, b) => a.nombre.localeCompare(b.nombre) },
};

const Catalog = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('relevancia');
  const [marcasSel, setMarcasSel] = useState(() => new Set());
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [soloStock, setSoloStock] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const cat = params.get('cat') || 'todas';

  useEffect(() => { getPublicProducts().then(setProducts).finally(() => setLoading(false)); }, []);

  // Categorías con conteo web.
  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (!p.categoria) continue;
      const e = map.get(p.categoria) || { id: p.categoria, name: p.categoriaNombre || p.categoria, icon: p.icon, cantidad: 0 };
      e.cantidad += 1;
      map.set(p.categoria, e);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Marcas con conteo.
  const marcas = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const m = (p.marca || '').trim();
      if (!m) continue;
      map.set(m, (map.get(m) || 0) + 1);
    }
    return [...map.entries()].map(([name, cantidad]) => ({ name, cantidad })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const setCat = (id) => {
    if (id === 'todas') params.delete('cat'); else params.set('cat', id);
    setParams(params, { replace: true });
  };
  const toggleMarca = (m) => setMarcasSel((s) => { const n = new Set(s); n.has(m) ? n.delete(m) : n.add(m); return n; });
  const limpiar = () => { setCat('todas'); setMarcasSel(new Set()); setPrecioMin(''); setPrecioMax(''); setSoloStock(false); setSearch(''); };
  const hayFiltros = cat !== 'todas' || marcasSel.size > 0 || precioMin || precioMax || soloStock || search;

  const visible = useMemo(() => {
    let list = [...products];
    if (cat !== 'todas') list = list.filter((p) => p.categoria === cat);
    if (marcasSel.size > 0) list = list.filter((p) => marcasSel.has((p.marca || '').trim()));
    const min = Number(precioMin) || 0;
    const max = Number(precioMax) || Infinity;
    list = list.filter((p) => (p.precioVenta || 0) >= min && (p.precioVenta || 0) <= max);
    if (soloStock) list = list.filter((p) => (p.stock || 0) > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => `${p.nombreWeb || ''} ${p.nombre || ''} ${p.marca || ''}`.toLowerCase().includes(q));
    }
    return list.sort(SORTS[sort].fn);
  }, [products, cat, marcasSel, precioMin, precioMax, soloStock, search, sort]);

  const sidebar = (
    <>
      <div className="filter-group">
        <div className="filter-head"><h4>Filtros</h4>{hayFiltros && <button className="filter-clear" onClick={limpiar}>Limpiar</button>}</div>
      </div>

      <div className="filter-group">
        <h4>Categorías</h4>
        <div className="filter-list">
          <button className={`filter-btn ${cat === 'todas' ? 'active' : ''}`} onClick={() => setCat('todas')}>Todas</button>
          {categories.map((c) => (
            <button key={c.id} className={`filter-btn ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
              {c.icon ? `${c.icon} ` : ''}{c.name}{c.cantidad ? ` (${c.cantidad})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Precio</h4>
        <div className="filter-precio">
          <input className="input" type="number" min="0" placeholder="Mín" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} />
          <span>—</span>
          <input className="input" type="number" min="0" placeholder="Máx" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
        </div>
      </div>

      {marcas.length > 0 && (
        <div className="filter-group">
          <h4>Marcas</h4>
          <div className="filter-checks">
            {marcas.map((m) => (
              <label key={m.name} className="filter-check">
                <input type="checkbox" checked={marcasSel.has(m.name)} onChange={() => toggleMarca(m.name)} />
                <span>{m.name} <small>({m.cantidad})</small></span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="filter-group">
        <label className="filter-check">
          <input type="checkbox" checked={soloStock} onChange={(e) => setSoloStock(e.target.checked)} />
          <span>Solo con stock</span>
        </label>
      </div>
    </>
  );

  return (
    <StoreLayout>
      <div className="container catalog-layout">
        <aside className={`filters ${filtrosOpen ? 'open' : ''}`}>{sidebar}</aside>

        <div>
          <div className="catalog-toolbar">
            <button className="btn btn-ghost btn-sm filters-toggle" onClick={() => setFiltrosOpen((v) => !v)}>
              ⚙️ Filtros{hayFiltros ? ' •' : ''}
            </button>
            <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="🔎 Buscar producto por nombre o marca..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="select" style={{ maxWidth: 220 }} value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {!loading && (
            <p className="catalog-count">{visible.length} producto{visible.length !== 1 ? 's' : ''}{precioMin || precioMax ? ` · ${formatMoney(Number(precioMin) || 0)}–${precioMax ? formatMoney(Number(precioMax)) : '∞'}` : ''}</p>
          )}

          {loading ? <Loader /> : visible.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <h3>No encontramos productos</h3>
              <p className="muted">Probá con otros filtros o término de búsqueda.</p>
              {hayFiltros && <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={limpiar}>Limpiar filtros</button>}
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
