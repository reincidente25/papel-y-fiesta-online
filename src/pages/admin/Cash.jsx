// src/pages/admin/Cash.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import {
  getCashSession, getCashMovements, getCashBalance,
  addCashMovement, openCashSession, closeCashSession,
} from '../../services/cashService';
import { CASH_TYPES, PAYMENT_METHODS } from '../../constants';
import { formatMoney, formatDate } from '../../utils/format';

const Cash = () => {
  const [session, setSession] = useState(null);
  const [movements, setMovements] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'ingreso' | 'egreso' | 'abrir' | 'cerrar'
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getCashSession(), getCashMovements(), getCashBalance()])
      .then(([s, m, b]) => { setSession(s); setMovements(m); setBalance(b); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const open = (tipo) => { setMonto(''); setConcepto(''); setModal(tipo); };

  const confirm = async () => {
    const m = Number(monto) || 0;
    if (modal === 'abrir') await openCashSession(m);
    else if (modal === 'cerrar') await closeCashSession(m);
    else await addCashMovement({ tipo: modal, concepto: concepto || (modal === 'ingreso' ? 'Ingreso' : 'Egreso'), metodoPago: 'efectivo', monto: m });
    setModal(null);
    load();
  };

  const abierta = session?.estado === 'abierta';

  const modalTitle = {
    ingreso: 'Registrar ingreso', egreso: 'Registrar egreso',
    abrir: 'Abrir caja', cerrar: 'Cerrar caja',
  }[modal];

  return (
    <AdminLayout title="Caja">
      {loading ? <Loader /> : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card kpi">
              <span className="kpi-icon">💰</span>
              <span className="kpi-value">{formatMoney(balance)}</span>
              <span className="kpi-label">Saldo en efectivo</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">{abierta ? '🟢' : '🔴'}</span>
              <span className="kpi-value" style={{ fontSize: '1.3rem' }}>{abierta ? 'Abierta' : 'Cerrada'}</span>
              <span className="kpi-label">{abierta ? `Desde ${formatDate(session.aperturaFecha)}` : 'Estado de caja'}</span>
            </div>
            <div className="card kpi">
              <span className="kpi-icon">🏦</span>
              <span className="kpi-value">{formatMoney(session?.montoInicial || 0)}</span>
              <span className="kpi-label">Monto de apertura</span>
            </div>
          </div>

          <div className="toolbar">
            <h2 className="section-title">Movimientos</h2>
            <div className="row gap-8">
              <button className="btn btn-soft btn-sm" onClick={() => open('ingreso')}>+ Ingreso</button>
              <button className="btn btn-ghost btn-sm" onClick={() => open('egreso')}>− Egreso</button>
              {abierta
                ? <button className="btn btn-danger btn-sm" onClick={() => open('cerrar')}>Cerrar caja</button>
                : <button className="btn btn-primary btn-sm" onClick={() => open('abrir')}>Abrir caja</button>}
            </div>
          </div>

          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Medio</th><th style={{ textAlign: 'right' }}>Monto</th></tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={5} className="muted">Sin movimientos.</td></tr>
                ) : movements.map((m) => {
                  const signo = CASH_TYPES[m.tipo]?.signo || 1;
                  return (
                    <tr key={m.id}>
                      <td>{formatDate(m.fecha)}</td>
                      <td>{m.concepto}</td>
                      <td><span className="badge badge-muted">{CASH_TYPES[m.tipo]?.label || m.tipo}</span></td>
                      <td>{PAYMENT_METHODS[m.metodoPago]?.label || m.metodoPago}</td>
                      <td style={{ textAlign: 'right', color: signo > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        {signo > 0 ? '+' : '−'} {formatMoney(m.monto)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modalTitle} width={420}>
        <div className="stack gap-16">
          {(modal === 'ingreso' || modal === 'egreso') && (
            <div className="field"><label>Concepto</label>
              <input className="input" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: pago proveedor" /></div>
          )}
          <div className="field">
            <label>{modal === 'cerrar' ? 'Monto final contado' : modal === 'abrir' ? 'Monto inicial' : 'Monto'}</label>
            <input className="input" type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
          </div>
          {modal === 'cerrar' && (
            <p className="hint">Saldo esperado en sistema: <strong>{formatMoney(balance)}</strong></p>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" onClick={confirm}>Confirmar</button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default Cash;
