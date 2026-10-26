// src/pages/store/ProductDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import Loader from '../../components/common/Loader';
import { useCart } from '../../context/CartContext';
import { getProductById } from '../../services/productsService';
import { formatMoney } from '../../utils/format';
import { tieneVariantes as hayVariantes, precioDesde, fotosProducto } from '../../utils/variants';
import './store.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activa, setActiva] = useState(0);
  const [varSel, setVarSel] = useState(null);

  useEffect(() => {
    setLoading(true);
    setActiva(0);
    setVarSel(null);
    getProductById(id)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <StoreLayout><Loader /></StoreLayout>;

  if (!product) {
    return (
      <StoreLayout>
        <div className="empty">
          <div className="empty-icon">😕</div>
          <h3>Producto no encontrado</h3>
          <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16 }}>Volver al catálogo</Link>
        </div>
      </StoreLayout>
    );
  }

  const conVar = hayVariantes(product);
  const variantes = conVar ? product.variantes : [];
  const anyStock = conVar ? variantes.some((v) => (Number(v.stock) || 0) > 0) : product.stock > 0;
  const sinStock = !anyStock || product.estado === 'sin_stock';
  const stockSel = conVar ? (varSel ? (Number(varSel.stock) || 0) : 0) : product.stock;
  const precioMostrar = conVar ? (varSel ? Number(varSel.precioVenta) || 0 : precioDesde(product)) : product.precioVenta;
  const categoria = product.categoriaNombre ? { name: product.categoriaNombre } : null;

  // Variantes agrupadas por tipo para el selector.
  const grupos = conVar
    ? variantes.reduce((acc, v) => { (acc[v.tipo || 'Opción'] ||= []).push(v); return acc; }, {})
    : {};

  const handleAdd = () => {
    if (conVar && !varSel) return;
    addItem(product, qty, varSel);
    navigate('/carrito');
  };

  const fotos = fotosProducto(product);
  const principal = varSel?.imagen || fotos[activa] || fotos[0];

  return (
    <StoreLayout>
      <div className="container detail">
        <div className="detail-media">
          {principal
            ? <img src={principal} alt={product.nombre} />
            : <div className="detail-noimg">📦</div>}
          {fotos.length > 1 && (
            <div className="detail-thumbs">
              {fotos.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  className={`detail-thumb ${i === activa ? 'active' : ''}`}
                  onClick={() => setActiva(i)}
                >
                  <img src={url} alt={`Foto ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          {categoria && <span className="badge badge-muted">{categoria.name}</span>}
          <h1>{product.nombreWeb || product.nombre}</h1>
          <div className="detail-price">
            {conVar && !varSel && <span className="desde">desde </span>}{formatMoney(precioMostrar)}
          </div>
          {product.descripcion
            ? <div className="detail-desc rte-content" dangerouslySetInnerHTML={{ __html: product.descripcion }} />
            : <p className="detail-desc">Sin descripción.</p>}

          {conVar && (
            <div className="detail-variants">
              {Object.entries(grupos).map(([tipo, vs]) => (
                <div className="var-group" key={tipo}>
                  <span className="var-group-label">{tipo}</span>
                  <div className="var-chips">
                    {vs.map((v) => {
                      const agotada = (Number(v.stock) || 0) <= 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          className={`var-chip ${varSel?.id === v.id ? 'active' : ''} ${agotada ? 'agotada' : ''}`}
                          disabled={agotada}
                          onClick={() => { setVarSel(v); setQty(1); }}
                        >
                          {v.nombre}{agotada ? ' (sin stock)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sinStock ? (
            <span className="badge badge-danger">Sin stock</span>
          ) : (
            <>
              <div className="detail-buy">
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(stockSel || 1, q + 1))}>+</button>
                </div>
                <button className="btn btn-primary" onClick={handleAdd} disabled={conVar && (!varSel || stockSel <= 0)}>
                  {conVar && !varSel ? 'Elegí una variante' : 'Agregar al carrito'}
                </button>
              </div>
              <p className="muted" style={{ fontSize: '.85rem' }}>
                {conVar
                  ? (varSel ? `${stockSel} unidades disponibles` : 'Seleccioná una variante para ver el stock')
                  : `${product.stock} unidades disponibles`}
              </p>
            </>
          )}

          <Link to="/catalogo" className="btn btn-ghost btn-sm" style={{ marginTop: 24 }}>← Seguir comprando</Link>
        </div>
      </div>
    </StoreLayout>
  );
};

export default ProductDetail;
