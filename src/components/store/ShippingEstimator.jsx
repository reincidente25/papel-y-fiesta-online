// src/components/store/ShippingEstimator.jsx
// Estimador de costo de envío por código postal (Correo Argentino / fallback).
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cotizarEnvio } from '../../services/shippingService';
import { formatMoney } from '../../utils/format';

const soloDigitos = (cp) => (String(cp || '').match(/\d{4}/) || [''])[0];

const etiquetaEntrega = (t) => (t === 'S' ? '🏤 Retiro en sucursal' : '🏠 A domicilio');

const ShippingEstimator = ({ cantidad = 1 }) => {
  const { profile } = useAuth();
  const [cp, setCp] = useState('');
  const [rates, setRates] = useState(null);
  const [estimado, setEstimado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Prefill con el CP del domicilio predeterminado del perfil.
  useEffect(() => {
    const doms = profile?.domicilios || [];
    const pred = doms.find((d) => d.predeterminado) || doms[0];
    if (pred?.cp && !cp) setCp(soloDigitos(pred.cp) || pred.cp);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const calcular = async (e) => {
    e?.preventDefault();
    const dest = soloDigitos(cp);
    if (!dest) { setError('Ingresá un código postal válido (4 dígitos).'); return; }
    setError(''); setCargando(true); setRates(null);
    try {
      const r = await cotizarEnvio({ cpDestino: dest, cantidad });
      setRates(r.rates || []);
      setEstimado(Boolean(r.estimado));
    } catch {
      setError('No pudimos calcular el envío. Probá de nuevo en un momento.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="ship-est">
      <div className="ship-title">🚚 Calcular envío</div>
      <form className="ship-row" onSubmit={calcular}>
        <input className="input" value={cp} onChange={(e) => setCp(e.target.value)}
          placeholder="Código postal" inputMode="numeric" maxLength={8} />
        <button className="btn btn-soft btn-sm" type="submit" disabled={cargando}>
          {cargando ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {error && <p className="hint" style={{ color: 'var(--danger, #d14)' }}>{error}</p>}

      {rates && rates.length > 0 && (
        <div className="ship-results">
          {rates.map((r, i) => (
            <div className="ship-opt" key={i}>
              <div>
                <div className="ship-opt-name">{r.productName || etiquetaEntrega(r.deliveredType)}</div>
                <div className="ship-opt-sub">
                  {etiquetaEntrega(r.deliveredType)}
                  {r.deliveryTimeMin ? ` · ${r.deliveryTimeMin}${r.deliveryTimeMax && r.deliveryTimeMax !== r.deliveryTimeMin ? `-${r.deliveryTimeMax}` : ''} días háb.` : ''}
                </div>
              </div>
              <div className="ship-opt-price">{formatMoney(r.price)}</div>
            </div>
          ))}
          <p className="hint">
            {estimado
              ? 'Valor estimado. El costo final se confirma al despachar.'
              : 'Cotización de Correo Argentino. Se confirma al despachar.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ShippingEstimator;
