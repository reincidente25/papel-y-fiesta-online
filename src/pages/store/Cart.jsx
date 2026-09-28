// src/pages/store/Cart.jsx
import { Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/ordersService';
import { formatMoney } from '../../utils/format';
import { useState } from 'react';
import './store.css';

const Cart = () => {
  const { items, setQty, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPlacing(true);
    try {
      await createOrder({
        usuarioId: user.uid,
        email: user.email,
        items,
        total,
      });
      clearCart();
      alert('¡Pedido creado! Te contactaremos para coordinar el pago y envío.');
      navigate('/');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="empty">
          <div className="empty-icon">🛒</div>
          <h3>Tu carrito está vacío</h3>
          <p className="muted">Agregá productos desde el catálogo.</p>
          <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16 }}>Ir al catálogo</Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container">
        <h1 className="page-title" style={{ marginTop: 32 }}>Tu carrito</h1>
        <div className="cart-layout">
          <div>
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.imagen} alt={item.nombre} />
                <div>
                  <div className="cart-item-name">{item.nombre}</div>
                  <div className="muted" style={{ fontSize: '.88rem' }}>{formatMoney(item.precio)} c/u</div>
                  <div className="qty" style={{ marginTop: 8 }}>
                    <button onClick={() => setQty(item.id, item.cantidad - 1)}>−</button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => setQty(item.id, item.cantidad + 1)}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                    {formatMoney(item.precio * item.cantidad)}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => removeItem(item.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary card">
            <h3 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 16 }}>Resumen</h3>
            <div className="cart-summary-row">
              <span className="muted">Subtotal</span>
              <span>{formatMoney(total)}</span>
            </div>
            <div className="cart-summary-row">
              <span className="muted">Envío</span>
              <span>A coordinar</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleCheckout} disabled={placing}>
              {placing ? 'Procesando...' : user ? 'Finalizar pedido' : 'Iniciá sesión para comprar'}
            </button>
            <Link to="/catalogo" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>Seguir comprando</Link>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Cart;
