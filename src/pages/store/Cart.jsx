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
  const [step, setStep] = useState(1); // 1 Entrega · 2 Datos · 3 Confirmar
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

  const abrirCheckout = () => { setStep(1); setCheckout(true); };

  const handleCheckout = async (e) => {
    e?.preventDefault();
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

            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={abrirCheckout}>
              Continuar
            </button>
            <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
              💡 El pago no se procesa en la web: confirmamos el stock y te pasamos los datos para transferir.
            </p>
          </aside>
        </div>
      </div>

      {/* Checkout en pasos (stepper) */}
      <Modal open={checkout} onClose={() => setCheckout(false)} title="Finalizar pedido" width={840}>
        {(() => {
          const paso1Ok = form.entrega === 'retiro' || (form.entrega === 'envio' && domicilioElegido?.calle);
          const paso2Ok = form.nombre.trim() && form.telefono.trim();
          const PASOS = ['Entrega', 'Datos', 'Confirmar'];
          return (
            <>
              <div className="co-steps">
                {PASOS.map((l, i) => {
                  const n = i + 1;
                  return (
                    <div className={`co-step ${step === n ? 'on' : ''} ${step > n ? 'done' : ''}`} key={l}>
                      <span className="co-n">{step > n ? '✓' : n}</span> {l}
                    </div>
                  );
                })}
              </div>

              <div className="co-body">
                <div className="co-main">
                  {/* Paso 1: Entrega */}
                  {step === 1 && (
                    <>
                      <span className="mini-label">¿Cómo lo recibís?</span>
                      <div className="co-pills">
                        <button type="button" className={`co-pill ${form.entrega === 'envio' ? 'sel' : ''}`} onClick={() => set('entrega', 'envio')}>🏠 Envío a domicilio</button>
                        <button type="button" className={`co-pill ${form.entrega === 'retiro' ? 'sel' : ''}`} onClick={() => set('entrega', 'retiro')}>🏪 Retiro en el local</button>
                      </div>

                      {form.entrega === 'envio' ? (
                        <div className="field" style={{ marginTop: 16 }}>
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
                      ) : (
                        <p className="hint" style={{ marginTop: 16 }}>Retirás tu pedido por el local cuando esté listo. Te avisamos.</p>
                      )}

                      <div className="co-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setCheckout(false)}>Cancelar</button>
                        <button type="button" className="btn btn-primary" disabled={!paso1Ok} onClick={() => setStep(2)}>
                          {paso1Ok ? 'Continuar →' : 'Completá el domicilio'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Paso 2: Datos */}
                  {step === 2 && (
                    <>
                      <span className="mini-label">Tus datos de contacto</span>
                      <div className="form-grid" style={{ marginTop: 10 }}>
                        <div className="field"><label>Nombre y apellido *</label>
                          <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
                        <div className="field"><label>Teléfono / WhatsApp *</label>
                          <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} required /></div>
                        <div className="field full"><label>Email</label>
                          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                        <div className="field full"><label>Notas (opcional)</label>
                          <textarea className="textarea" value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Horario de entrega, referencia…" /></div>
                      </div>
                      <div className="co-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Volver</button>
                        <button type="button" className="btn btn-primary" disabled={!paso2Ok} onClick={() => setStep(3)}>Continuar →</button>
                      </div>
                    </>
                  )}

                  {/* Paso 3: Confirmar */}
                  {step === 3 && (
                    <>
                      <span className="mini-label">Revisá y confirmá</span>
                      <div className="co-review">
                        <div className="co-rev-row"><span className="muted">Nombre</span><span>{form.nombre || '—'}</span></div>
                        <div className="co-rev-row"><span className="muted">WhatsApp</span><span>{form.telefono || '—'}</span></div>
                        {form.email && <div className="co-rev-row"><span className="muted">Email</span><span>{form.email}</span></div>}
                        <div className="co-rev-row"><span className="muted">Entrega</span><span>{form.entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en el local'}</span></div>
                        {form.entrega === 'envio' && <div className="co-rev-row"><span className="muted">Domicilio</span><span>{resumenDir(domicilioElegido) || '—'}</span></div>}
                        {form.notas && <div className="co-rev-row"><span className="muted">Notas</span><span>{form.notas}</span></div>}
                      </div>
                      <p className="hint" style={{ marginTop: 12 }}>💡 El pago no se procesa en la web: confirmamos el stock y te pasamos los datos para transferir.</p>
                      <div className="co-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Volver</button>
                        <button type="button" className="btn btn-primary" disabled={placing} onClick={handleCheckout}>
                          {placing ? 'Enviando…' : 'Confirmar pedido'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Resumen siempre visible */}
                <aside className="co-sum">
                  <div className="co-sum-title">Tu pedido · {items.reduce((n, i) => n + i.cantidad, 0)} u.</div>
                  <div className="co-sum-items">
                    {items.map((item) => (
                      <div className="co-sum-item" key={item.id}>
                        {item.imagen ? <img src={item.imagen} alt="" /> : <span className="co-sum-ph">📦</span>}
                        <div><div className="co-sum-name">{item.nombre}</div><div className="muted" style={{ fontSize: '.76rem' }}>{item.cantidad} × {formatMoney(item.precio)}</div></div>
                        <div className="co-sum-price">{formatMoney(item.precio * item.cantidad)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="co-sum-total"><span>Total</span><span>{formatMoney(total)}</span></div>
                </aside>
              </div>
            </>
          );
        })()}
      </Modal>
    </StoreLayout>
  );
};

export default Cart;
