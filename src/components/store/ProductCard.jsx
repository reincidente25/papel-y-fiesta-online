// src/components/store/ProductCard.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatMoney } from '../../utils/format';
import { tieneVariantes as hayVariantes, imagenPrincipal } from '../../utils/variants';
import './ProductCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/400x400/F4F4F1/908E8A?text=Papel+%26+Fiesta';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const sinStock = product.stock <= 0 || product.estado === 'sin_stock';
  const titulo = product.nombreWeb || product.nombre;
  const conVar = hayVariantes(product);
  const img = imagenPrincipal(product);

  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-media">
        <img src={img || PLACEHOLDER} alt={titulo} loading="lazy" />
        {product.destacado && <span className="product-tag">Destacado</span>}
        {sinStock && <span className="product-tag out">Sin stock</span>}
      </Link>
      <div className="product-body">
        <Link to={`/producto/${product.id}`} className="product-name">{titulo}</Link>
        <div className="product-foot">
          <span className="product-price">{formatMoney(product.precioVenta)}</span>
          {conVar ? (
            <Link to={`/producto/${product.id}`} className="btn btn-soft btn-sm" style={{ opacity: sinStock ? 0.5 : 1, pointerEvents: sinStock ? 'none' : 'auto' }}>
              {sinStock ? 'Agotado' : 'Elegir'}
            </Link>
          ) : (
            <button
              className="btn btn-soft btn-sm"
              disabled={sinStock}
              onClick={() => addItem(product)}
            >
              {sinStock ? 'Agotado' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
