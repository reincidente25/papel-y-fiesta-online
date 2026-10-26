// src/pages/store/ProductDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import Loader from '../../components/common/Loader';
import { useCart } from '../../context/CartContext';
import { getProductById } from '../../services/productsService';
import { formatMoney } from '../../utils/format';
import './store.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    setLoading(true);
    setActiva(0);
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

  const sinStock = product.stock <= 0 || product.estado === 'sin_stock';
  const categoria = product.categoriaNombre ? { name: product.categoriaNombre } : null;

  const handleAdd = () => {
    addItem(product, qty);
    navigate('/carrito');
  };

  const fotos = product.imagenes?.length ? product.imagenes : (product.imagen ? [product.imagen] : []);
  const principal = fotos[activa] || fotos[0];

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
          <div className="detail-price">{formatMoney(product.precioVenta)}</div>
          {product.descripcion
            ? <div className="detail-desc rte-content" dangerouslySetInnerHTML={{ __html: product.descripcion }} />
            : <p className="detail-desc">Sin descripción.</p>}

          {sinStock ? (
            <span className="badge badge-danger">Sin stock</span>
          ) : (
            <>
              <div className="detail-buy">
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}>Agregar al carrito</button>
              </div>
              <p className="muted" style={{ fontSize: '.85rem' }}>{product.stock} unidades disponibles</p>
            </>
          )}

          <Link to="/catalogo" className="btn btn-ghost btn-sm" style={{ marginTop: 24 }}>← Seguir comprando</Link>
        </div>
      </div>
    </StoreLayout>
  );
};

export default ProductDetail;
