// src/pages/admin/ImportProducts.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { listPosProducts } from '../../services/posImportService';
import { getProducts, createProduct } from '../../services/productsService';
import { DEFAULT_CATEGORIES } from '../../constants';
import { formatMoney } from '../../utils/format';

const CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

const ImportProducts = () => {
  const navigate = useNavigate();
  const [posItems, setPosItems] = useState([]);
  const [importedIds, setImportedIds] = useState(new Set());
  const [rows, setRows] = useState({}); // productoId -> { sel, precioWeb, cupo, categoria }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pos, existentes] = await Promise.all([listPosProducts(), getProducts()]);
      setPosItems(pos.items);
      setDemo(Boolean(pos.demo));
      const ids = new Set(
        existentes.map((p) => p.origen?.productoId).filter(Boolean)
      );
      setImportedIds(ids);
      // Estado inicial de cada fila
      const init = {};
      pos.items.forEach((p) => {
        init[p.productoId] = {
          sel: false,
          precioWeb: p.precioLocal || '',
          cupo: Math.min(p.stockLocal || 0, 10),
          categoria: CATEGORY_IDS.includes(p.categoria) ? p.categoria : 'libreria',
        };
      });
      setRows(init);
    } catch (e) {
      setError(e?.message || 'No se pudo conectar con el inventario del POS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setRow = (id, patch) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  const seleccionados = posItems.filter((p) => rows[p.productoId]?.sel && !importedIds.has(p.productoId));

  const handleImport = async () => {
    if (seleccionados.length === 0) return;
    setSaving(true);
    try {
      for (const p of seleccionados) {
        const r = rows[p.productoId];
        await createProduct({
          nombre: p.nombre,
          descripcion: '',
          categoria: r.categoria,
          precioCosto: 0,                 // el costo vive en el POS, no se copia
          precioVenta: Number(r.precioWeb) || 0,
          stock: Number(r.cupo) || 0,     // cupo reservado para la web
          estado: 'activo',
          destacado: false,
          imagen: p.imagen || '',
          origen: { fuente: 'pos', productoId: p.productoId },
        });
      }
      alert(`✅ ${seleccionados.length} producto(s) importado(s). Podés editarlos en Productos.`);
      navigate('/admin/productos');
    } catch (e) {
      setError(e?.message || 'Error al importar.');
    } finally {
      setSaving(false);
    }
  };

  const visibles = posItems.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Importar desde el local">
      {demo && (
        <div className="demo-hint" style={{ marginBottom: 18 }}>
          🧪 Modo demo: mostrando un inventario de ejemplo. Con Firebase + la Cloud Function conectados verás el POS real.
        </div>
      )}
      {error && <div className="auth-error" style={{ marginBottom: 18 }}>{error}</div>}

      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔎 Buscar en el inventario..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="row gap-12">
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>↻ Actualizar</button>
          <button className="btn btn-primary" onClick={handleImport} disabled={saving || seleccionados.length === 0}>
            {saving ? 'Importando...' : `Importar ${seleccionados.length || ''} seleccionado(s)`}
          </button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th></th><th>Producto (POS)</th><th>Precio local</th><th>Stock local</th>
                <th>Categoría web</th><th>Precio web</th><th>Cupo web</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr><td colSpan={8} className="muted">No hay productos en el inventario.</td></tr>
              ) : visibles.map((p) => {
                const r = rows[p.productoId] || {};
                const yaImportado = importedIds.has(p.productoId);
                return (
                  <tr key={p.productoId} style={yaImportado ? { opacity: .55 } : undefined}>
                    <td>
                      <input type="checkbox" disabled={yaImportado}
                        checked={Boolean(r.sel)} onChange={(e) => setRow(p.productoId, { sel: e.target.checked })} />
                    </td>
                    <td>
                      <div className="row gap-8">
                        {p.imagen && <img className="table-thumb" src={p.imagen} alt="" />}
                        {p.nombre}
                      </div>
                    </td>
                    <td>{formatMoney(p.precioLocal)}</td>
                    <td>{p.stockLocal}</td>
                    <td>
                      <select className="select" style={{ minWidth: 130 }} value={r.categoria || 'libreria'}
                        disabled={yaImportado} onChange={(e) => setRow(p.productoId, { categoria: e.target.value })}>
                        {DEFAULT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="input" type="number" min="0" style={{ width: 110 }} value={r.precioWeb ?? ''}
                        disabled={yaImportado} onChange={(e) => setRow(p.productoId, { precioWeb: e.target.value })} />
                    </td>
                    <td>
                      <input className="input" type="number" min="0" max={p.stockLocal} style={{ width: 80 }} value={r.cupo ?? 0}
                        disabled={yaImportado} onChange={(e) => setRow(p.productoId, { cupo: e.target.value })} />
                    </td>
                    <td>
                      {yaImportado && <span className="badge badge-success">Importado</span>}
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

export default ImportProducts;
