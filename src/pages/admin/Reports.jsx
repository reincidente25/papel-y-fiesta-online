// src/pages/admin/Reports.jsx
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getSales } from '../../services/salesService';
import { getPurchases } from '../../services/purchasesService';
import { PAYMENT_METHODS, SALE_CHANNELS } from '../../constants';
import { formatMoney } from '../../utils/format';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const BarList = ({ data, alt }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      {data.length === 0 ? <p className="muted">Sin datos.</p> : data.map((d) => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label">{d.label}</span>
          <div className="bar-track"><div className={`bar-fill ${alt ? 'alt' : ''}`} style={{ width: `${(d.value / max) * 100}%` }} /></div>
          <span className="bar-value">{d.format ? d.format(d.value) : d.value}</span>
        </div>
      ))}
    </div>
  );
};

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSales(), getPurchases()])
      .then(([s, c]) => { setSales(s); setPurchases(c); })
      .finally(() => setLoading(false));
  }, []);

  // Ventas últimos 7 días
  const last7 = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const total = sales.filter((s) => new Date(s.fecha).toDateString() === key).reduce((n, s) => n + s.total, 0);
      out.push({ label: DAYS[d.getDay()], value: total });
    }
    return out;
  }, [sales]);

  // Top productos por cantidad
  const topProducts = useMemo(() => {
    const map = {};
    sales.forEach((s) => s.items.forEach((i) => { map[i.nombre] = (map[i.nombre] || 0) + i.cantidad; }));
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [sales]);

  // Ventas por canal / medio de pago
  const byChannel = useMemo(() => {
    const map = {};
    sales.forEach((s) => { const k = SALE_CHANNELS[s.canal]?.label || s.canal; map[k] = (map[k] || 0) + s.total; });
    return Object.entries(map).map(([label, value]) => ({ label, value, format: formatMoney }));
  }, [sales]);

  const byPayment = useMemo(() => {
    const map = {};
    sales.forEach((s) => { const k = PAYMENT_METHODS[s.metodoPago]?.label || s.metodoPago; map[k] = (map[k] || 0) + s.total; });
    return Object.entries(map).map(([label, value]) => ({ label, value, format: formatMoney }));
  }, [sales]);

  const totalVentas = sales.reduce((n, s) => n + s.total, 0);
  const totalCompras = purchases.reduce((n, c) => n + c.total, 0);
  const maxDia = Math.max(1, ...last7.map((d) => d.value));

  return (
    <AdminLayout title="Reportes">
      {loading ? <Loader /> : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card kpi"><span className="kpi-icon">💵</span><span className="kpi-value">{formatMoney(totalVentas)}</span><span className="kpi-label">Ventas totales</span></div>
            <div className="card kpi"><span className="kpi-icon">🛒</span><span className="kpi-value">{formatMoney(totalCompras)}</span><span className="kpi-label">Compras totales</span></div>
            <div className="card kpi"><span className="kpi-icon">📈</span><span className="kpi-value">{formatMoney(totalVentas - totalCompras)}</span><span className="kpi-label">Diferencia</span></div>
          </div>

          <div className="card chart-card" style={{ marginBottom: 18 }}>
            <h3>Ventas últimos 7 días</h3>
            <div className="cols">
              {last7.map((d, idx) => (
                <div className="col" key={idx}>
                  <span className="col-value">{d.value ? formatMoney(d.value) : ''}</span>
                  <div className="col-bar" style={{ height: `${(d.value / maxDia) * 100}%` }} />
                  <span className="col-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-grid">
            <div className="card chart-card"><h3>Productos más vendidos</h3><BarList data={topProducts} /></div>
            <div className="card chart-card"><h3>Ventas por canal</h3><BarList data={byChannel} alt /></div>
            <div className="card chart-card"><h3>Ventas por medio de pago</h3><BarList data={byPayment} /></div>
            <div className="card chart-card">
              <h3>Resumen</h3>
              <p className="text-soft" style={{ lineHeight: 1.9 }}>
                Ticket promedio: <strong>{formatMoney(sales.length ? totalVentas / sales.length : 0)}</strong><br />
                Ventas registradas: <strong>{sales.length}</strong><br />
                Compras registradas: <strong>{purchases.length}</strong>
              </p>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Reports;
