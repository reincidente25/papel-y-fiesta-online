// src/pages/store/Cart.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/ordersService';
import { formatMoney } from '../../utils/format';
import './store.css';

const Cart = () => {
  const { items, setQty, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({
    nombre: user?.displayName || '',
    email: user?.email || '',
    telefono: '',
    entrega: 'retiro',
    notas: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCheckout = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const id = await createOrder({
        usuarioId: user?.uid || null,
        cliente: form.nombre,
        email: form.email,
        telefono: form.telefono,
        entrega: form.entrega,
        notas: form.notas,
        items,
        total,
      });
      clearCart();
      navigate(`/pedido/${id}`);
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
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>{formatMoney(item.precio * item.cantidad)}</div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => removeItem(item.id)}>Quitar</button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary card">
            <h3 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 16 }}>Resumen</h3>
            <div className="cart-summary-row"><span className="muted">Subtotal</span><span>{formatMoney(total)}</span></div>
            <div className="cart-summary-row"><span className="muted">Envío</span><span>A coordinar</span></div>
            <div className="cart-summary-row cart-summary-total"><span>Total</span><span>{formatMoney(total)}</span></div>

            {!checkout ? (
              <>
                <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setCheckout(true)}>
                  Continuar
                </button>
                <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
                  💡 El pago no se procesa en la web: confirmamos el stock y te pasamos los datos para transferir.
                </p>
              </>
            ) : (
              <form onSubmit={handleCheckout} className="stack gap-12" style={{ marginTop: 16 }}>
                <div className="field"><label>Nombre y apellido *</label>
                  <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
                <div className="field"><label>Teléfono / WhatsApp *</label>
                  <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} required /></div>
                <div className="field"><label>Email</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                <div className="field"><label>Entrega</label>
                  <select className="select" value={form.entrega} onChange={(e) => set('entrega', e.target.value)}>
                    <option value="retiro">Retiro en el local</option>
                    <option value="envio">Envío a domicilio</option>
                  </select></div>
                <div className="field"><label>Notas (opcional)</label>
                  <textarea className="textarea" value={form.notas} onChange={(e) => set('notas', e.target.value)} /></div>
                <button type="submit" className="btn btn-primary btn-block" disabled={placing}>
                  {placing ? 'Enviando...' : 'Confirmar pedido'}
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={() => setCheckout(false)}>Volver</button>
              </form>
            )}
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Cart;
