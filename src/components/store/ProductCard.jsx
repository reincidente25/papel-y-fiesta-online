// src/components/store/ProductCard.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatMoney } from '../../utils/format';
import './ProductCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/400x400/F4F4F1/908E8A?text=Papel+%26+Fiesta';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const sinStock = product.stock <= 0 || product.estado === 'sin_stock';

  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-media">
        <img src={product.imagen || PLACEHOLDER} alt={product.nombre} loading="lazy" />
        {product.destacado && <span className="product-tag">Destacado</span>}
        {sinStock && <span className="product-tag out">Sin stock</span>}
      </Link>
      <div className="product-body">
        <Link to={`/producto/${product.id}`} className="product-name">{product.nombre}</Link>
        <div className="product-foot">
          <span className="product-price">{formatMoney(product.precioVenta)}</span>
          <button
            className="btn btn-soft btn-sm"
            disabled={sinStock}
            onClick={() => addItem(product)}
          >
            {sinStock ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
