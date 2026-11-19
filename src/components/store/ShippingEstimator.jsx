// src/components/store/ShippingEstimator.jsx
// Estimador de costo de envío por código postal (Correo Argentino / fallback).
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cotizarEnvio } from '../../services/shippingService';
import { formatMoney } from '../../utils/format';

const soloDigitos = (cp) => (String(cp || '').match(/\d{4}/) || [''])[0];

const etiquetaEntrega = (t) => (t === 'S' ? '🏤 Retiro en sucursal' : '🏠 A domicilio');
const capitalizar = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

const PROVEEDOR_LABEL = {
  envia: 'Cotización en vivo de los correos (vía Envia).',
  enviopack: 'Cotización en vivo de los correos (vía Envíopack).',
  correo_argentino: 'Cotización de Correo Argentino.',
};

// Logo por correo (dejá los archivos en /public). Si no existe, el <img> se oculta solo.
const CARRIER_LOGO = {
  correoargentino: '/correo-argentino.svg',
  andreani: '/andreani.svg',
  oca: '/oca.svg',
  urbano: '/urbano.svg',
};
const logoDe = (c) => CARRIER_LOGO[String(c || '').toLowerCase().replace(/[^a-z]/g, '')] || '';

const PROVINCIAS = [
  'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

const ShippingEstimator = ({ cantidad = 1 }) => {
  const { profile } = useAuth();
  const [cp, setCp] = useState('');
  const [provincia, setProvincia] = useState('');
  const [rates, setRates] = useState(null);
  const [estimado, setEstimado] = useState(false);
  const [proveedor, setProveedor] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [autoHecho, setAutoHecho] = useState(false);

  const cotizar = async (dest, prov) => {
    setError(''); setCargando(true); setRates(null);
    try {
      const r = await cotizarEnvio({ cpDestino: dest, provincia: prov, cantidad });
      setRates(r.rates || []);
      setEstimado(Boolean(r.estimado));
      setProveedor(r.proveedor || '');
    } catch {
      setError('No pudimos calcular el envío. Probá de nuevo en un momento.');
    } finally {
      setCargando(false);
    }
  };

  // Prefill con el domicilio predeterminado y cotización automática.
  useEffect(() => {
    const doms = profile?.domicilios || [];
    const pred = doms.find((d) => d.predeterminado) || doms[0];
    const predCp = pred?.cp ? (soloDigitos(pred.cp) || pred.cp) : '';
    const predProv = pred?.provincia || '';
    if (predCp && !cp) setCp(predCp);
    if (predProv && !provincia) setProvincia(predProv);
    // Cotiza sola una vez si hay CP + provincia del domicilio por defecto.
    if (predCp && predProv && !autoHecho) {
      setAutoHecho(true);
      cotizar(soloDigitos(predCp) || predCp, predProv);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const calcular = (e) => {
    e?.preventDefault();
    const dest = soloDigitos(cp);
    if (!dest) { setError('Ingresá un código postal válido (4 dígitos).'); return; }
    cotizar(dest, provincia);
  };

  return (
    <div className="ship-est">
      <div className="ship-title">🚚 Calcular envío</div>
      <form className="ship-row" onSubmit={calcular}>
        <input className="input" value={cp} onChange={(e) => setCp(e.target.value)}
          placeholder="Código postal" inputMode="numeric" maxLength={8} style={{ maxWidth: 130 }} />
        <select className="select" value={provincia} onChange={(e) => setProvincia(e.target.value)} style={{ flex: 1 }}>
          <option value="">Provincia…</option>
          {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="btn btn-soft btn-sm" type="submit" disabled={cargando}>
          {cargando ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {error && <p className="hint" style={{ color: 'var(--danger, #d14)' }}>{error}</p>}

      {rates && rates.length > 0 && (
        <div className="ship-results">
          {rates.map((r, i) => {
            const correo = capitalizar(r.meta?.carrier) || r.productName || etiquetaEntrega(r.deliveredType);
            const servicio = r.meta?.servicio || '';
            const dias = r.meta?.dias
              || (r.deliveryTimeMin ? `${r.deliveryTimeMin}${r.deliveryTimeMax && r.deliveryTimeMax !== r.deliveryTimeMin ? `-${r.deliveryTimeMax}` : ''} días háb.` : '');
            const logo = logoDe(r.meta?.carrier);
            return (
              <div className="ship-opt" key={i}>
                {logo && <img className="ship-logo" src={logo} alt={correo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ship-opt-name">{correo}{servicio ? ` · ${servicio}` : ''}</div>
                  <div className="ship-opt-sub">
                    {etiquetaEntrega(r.deliveredType)}{dias ? ` · 🕒 ${dias}` : ''}
                  </div>
                </div>
                <div className="ship-opt-price">{formatMoney(r.price)}</div>
              </div>
            );
          })}
          <p className="hint">
            {estimado
              ? '📊 Valor estimado (sin conexión al correo). El costo final se confirma al despachar.'
              : `${PROVEEDOR_LABEL[proveedor] || 'Cotización en vivo.'} Se confirma al despachar.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ShippingEstimator;
