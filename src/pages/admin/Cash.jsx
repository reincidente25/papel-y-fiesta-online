// src/pages/admin/Cash.jsx
// Caja por turno: apertura (fondo inicial) y cierre. Los totales se derivan de
// las ventas y compras ocurridas durante el turno abierto.
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getCajaActual, abrirCaja, cerrarCaja } from '../../services/cashService';
import { getSalesBetween } from '../../services/salesService';
import { getPurchasesBetween } from '../../services/purchasesService';
import { PAYMENT_METHODS } from '../../constants';
import { formatMoney, formatDateTime, toDate } from '../../utils/format';

const TABS = [
  { id: 'resumen', label: '📊 Resumen' },
  { id: 'ventas', label: '🔥 Ventas' },
  { id: 'compras', label: '🧾 Compras' },
];

const Cash = () => {
  const [caja, setCaja] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('resumen');
  const [modal, setModal] = useState(null); // 'abrir' | 'cerrar'
  const [monto, setMonto] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const actual = await getCajaActual();
      setCaja(actual);
      if (actual) {
        const desde = toDate(actual.aperturaFecha);
        const [vs, cs] = await Promise.all([getSalesBetween(desde), getPurchasesBetween(desde)]);
        setVentas(vs);
        setCompras(cs);
      } else {
        setVentas([]);
        setCompras([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalVentas = ventas.reduce((n, v) => n + (v.total || 0), 0);
  const totalCompras = compras.reduce((n, c) => n + (c.total || 0), 0);
  const fondoInicial = caja?.fondoInicial || 0;
  const saldo = fondoInicial + totalVentas - totalCompras;
  const transacciones = ventas.length + compras.length;

  // Ventas agrupadas por método de pago.
  const porMetodo = ventas.reduce((acc, v) => {
    const key = v.metodoPago || 'efectivo';
    acc[key] = (acc[key] || 0) + (v.total || 0);
    return acc;
  }, {});
  const metodos = Object.entries(porMetodo).sort((a, b) => b[1] - a[1]);

  const confirm = async () => {
    const m = Number(monto) || 0;
    if (modal === 'abrir') {
      await abrirCaja(m);
    } else if (modal === 'cerrar' && caja) {
      await cerrarCaja(caja.id, {
        montoFinal: m,
        totales: { fondoInicial, totalVentas, totalCompras, saldo, transacciones },
      });
    }
    setModal(null);
    setMonto('');
    await load();
  };

  if (loading) {
    return <AdminLayout title="Caja"><Loader /></AdminLayout>;
  }

  // Sin turno abierto → pantalla de apertura.
  if (!caja) {
    return (
      <AdminLayout title="Caja">
        <div className="caja-open card">
          <div className="big">🔓</div>
          <h2 className="section-title" style={{ marginBottom: 6 }}>Caja cerrada</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Abrí la caja indicando el fondo inicial para empezar el turno.</p>
          <button className="btn btn-primary" onClick={() => { setMonto(''); setModal('abrir'); }}>Abrir caja</button>
        </div>

        <Modal open={modal === 'abrir'} onClose={() => setModal(null)} title="Abrir caja" width={420}>
          <div className="stack gap-16">
            <div className="field">
              <label>Fondo inicial</label>
              <input className="input" type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus placeholder="0" />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={confirm}>Abrir caja</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </Modal>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Caja">
      {/* Barra de estado */}
      <div className="caja-bar">
        <div>
          <div className="caja-estado"><span className="dot" /> CAJA ABIERTA</div>
          <div className="caja-sub">Desde {formatDateTime(caja.aperturaFecha)}</div>
        </div>
        <div className="caja-fondo">
          <div className="k">Fondo inicial</div>
          <div className="v">{formatMoney(fondoInicial)}</div>
        </div>
        <button className="btn btn-danger" onClick={() => { setMonto(String(Math.round(saldo))); setModal('cerrar'); }}>🔒 Cerrar caja</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}{t.id === 'ventas' ? ` (${ventas.length})` : t.id === 'compras' ? ` (${compras.length})` : ''}
          </button>
        ))}
        <button className="tab" onClick={load} style={{ marginLeft: 'auto' }}>↻ Actualizar</button>
      </div>

      {tab === 'resumen' && (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="card kpi">
              <span className="kpi-icon">💰</span>
              <span className="kpi-value" style={{ color: 'var(--success)' }}>{formatMoney(totalVentas)}</span>
              <span className="kpi-label">Total ventas ({ventas.length})</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">🛒</span>
              <span className="kpi-value" style={{ color: 'var(--danger)' }}>{formatMoney(totalCompras)}</span>
              <span className="kpi-label">Total compras ({compras.length})</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">📊</span>
              <span className="kpi-value">{formatMoney(saldo)}</span>
              <span className="kpi-label">Saldo en caja (fondo + ventas − compras)</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">🧾</span>
              <span className="kpi-value">{transacciones}</span>
              <span className="kpi-label">Transacciones</span>
            </div>
          </div>

          <div className="toolbar"><h2 className="section-title">Ventas por método de pago</h2></div>
          <div className="card chart-card">
            {metodos.length === 0 ? (
              <p className="muted">Sin ventas en este turno.</p>
            ) : metodos.map(([key, monto]) => {
              const m = PAYMENT_METHODS[key];
              const pct = totalVentas > 0 ? Math.round((monto / totalVentas) * 100) : 0;
              return (
                <div className="bar-row" key={key}>
                  <div className="bar-label">{m?.icon || '•'} {m?.label || key}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  <div className="bar-value">{pct}% · {formatMoney(monto)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'ventas' && (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Medio</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={4} className="muted">Sin ventas en este turno.</td></tr>
              ) : ventas.map((v) => (
                <tr key={v.id}>
                  <td>{formatDateTime(v.fecha)}</td>
                  <td>{v.cliente || 'Consumidor final'}</td>
                  <td>{PAYMENT_METHODS[v.metodoPago]?.icon || ''} {PAYMENT_METHODS[v.metodoPago]?.label || v.metodoPago}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatMoney(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'compras' && (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Proveedor</th><th>Comprobante</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {compras.length === 0 ? (
                <tr><td colSpan={4} className="muted">Sin compras en este turno.</td></tr>
              ) : compras.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateTime(c.fecha)}</td>
                  <td>{c.proveedor || '—'}</td>
                  <td>{c.factura || c.remito || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'cerrar'} onClose={() => setModal(null)} title="Cerrar caja" width={440}>
        <div className="stack gap-16">
          <div className="summary-rows">
            <div className="bar-row" style={{ gridTemplateColumns: '1fr auto', marginBottom: 6 }}><span className="bar-label">Fondo inicial</span><strong>{formatMoney(fondoInicial)}</strong></div>
            <div className="bar-row" style={{ gridTemplateColumns: '1fr auto', marginBottom: 6 }}><span className="bar-label">+ Ventas ({ventas.length})</span><strong style={{ color: 'var(--success)' }}>{formatMoney(totalVentas)}</strong></div>
            <div className="bar-row" style={{ gridTemplateColumns: '1fr auto', marginBottom: 6 }}><span className="bar-label">− Compras ({compras.length})</span><strong style={{ color: 'var(--danger)' }}>{formatMoney(totalCompras)}</strong></div>
            <div className="bar-row" style={{ gridTemplateColumns: '1fr auto' }}><span className="bar-label">Saldo esperado</span><strong>{formatMoney(saldo)}</strong></div>
          </div>
          <div className="field">
            <label>Monto final contado (arqueo)</label>
            <input className="input" type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
          </div>
          {monto !== '' && Number(monto) !== Math.round(saldo) && (
            <p className="hint">Diferencia: <strong style={{ color: Number(monto) - saldo < 0 ? 'var(--danger)' : 'var(--success)' }}>{formatMoney(Number(monto) - saldo)}</strong></p>
          )}
          <div className="form-actions">
            <button className="btn btn-danger" onClick={confirm}>Confirmar cierre</button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default Cash;
