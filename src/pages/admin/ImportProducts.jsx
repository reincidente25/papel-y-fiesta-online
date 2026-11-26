// src/pages/admin/ImportProducts.jsx
// Sincroniza el catálogo web con el inventario del local (POS):
//  • Nuevos: están en el local y no en la web → importar.
//  • Existentes: están en ambos → actualizar stock (cantidad).
//  • Huérfanos: están en la web pero ya no en el local → pausar o eliminar.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { listPosProducts } from '../../services/posImportService';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productsService';
import { getCategories } from '../../services/categoriesService';
import { formatMoney } from '../../utils/format';

const ImportProducts = () => {
  const navigate = useNavigate();
  const [posItems, setPosItems] = useState([]);
  const [webItems, setWebItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState({});       // productoId -> { sel, precioWeb, cupo, categoria }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    setLoading(true); setError(''); setOk('');
    try {
      const [pos, web, cats] = await Promise.all([listPosProducts(), getProducts(), getCategories({ soloActivas: false })]);
      setPosItems(pos.items || []);
      setWebItems(web);
      setCategories(cats);
      setDemo(Boolean(pos.demo));
      const catId = cats[0]?.id || 'libreria';
      const init = {};
      (pos.items || []).forEach((p) => {
        init[p.productoId] = {
          sel: true,
          precioWeb: p.precioLocal || '',
          cupo: p.stockLocal || 0,
          categoria: cats.find((c) => c.id === p.categoria)?.id || catId,
        };
      });
      setRows(init);
    } catch (e) {
      setError(e?.message || 'No se pudo conectar con el inventario del local.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setRow = (id, patch) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  // Índice de productos web por su origen (productoId del POS).
  const webPorPos = new Map();
  for (const w of webItems) { const pid = w.origen?.productoId; if (pid) webPorPos.set(pid, w); }
  const posIds = new Set(posItems.map((p) => p.productoId));

  const nuevos = posItems.filter((p) => !webPorPos.has(p.productoId));
  const existentes = posItems.filter((p) => webPorPos.has(p.productoId)).map((p) => ({ pos: p, web: webPorPos.get(p.productoId) }));
  const huerfanos = webItems.filter((w) => w.origen?.fuente === 'pos' && w.origen?.productoId && !posIds.has(w.origen.productoId));

  const seleccionados = nuevos.filter((p) => rows[p.productoId]?.sel);

  // Importar los nuevos seleccionados.
  const importarNuevos = async () => {
    if (!seleccionados.length) return;
    setBusy(true); setError(''); setOk('');
    try {
      for (const p of seleccionados) {
        const r = rows[p.productoId];
        const cat = categories.find((c) => c.id === r.categoria);
        await createProduct({
          nombre: p.nombre, descripcion: '', categoria: r.categoria, categoriaNombre: cat?.name || '',
          precioCosto: 0, precioVenta: Number(r.precioWeb) || 0, stock: Number(r.cupo) || 0,
          estado: 'activo', destacado: false, mostrarWeb: false, imagen: p.imagen || '',
          origen: { fuente: 'pos', productoId: p.productoId },
        });
      }
      setOk(`✅ ${seleccionados.length} producto(s) nuevo(s) importado(s).`);
      await load();
    } catch (e) { setError(e?.message || 'Error al importar.'); }
    finally { setBusy(false); }
  };

  // Actualizar el stock de los existentes con el del local.
  const sincronizarStock = async () => {
    const aActualizar = existentes.filter(({ pos, web }) => (web.stock ?? 0) !== (pos.stockLocal ?? 0));
    if (!aActualizar.length) { setOk('El stock ya está sincronizado.'); return; }
    if (!window.confirm(`Actualizar el stock de ${aActualizar.length} producto(s) con el del local?`)) return;
    setBusy(true); setError(''); setOk('');
    try {
      for (const { pos, web } of aActualizar) await updateProduct(web.id, { stock: pos.stockLocal ?? 0 });
      setOk(`✅ Stock actualizado en ${aActualizar.length} producto(s).`);
      await load();
    } catch (e) { setError(e?.message || 'Error al sincronizar.'); }
    finally { setBusy(false); }
  };

  const pausarHuerfano = async (w) => {
    setBusy(true);
    try { await updateProduct(w.id, { estado: 'pausado', mostrarWeb: false }); await load(); }
    finally { setBusy(false); }
  };
  const eliminarHuerfano = async (w) => {
    if (!window.confirm(`Eliminar "${w.nombre}" de la web? (no existe más en el local)`)) return;
    setBusy(true);
    try { await deleteProduct(w.id); await load(); }
    finally { setBusy(false); }
  };

  const toggleAllNuevos = (val) => setRows((r) => {
    const n = { ...r };
    nuevos.forEach((p) => { n[p.productoId] = { ...n[p.productoId], sel: val }; });
    return n;
  });

  return (
    <AdminLayout title="Sincronizar con el local">
      {demo && <div className="demo-hint" style={{ marginBottom: 18 }}>🧪 Modo demo: inventario de ejemplo. Con el POS conectado verás el inventario real.</div>}
      {error && <div className="auth-error" style={{ marginBottom: 14 }}>{error}</div>}
      {ok && <div className="save-ok" style={{ display: 'block', marginBottom: 14 }}>{ok}</div>}

      <div className="toolbar">
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,auto)', gap: 12, margin: 0 }}>
          <span className="badge badge-success">🆕 {nuevos.length} nuevos</span>
          <span className="badge badge-info">🔄 {existentes.length} existentes</span>
          <span className="badge badge-warning">⚠️ {huerfanos.length} no están en el local</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading || busy}>↻ Actualizar</button>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* NUEVOS */}
          <section style={{ marginBottom: 26 }}>
            <div className="toolbar">
              <h3 className="section-title">🆕 Nuevos en el local</h3>
              <div className="row gap-8">
                {nuevos.length > 0 && <>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAllNuevos(true)}>Todos</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAllNuevos(false)}>Ninguno</button>
                  <button className="btn btn-primary btn-sm" onClick={importarNuevos} disabled={busy || !seleccionados.length}>
                    {busy ? 'Importando…' : `Importar ${seleccionados.length || ''}`}
                  </button>
                </>}
              </div>
            </div>
            {nuevos.length === 0 ? <p className="muted">No hay productos nuevos en el local.</p> : (
              <div className="table-wrap card">
                <table className="table">
                  <thead><tr><th /><th>Producto</th><th>Precio local</th><th>Stock</th><th>Categoría web</th><th>Precio web</th><th>Cupo web</th></tr></thead>
                  <tbody>
                    {nuevos.map((p) => {
                      const r = rows[p.productoId] || {};
                      return (
                        <tr key={p.productoId}>
                          <td><input type="checkbox" checked={Boolean(r.sel)} onChange={(e) => setRow(p.productoId, { sel: e.target.checked })} /></td>
                          <td><div className="row gap-8">{p.imagen && <img className="table-thumb" src={p.imagen} alt="" />}{p.nombre}</div></td>
                          <td>{formatMoney(p.precioLocal)}</td>
                          <td>{p.stockLocal}</td>
                          <td><select className="select" style={{ minWidth: 130 }} value={r.categoria} onChange={(e) => setRow(p.productoId, { categoria: e.target.value })}>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select></td>
                          <td><input className="input" type="number" min="0" style={{ width: 110 }} value={r.precioWeb ?? ''} onChange={(e) => setRow(p.productoId, { precioWeb: e.target.value })} /></td>
                          <td><input className="input" type="number" min="0" style={{ width: 80 }} value={r.cupo ?? 0} onChange={(e) => setRow(p.productoId, { cupo: e.target.value })} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* EXISTENTES */}
          <section style={{ marginBottom: 26 }}>
            <div className="toolbar">
              <h3 className="section-title">🔄 Existentes (actualizar stock)</h3>
              {existentes.length > 0 && <button className="btn btn-primary btn-sm" onClick={sincronizarStock} disabled={busy}>Sincronizar stock</button>}
            </div>
            {existentes.length === 0 ? <p className="muted">No hay coincidencias con la web.</p> : (
              <div className="table-wrap card">
                <table className="table">
                  <thead><tr><th>Producto</th><th>Stock local</th><th>Stock web</th><th>Estado</th></tr></thead>
                  <tbody>
                    {existentes.map(({ pos, web }) => {
                      const dif = (web.stock ?? 0) !== (pos.stockLocal ?? 0);
                      return (
                        <tr key={pos.productoId}>
                          <td>{web.nombre}</td>
                          <td>{pos.stockLocal}</td>
                          <td>{web.stock ?? 0}</td>
                          <td>{dif ? <span className="badge badge-warning">Difiere</span> : <span className="badge badge-success">OK</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* HUÉRFANOS */}
          <section>
            <h3 className="section-title" style={{ marginBottom: 12 }}>⚠️ En la web pero no en el local</h3>
            {huerfanos.length === 0 ? <p className="muted">Todo lo de la web sigue existiendo en el local.</p> : (
              <div className="table-wrap card">
                <table className="table">
                  <thead><tr><th>Producto</th><th>Stock web</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {huerfanos.map((w) => (
                      <tr key={w.id}>
                        <td>{w.nombre}</td>
                        <td>{w.stock ?? 0}</td>
                        <td><span className={`badge ${w.estado === 'pausado' ? 'badge-muted' : 'badge-success'}`}>{w.estado}</span></td>
                        <td><div className="row gap-8">
                          <button className="btn btn-ghost btn-sm" onClick={() => pausarHuerfano(w)} disabled={busy}>Pausar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => eliminarHuerfano(w)} disabled={busy}>Eliminar</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/productos')}>← Volver a Productos</button>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default ImportProducts;
