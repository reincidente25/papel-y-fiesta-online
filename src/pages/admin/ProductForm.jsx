// src/pages/admin/ProductForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getProductById, createProduct, updateProduct } from '../../services/productsService';
import { DEFAULT_CATEGORIES, PRODUCT_STATUS, PRODUCT_STATUS_LIST } from '../../constants';
import { calcMargin, formatMoney } from '../../utils/format';

const EMPTY = {
  nombre: '', descripcion: '', categoria: 'libreria',
  precioCosto: '', precioVenta: '', stock: '', estado: 'activo',
  destacado: false, imagen: '',
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getProductById(id).then((p) => {
      if (p) setForm({ ...EMPTY, ...p });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      precioCosto: Number(form.precioCosto) || 0,
      precioVenta: Number(form.precioVenta) || 0,
      stock: Number(form.stock) || 0,
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
              <div className="field full">
                <label>Nombre *</label>
                <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
              </div>

              <div className="field full">
                <label>Descripción</label>
                <textarea className="textarea" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
              </div>

              <div className="field">
                <label>Categoría</label>
                <select className="select" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                  {DEFAULT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Estado</label>
                <select className="select" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
                  {PRODUCT_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

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

              {form.precioVenta > 0 && (
                <div className="field full">
                  <span className="margin-pill">Margen {margen}% · Ganancia {formatMoney(ganancia)} / unidad</span>
                </div>
              )}

              <div className="field">
                <label>Stock</label>
                <input className="input" type="number" min="0" value={form.stock}
                  onChange={(e) => set('stock', e.target.value)} placeholder="0" />
              </div>
              <div className="field">
                <label>URL de imagen</label>
                <input className="input" value={form.imagen} onChange={(e) => set('imagen', e.target.value)} placeholder="https://..." />
                <span className="hint">Más adelante: subida de archivos con Firebase Storage.</span>
              </div>

              <div className="field full">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.destacado} onChange={(e) => set('destacado', e.target.checked)} />
                  Mostrar como destacado en la home
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/productos')}>Cancelar</button>
            </div>
          </div>

          {/* Columna lateral: imagen + vista previa */}
          <aside className="editor-aside">
            <div className="img-preview">
              {form.imagen
                ? <img src={form.imagen} alt="Vista previa" onError={(e) => { e.target.style.display = 'none'; }} />
                : <span className="ph">📷<br />Pegá una URL de imagen<br />para ver la vista previa</span>}
            </div>

            <div className="card preview-card">
              <div className="pc-name">{form.nombre || 'Nombre del producto'}</div>
              <div className="pc-price">{formatMoney(form.precioVenta || 0)}</div>
              <div className="pc-row">
                <span className={`badge ${st.badge}`}>{st.label}</span>
                <span className="muted">Stock: {form.stock || 0}</span>
              </div>
              {form.destacado && <div className="pc-row"><span className="badge badge-warning">★ Destacado</span></div>}
            </div>
          </aside>
        </div>
      </form>
    </AdminLayout>
  );
};

export default ProductForm;
