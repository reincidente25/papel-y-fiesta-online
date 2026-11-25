// src/pages/admin/PagosPanel.jsx
// Datos de transferencia (alias/CBU) editables desde el panel.
import { useEffect, useState } from 'react';
import Loader from '../../components/common/Loader';
import { getPagos, savePagos, PAGOS_DEFAULT } from '../../services/pagosService';

const PagosPanel = () => {
  const [form, setForm] = useState(PAGOS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => { getPagos().then(setForm).finally(() => setLoading(false)); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true); setOk(false);
    try { await savePagos(form); setOk(true); setTimeout(() => setOk(false), 2500); }
    finally { setSaving(false); }
  };

  // Recargos de crédito (array de {cuotas, recargo}).
  const credito = Array.isArray(form.creditoOpciones) ? form.creditoOpciones : [];
  const setCredito = (cuotas, val) => setForm((f) => ({
    ...f,
    creditoOpciones: (f.creditoOpciones || []).map((c) => (c.cuotas === cuotas ? { ...c, recargo: Number(val) || 0 } : c)),
  }));

  if (loading) return <Loader />;

  return (
    <form onSubmit={guardar} className="pagos-grid">
      <div className="card" style={{ padding: 24 }}>
        <h2 className="section-title" style={{ fontSize: '1.05rem', marginBottom: 6 }}>Datos para transferencias</h2>
        <p className="hint" style={{ marginBottom: 16 }}>Se usan en el mensaje de WhatsApp al validar un pedido y en el email de “Confirmado — a pagar”.</p>
        <div className="form-grid">
          <div className="field full"><label>Titular</label>
            <input className="input" value={form.titular} onChange={(e) => set('titular', e.target.value)} placeholder="Papel & Fiesta" /></div>
          <div className="field"><label>Banco</label>
            <input className="input" value={form.banco} onChange={(e) => set('banco', e.target.value)} placeholder="Banco…" /></div>
          <div className="field"><label>Alias</label>
            <input className="input" value={form.alias} onChange={(e) => set('alias', e.target.value)} placeholder="papel.fiesta.libreria" /></div>
          <div className="field full"><label>CBU / CVU</label>
            <input className="input" value={form.cbu} onChange={(e) => set('cbu', e.target.value)} placeholder="0000000000000000000000" inputMode="numeric" /></div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 className="section-title" style={{ fontSize: '1.05rem', marginBottom: 6 }}>Recargos por medio de pago</h2>
        <p className="hint" style={{ marginBottom: 16 }}>% que se aplica al total. Se usa en la venta del local, la web y el precio del producto.</p>
        <table className="recargo-table">
          <thead>
            <tr><th>Medio de pago</th><th style={{ width: 120 }}>Recargo %</th></tr>
          </thead>
          <tbody>
            <tr><td>🏦 Transferencia / Efectivo</td><td className="rt-sin">0%</td></tr>
            <tr>
              <td>💳 Débito</td>
              <td><input className="input rt-input" type="number" min="0" step="0.5" value={form.recargoDebito ?? 0}
                onChange={(e) => set('recargoDebito', Number(e.target.value) || 0)} /></td>
            </tr>
            {credito.map((c) => (
              <tr key={c.cuotas}>
                <td>💳 Crédito · {c.cuotas} {c.cuotas === 1 ? 'pago' : 'pagos'}</td>
                <td><input className="input rt-input" type="number" min="0" step="0.5" value={c.recargo}
                  onChange={(e) => setCredito(c.cuotas, e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        {ok && <span className="save-ok" style={{ alignSelf: 'center' }}>✓ Guardado</span>}
      </div>
    </form>
  );
};

export default PagosPanel;
