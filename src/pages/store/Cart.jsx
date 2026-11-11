// src/pages/store/Cart.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import Modal from '../../components/common/Modal';
import AddressAutocomplete from '../../components/store/AddressAutocomplete';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/ordersService';
import { formatMoney } from '../../utils/format';
import './store.css';

const resumenDir = (d) => d ? [`${d.calle || ''} ${d.numero || ''}`.trim(), d.piso && `Piso ${d.piso}`, d.localidad, d.provincia].filter(Boolean).join(' · ') : '';

const Cart = () => {
  const { items, setQty, removeItem, total, clearCart } = useCart();
  const { user, profile } = useAuth();
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

  const domicilios = profile?.domicilios || [];
  // Domicilio elegido: id guardado, 'otra' (escribir), o '' (sin elegir).
  const [domSel, setDomSel] = useState('');
  const [otraDir, setOtraDir] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Prefill con los datos del perfil cuando se abre el checkout.
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      nombre: f.nombre || [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user?.displayName || '',
      telefono: f.telefono || profile.whatsapp || profile.telefono || '',
      email: f.email || profile.email || user?.email || '',
    }));
    const pred = domicilios.find((d) => d.predeterminado) || domicilios[0];
    if (pred && !domSel) setDomSel(pred.id);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Domicilio final según la selección.
  const domicilioElegido = form.entrega !== 'envio'
    ? null
    : (domSel && domSel !== 'otra' ? domicilios.find((d) => d.id === domSel) : otraDir);

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
        domicilio: form.entrega === 'envio' ? (domicilioElegido || null) : null,
        direccionTexto: form.entrega === 'envio' ? resumenDir(domicilioElegido) : '',
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

            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setCheckout(true)}>
              Continuar
            </button>
            <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
              💡 El pago no se procesa en la web: confirmamos el stock y te pasamos los datos para transferir.
            </p>
          </aside>
        </div>
      </div>

      {/* Checkout en modal grande, en dos columnas */}
      <Modal open={checkout} onClose={() => setCheckout(false)} title="Finalizar pedido" width={980}>
        <form onSubmit={handleCheckout} className="checkout-grid">
          {/* Columna izquierda: repaso del pedido */}
          <div className="checkout-review">
            <h4 className="checkout-h">Tu pedido ({items.reduce((n, i) => n + i.cantidad, 0)})</h4>
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  {item.imagen ? <img src={item.imagen} alt="" /> : <span className="checkout-ph">📦</span>}
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.nombre}</div>
                    <div className="muted" style={{ fontSize: '.82rem' }}>{item.cantidad} × {formatMoney(item.precio)}</div>
                  </div>
                  <div className="checkout-item-total">{formatMoney(item.precio * item.cantidad)}</div>
                </div>
              ))}
            </div>
            <div className="checkout-totals">
              <div className="cart-summary-row"><span className="muted">Subtotal</span><span>{formatMoney(total)}</span></div>
              <div className="cart-summary-row"><span className="muted">Envío</span><span>A coordinar</span></div>
              <div className="cart-summary-row cart-summary-total"><span>Total</span><span>{formatMoney(total)}</span></div>
            </div>
          </div>

          {/* Columna derecha: datos */}
          <div className="checkout-form">
            <h4 className="checkout-h">Tus datos</h4>
            <div className="form-grid">
              <div className="field"><label>Nombre y apellido *</label>
                <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
              <div className="field"><label>Teléfono / WhatsApp *</label>
                <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} required /></div>
              <div className="field full"><label>Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="field full"><label>Entrega</label>
                <select className="select" value={form.entrega} onChange={(e) => set('entrega', e.target.value)}>
                  <option value="retiro">Retiro en el local</option>
                  <option value="envio">Envío a domicilio</option>
                </select></div>
            </div>

            {form.entrega === 'envio' && (
              <div className="field" style={{ marginTop: 12 }}>
                <label>Domicilio de entrega</label>
                {domicilios.length > 0 && (
                  <select className="select" value={domSel} onChange={(e) => setDomSel(e.target.value)} style={{ marginBottom: 10 }}>
                    {domicilios.map((d) => (
                      <option key={d.id} value={d.id}>{(d.etiqueta ? d.etiqueta + ' — ' : '') + resumenDir(d)}{d.predeterminado ? ' ★' : ''}</option>
                    ))}
                    <option value="otra">✏️ Otra dirección…</option>
                  </select>
                )}
                {domicilios.length > 0 && domSel && domSel !== 'otra' ? (
                  <p className="hint">📍 {resumenDir(domicilios.find((d) => d.id === domSel))}</p>
                ) : (
                  <AddressAutocomplete value={otraDir} onChange={setOtraDir} />
                )}
              </div>
            )}

            <div className="field" style={{ marginTop: 12 }}><label>Notas (opcional)</label>
              <textarea className="textarea" value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Horario de entrega, referencia…" /></div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={placing || (form.entrega === 'envio' && !domicilioElegido?.calle)}>
                {placing ? 'Enviando...' : form.entrega === 'envio' && !domicilioElegido?.calle ? 'Completá el domicilio' : 'Confirmar pedido'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setCheckout(false)}>Volver</button>
            </div>
          </div>
        </form>
      </Modal>
    </StoreLayout>
  );
};

export default Cart;
