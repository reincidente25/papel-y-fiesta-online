// src/pages/store/Cart.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import Modal from '../../components/common/Modal';
import AddressAutocomplete from '../../components/store/AddressAutocomplete';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/ordersService';
import { cotizarEnvio } from '../../services/shippingService';
import { formatMoney } from '../../utils/format';
import './store.css';

const resumenDir = (d) => d ? [`${d.calle || ''} ${d.numero || ''}`.trim(), d.piso && `Piso ${d.piso}`, d.localidad, d.provincia].filter(Boolean).join(' · ') : '';
const soloDigitos = (cp) => (String(cp || '').match(/\d{4}/) || [''])[0];
const etiquetaEntrega = (t) => (t === 'S' ? '🏤 Sucursal' : '🏠 Domicilio');
const CARRIER_LOGO = { correoargentino: '/correo-argentino.png', andreani: '/andreani.svg', oca: '/oca.svg', urbano: '/urbano.svg' };
const logoDe = (c) => CARRIER_LOGO[String(c || '').toLowerCase().replace(/[^a-z]/g, '')] || '';
const onLogoError = (e) => {
  const img = e.currentTarget;
  if (img.src.endsWith('.svg')) img.src = img.src.replace(/\.svg$/, '.png');
  else img.style.display = 'none';
};

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

  // Cotización de envío
  const [envioRates, setEnvioRates] = useState(null);
  const [envioSel, setEnvioSel] = useState(null);
  const [envioCargando, setEnvioCargando] = useState(false);
  const [envioEstimado, setEnvioEstimado] = useState(false);
  const [envioError, setEnvioError] = useState('');

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

  const cpDest = soloDigitos(domicilioElegido?.cp);
  const provDest = domicilioElegido?.provincia || '';
  const unidades = items.reduce((n, i) => n + i.cantidad, 0);

  // Cotizar envío cuando hay domicilio con CP.
  useEffect(() => {
    if (!checkout || form.entrega !== 'envio' || !cpDest) {
      setEnvioRates(null); setEnvioSel(null); setEnvioError('');
      return undefined;
    }
    let cancel = false;
    setEnvioCargando(true); setEnvioError(''); setEnvioRates(null); setEnvioSel(null);
    cotizarEnvio({ cpDestino: cpDest, provincia: provDest, cantidad: unidades })
      .then((r) => {
        if (cancel) return;
        const rs = r.rates || [];
        setEnvioRates(rs);
        setEnvioEstimado(Boolean(r.estimado));
        if (rs.length) setEnvioSel(rs[0]);
      })
      .catch(() => { if (!cancel) setEnvioError('No pudimos cotizar el envío. Podés continuar y lo coordinamos.'); })
      .finally(() => { if (!cancel) setEnvioCargando(false); });
    return () => { cancel = true; };
  }, [checkout, form.entrega, cpDest, provDest]); // eslint-disable-line react-hooks/exhaustive-deps

  const costoEnvio = form.entrega === 'envio' ? (envioSel?.price || 0) : 0;
  const totalConEnvio = total + costoEnvio;

  const abrirCheckout = () => setCheckout(true);

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
        envio: form.entrega === 'envio' && envioSel ? {
          correo: envioSel.meta?.carrier || '', servicio: envioSel.meta?.servicio || envioSel.productName || '',
          tipo: envioSel.deliveredType || 'D', precio: envioSel.price || 0, estimado: envioEstimado,
        } : null,
        costoEnvio,
        notas: form.notas,
        items,
        subtotal: total,
        total: totalConEnvio,
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

      {/* Checkout: secciones en tarjetas + resumen sticky */}
      <Modal open={checkout} onClose={() => setCheckout(false)} title="Finalizar pedido" width={1080}>
        {(() => {
          const listo = form.nombre.trim() && form.telefono.trim()
            && (form.entrega === 'retiro'
              || (form.entrega === 'envio' && domicilioElegido?.calle && (envioSel || (envioRates && envioRates.length === 0))));
          return (
            <div className="co-grid">
              {/* Columna izquierda: tarjetas */}
              <div className="co-cards">
                <div className="co-card">
                  <h4>🚚 Entrega</h4>
                  <div className="co-seg">
                    <button type="button" className={form.entrega === 'envio' ? 'on' : ''} onClick={() => set('entrega', 'envio')}>Envío a domicilio</button>
                    <button type="button" className={form.entrega === 'retiro' ? 'on' : ''} onClick={() => set('entrega', 'retiro')}>Retiro en el local</button>
                  </div>
                  {form.entrega === 'retiro' && <p className="hint" style={{ marginTop: 10 }}>Retirás por el local cuando esté listo. Te avisamos.</p>}
                </div>

                {form.entrega === 'envio' && (
                  <div className="co-card">
                    <h4>📍 Domicilio</h4>
                    {domicilios.length > 0 && (
                      <>
                        <select className="select co-dom-select" value={domSel} onChange={(e) => setDomSel(e.target.value)}>
                          {domicilios.map((d) => (
                            <option key={d.id} value={d.id}>{d.etiqueta || 'Domicilio'}{d.predeterminado ? ' ★' : ''}</option>
                          ))}
                          <option value="otra">✏️ Otra dirección…</option>
                        </select>
                        {domSel && domSel !== 'otra' && (
                          <p className="co-dom-full">{resumenDir(domicilios.find((d) => d.id === domSel))}</p>
                        )}
                      </>
                    )}
                    {(domicilios.length === 0 || domSel === 'otra') && (
                      <AddressAutocomplete value={otraDir} onChange={setOtraDir} />
                    )}

                    {/* Opciones de envío cotizadas */}
                    {cpDest && (
                      <div className="co-ship">
                        <div className="co-ship-head">🚚 Opciones de envío</div>
                        {envioCargando && <p className="hint">Calculando envío…</p>}
                        {envioError && <p className="hint" style={{ color: 'var(--danger, #d14)' }}>{envioError}</p>}
                        {!envioCargando && envioRates && envioRates.length > 0 && (
                          <div className="co-ship-list">
                            {envioRates.map((r, i) => {
                              const sel = envioSel === r;
                              return (
                                <button type="button" key={i} className={`co-ship-opt ${sel ? 'on' : ''}`} onClick={() => setEnvioSel(r)}>
                                  <span className="co-ship-radio">{sel ? '●' : '○'}</span>
                                  {logoDe(r.meta?.carrier) && <img className="co-ship-logo" src={logoDe(r.meta?.carrier)} alt="" onError={onLogoError} />}
                                  <span className="co-ship-info">
                                    <span className="co-ship-name">{r.productName || etiquetaEntrega(r.deliveredType)}</span>
                                    <span className="co-ship-sub">{etiquetaEntrega(r.deliveredType)}{r.meta?.dias ? ` · 🕒 ${r.meta.dias}` : ''}</span>
                                  </span>
                                  <span className="co-ship-price">{formatMoney(r.price)}</span>
                                </button>
                              );
                            })}
                            <p className="hint" style={{ marginTop: 6 }}>
                              {envioEstimado ? '📊 Valores estimados; se confirman al despachar.' : 'Cotización en vivo del correo.'}
                            </p>
                          </div>
                        )}
                        {!envioCargando && envioRates && envioRates.length === 0 && (
                          <p className="hint">No hay cotización para este CP. Lo coordinamos por WhatsApp.</p>
                        )}
                      </div>
                    )}
                    {form.entrega === 'envio' && !cpDest && (
                      <p className="hint" style={{ marginTop: 8 }}>Cargá el domicilio (con código postal) para ver el costo de envío.</p>
                    )}
                  </div>
                )}

                <div className="co-card">
                  <h4>👤 Tus datos</h4>
                  <div className="form-grid">
                    <div className="field"><label>Nombre y apellido *</label>
                      <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
                    <div className="field"><label>Teléfono / WhatsApp *</label>
                      <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} required /></div>
                    <div className="field full"><label>Email</label>
                      <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                  </div>
                </div>
              </div>

              {/* Columna derecha: resumen sticky */}
              <aside className="co-sum co-sum-sticky">
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
                <div className="co-sum-row"><span className="muted">Subtotal</span><span>{formatMoney(total)}</span></div>
                <div className="co-sum-row">
                  <span className="muted">Envío</span>
                  <span>
                    {form.entrega === 'retiro' ? 'Retiro en local'
                      : envioCargando ? 'Calculando…'
                        : costoEnvio > 0 ? formatMoney(costoEnvio)
                          : 'A coordinar'}
                  </span>
                </div>
                <div className="co-sum-total"><span>Total</span><span>{formatMoney(form.entrega === 'envio' ? totalConEnvio : total)}</span></div>
                <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={placing || !listo} onClick={handleCheckout}>
                  {placing ? 'Enviando…' : listo ? 'Confirmar pedido' : 'Completá tus datos'}
                </button>
                <p className="hint" style={{ marginTop: 10 }}>💡 El pago no se procesa en la web: confirmamos el stock y te pasamos los datos para transferir.</p>
              </aside>
            </div>
          );
        })()}
      </Modal>
    </StoreLayout>
  );
};

export default Cart;
