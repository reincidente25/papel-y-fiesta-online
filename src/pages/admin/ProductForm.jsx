// src/pages/admin/ProductForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import RichText from '../../components/common/RichText';
import ImageUploader from '../../components/admin/ImageUploader';
import VariantImage from '../../components/admin/VariantImage';
import { getProductById, createProduct, updateProduct } from '../../services/productsService';
import { PRODUCT_STATUS, PRODUCT_STATUS_LIST, VARIANT_TYPES } from '../../constants';
import { getCategories } from '../../services/categoriesService';
import { calcMargin, formatMoney } from '../../utils/format';
import { nuevaVarianteId, limpiarVariantes, stockTotal, precioDesde, costoDesde } from '../../utils/variants';

const EMPTY = {
  codigo: '', nombre: '', nombreWeb: '', descripcion: '', categoria: '',
  precioCosto: '', precioVenta: '', stock: '', estado: 'activo',
  mostrarWeb: false, destacado: false, imagen: '', imagenes: [],
  tieneVariantes: false, variantes: [],
};

const filaVacia = () => ({ id: nuevaVarianteId(), tipo: '', nombre: '', precioCosto: '', precioVenta: '', stock: '', imagen: '' });

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories({ soloActivas: false }).then(setCategories);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getProductById(id).then((p) => {
      if (p) {
        // Compatibilidad: productos viejos con una sola `imagen`.
        const imagenes = p.imagenes?.length ? p.imagenes : (p.imagen ? [p.imagen] : []);
        setForm({ ...EMPTY, ...p, imagenes });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // --- Variantes ---
  const toggleVariantes = (on) => setForm((f) => ({
    ...f,
    tieneVariantes: on,
    variantes: on && !(f.variantes?.length) ? [filaVacia()] : f.variantes,
  }));
  const setVar = (vid, k, v) => setForm((f) => ({
    ...f, variantes: f.variantes.map((x) => (x.id === vid ? { ...x, [k]: v } : x)),
  }));
  const addVar = () => setForm((f) => ({ ...f, variantes: [...(f.variantes || []), filaVacia()] }));
  const delVar = (vid) => setForm((f) => ({ ...f, variantes: f.variantes.filter((x) => x.id !== vid) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const catSel = categories.find((c) => c.id === form.categoria);
    const imagenes = form.imagenes || [];
    const conVar = form.tieneVariantes;
    const variantes = conVar ? limpiarVariantes(form.variantes) : [];
    const prodDerivado = { tieneVariantes: conVar, variantes };
    const payload = {
      ...form,
      imagenes,
      imagen: imagenes[0] || '', // portada = primera imagen (compatibilidad)
      categoriaNombre: catSel?.name || '',
      tieneVariantes: conVar,
      variantes,
      // Con variantes, el precio y el stock del producto se derivan de ellas.
      precioCosto: conVar ? costoDesde(prodDerivado) : (Number(form.precioCosto) || 0),
      precioVenta: conVar ? precioDesde(prodDerivado) : (Number(form.precioVenta) || 0),
      stock: conVar ? stockTotal(prodDerivado) : (Number(form.stock) || 0),
    };
    try {
      if (isEdit) await updateProduct(id, payload);
      else await createProduct(payload);
      navigate('/admin/productos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Producto"><Loader /></AdminLayout>;

  const margen = calcMargin(form.precioCosto, form.precioVenta);
  const ganancia = (Number(form.precioVenta) || 0) - (Number(form.precioCosto) || 0);
  const st = PRODUCT_STATUS[form.estado] || PRODUCT_STATUS.borrador;

  return (
    <AdminLayout title={isEdit ? 'Editar producto' : 'Nuevo producto'}>
      <form onSubmit={handleSubmit}>
        <div className="editor-grid">
          {/* Columna principal: datos */}
          <div className="card" style={{ padding: 26 }}>
            <div className="form-grid">
              <div className="field">
                <label>Código {isEdit ? '' : '*'}</label>
                <input className="input" value={form.codigo}
                  onChange={(e) => set('codigo', e.target.value)}
                  readOnly={isEdit} required={!isEdit} placeholder="Ej: VAR-046" />
                {isEdit && <span className="hint">El código es el identificador; no se edita.</span>}
              </div>
              <div className="field">
                <label>Nombre (interno) *</label>
                <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
              </div>

              <div className="field full">
                <label>Nombre web</label>
                <input className="input" value={form.nombreWeb} onChange={(e) => set('nombreWeb', e.target.value)}
                  placeholder="Cómo se muestra en la tienda (si se deja vacío, usa el nombre interno)" />
              </div>

              <div className="field full">
                <label>Descripción</label>
                <RichText value={form.descripcion} onChange={(v) => set('descripcion', v)}
                  placeholder="Detalle del producto. Podés usar negrita, cursiva y listas con viñetas." />
              </div>

              <div className="field">
                <label>Categoría</label>
                <select className="select" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Estado</label>
                <select className="select" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
                  {PRODUCT_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {!form.tieneVariantes && (
                <div className="field full">
                  <div className="trio">
                    <div className="field">
                      <label>Precio de costo</label>
                      <input className="input" type="number" min="0" value={form.precioCosto}
                        onChange={(e) => set('precioCosto', e.target.value)} placeholder="0" />
                    </div>
                    <div className="field">
                      <label>Precio de venta</label>
                      <input className="input" type="number" min="0" value={form.precioVenta}
                        onChange={(e) => set('precioVenta', e.target.value)} placeholder="0" />
                    </div>
                    <div className="field">
                      <label>Stock</label>
                      <input className="input" type="number" min="0" value={form.stock}
                        onChange={(e) => set('stock', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  {form.precioVenta > 0 && (
                    <span className="margin-pill" style={{ marginTop: 12 }}>Margen {margen}% · Ganancia {formatMoney(ganancia)} / unidad</span>
                  )}
                </div>
              )}

              <div className="field full toggles-row">
                <label className="switch">
                  <input type="checkbox" checked={!!form.mostrarWeb}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setForm((f) => ({ ...f, mostrarWeb: on, destacado: on ? f.destacado : false }));
                    }} />
                  <span className="track" />
                  <span className="switch-label">Mostrar en la web<small>El producto aparece en la tienda online</small></span>
                </label>

                <label className={`switch ${!form.mostrarWeb ? 'is-disabled' : ''}`}>
                  <input type="checkbox" checked={!!form.destacado} disabled={!form.mostrarWeb}
                    onChange={(e) => set('destacado', e.target.checked)} />
                  <span className="track" />
                  <span className="switch-label">Artículo destacado<small>Aparece en la portada (requiere estar en la web)</small></span>
                </label>

                <label className="switch">
                  <input type="checkbox" checked={!!form.tieneVariantes}
                    onChange={(e) => toggleVariantes(e.target.checked)} />
                  <span className="track" />
                  <span className="switch-label">Tiene variantes<small>Color, tamaño, diseño… c/u con precio y stock</small></span>
                </label>
              </div>

              {form.tieneVariantes && (
                <div className="field full">
                  <div className="var-table">
                    <div className="var-head">
                      <span>Foto</span><span>Tipo</span><span>Variante</span>
                      <span>Costo</span><span>Precio venta</span><span>Stock</span><span />
                    </div>
                    {form.variantes.map((v) => (
                      <div className="var-row" key={v.id}>
                        <VariantImage value={v.imagen} codigo={form.codigo}
                          onChange={(url) => setVar(v.id, 'imagen', url)} />
                        <input className="input" list="variant-types" placeholder="Color…"
                          value={v.tipo} onChange={(e) => setVar(v.id, 'tipo', e.target.value)} />
                        <input className="input" placeholder="Rojo, XL…"
                          value={v.nombre} onChange={(e) => setVar(v.id, 'nombre', e.target.value)} />
                        <input className="input" type="number" min="0" placeholder="0"
                          value={v.precioCosto} onChange={(e) => setVar(v.id, 'precioCosto', e.target.value)} />
                        <input className="input" type="number" min="0" placeholder="0"
                          value={v.precioVenta} onChange={(e) => setVar(v.id, 'precioVenta', e.target.value)} />
                        <input className="input" type="number" min="0" placeholder="0"
                          value={v.stock} onChange={(e) => setVar(v.id, 'stock', e.target.value)} />
                        <button type="button" className="btn btn-ghost btn-sm" title="Quitar"
                          onClick={() => delVar(v.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <datalist id="variant-types">
                    {VARIANT_TYPES.map((t) => <option key={t} value={t} />)}
                  </datalist>
                  <div className="row gap-12" style={{ marginTop: 10, alignItems: 'center' }}>
                    <button type="button" className="btn btn-soft btn-sm" onClick={addVar}>＋ Agregar variante</button>
                    <span className="hint">
                      {form.variantes.length} variante(s) · stock total {stockTotal({ tieneVariantes: true, variantes: form.variantes })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/productos')}>Cancelar</button>
            </div>
          </div>

          {/* Columna lateral: fotos + vista previa */}
          <aside className="editor-aside">
            <div className="card" style={{ padding: 18 }}>
              <label className="aside-title">Fotos del producto</label>
              <ImageUploader
                value={form.imagenes}
                codigo={form.codigo}
                onChange={(imgs) => set('imagenes', imgs)}
              />
            </div>

            <div className="card preview-card">
              <div className="pc-name">{form.nombreWeb || form.nombre || 'Nombre del producto'}</div>
              <div className="pc-price">
                {form.tieneVariantes ? 'desde ' : ''}
                {formatMoney(form.tieneVariantes ? precioDesde({ tieneVariantes: true, variantes: form.variantes }) : (form.precioVenta || 0))}
              </div>
              <div className="pc-row">
                <span className={`badge ${st.badge}`}>{st.label}</span>
                <span className="muted">Stock: {form.tieneVariantes ? stockTotal({ tieneVariantes: true, variantes: form.variantes }) : (form.stock || 0)}</span>
              </div>
              <div className="pc-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <span className={`badge ${form.mostrarWeb ? 'badge-success' : 'badge-muted'}`}>
                  {form.mostrarWeb ? '🌐 En la web' : 'Oculto en web'}
                </span>
                {form.destacado && <span className="badge badge-warning">★ Destacado</span>}
              </div>
            </div>
          </aside>
        </div>
      </form>
    </AdminLayout>
  );
};

export default ProductForm;
