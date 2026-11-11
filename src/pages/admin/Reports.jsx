// src/pages/admin/Reports.jsx
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import { getSales } from '../../services/salesService';
import { PAYMENT_METHODS } from '../../constants';
import { formatMoney, toDate } from '../../utils/format';

const RANGOS = [
  { id: 'todo', label: 'Todo' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Última semana' },
  { id: 'mes', label: 'Último mes' },
  { id: 'mesAnterior', label: 'Mes anterior' },
  { id: 'custom', label: 'Personalizado' },
];

const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const finDia = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const fechaCorta = (d) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const horaCorta = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// Descarga un CSV (se abre en Excel; separador ; y BOM para es-AR).
function exportarCsv(nombre, filas) {
  const csv = filas.map((f) => f.map((c) => {
    const s = String(c ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('productos'); // 'productos' | 'periodo'
  const [rango, setRango] = useState('todo');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [expandidos, setExpandidos] = useState(() => new Set());

  useEffect(() => {
    getSales().then(setSales).finally(() => setLoading(false));
  }, []);

  // Ventas dentro del rango elegido.
  const filtradas = useMemo(() => {
    if (rango === 'todo') return sales;
    const now = new Date();
    let d0, d1;
    if (rango === 'hoy') { d0 = inicioDia(now); d1 = finDia(now); }
    else if (rango === 'semana') { d0 = inicioDia(new Date(now.getTime() - 6 * 864e5)); d1 = finDia(now); }
    else if (rango === 'mes') { d0 = new Date(now.getFullYear(), now.getMonth(), 1); d1 = finDia(now); }
    else if (rango === 'mesAnterior') { d0 = new Date(now.getFullYear(), now.getMonth() - 1, 1); d1 = finDia(new Date(now.getFullYear(), now.getMonth(), 0)); }
    else if (rango === 'custom') { d0 = desde ? inicioDia(new Date(desde)) : null; d1 = hasta ? finDia(new Date(hasta)) : null; }
    return sales.filter((s) => {
      const f = toDate(s.fecha);
      if (!f) return false;
      if (d0 && f < d0) return false;
      if (d1 && f > d1) return false;
      return true;
    });
  }, [sales, rango, desde, hasta]);

  // ── Tab 1: productos más vendidos ─────────────────────────────────────────
  const productos = useMemo(() => {
    const map = new Map();
    for (const s of filtradas) {
      const vistos = new Set();
      for (const it of s.items || []) {
        const key = it.codigo || it.productoId || it.nombre;
        let e = map.get(key);
        if (!e) { e = { key, nombre: it.nombre, codigo: it.codigo || '', unidades: 0, total: 0, trans: 0 }; map.set(key, e); }
        e.unidades += Number(it.cantidad) || 0;
        e.total += Number(it.subtotal ?? (it.precioUnit * it.cantidad)) || 0;
        if (!vistos.has(key)) { e.trans += 1; vistos.add(key); }
      }
    }
    return [...map.values()].sort((a, b) => b.unidades - a.unidades);
  }, [filtradas]);

  const maxUnidades = Math.max(1, ...productos.map((p) => p.unidades));

  // ── Tab 2: ventas por período ─────────────────────────────────────────────
  const porDia = useMemo(() => {
    const map = new Map();
    for (const s of filtradas) {
      const f = toDate(s.fecha);
      if (!f) continue;
      const key = f.toDateString();
      let e = map.get(key);
      if (!e) { e = { key, fecha: inicioDia(f), ventas: [], total: 0 }; map.set(key, e); }
      e.ventas.push(s);
      e.total += Number(s.total) || 0;
    }
    const arr = [...map.values()].sort((a, b) => b.fecha - a.fecha);
    arr.forEach((d) => d.ventas.sort((a, b) => toDate(b.fecha) - toDate(a.fecha)));
    return arr;
  }, [filtradas]);

  const totalFacturado = useMemo(() => filtradas.reduce((n, s) => n + (Number(s.total) || 0), 0), [filtradas]);
  const ticket = filtradas.length ? totalFacturado / filtradas.length : 0;

  const porPago = useMemo(() => {
    const map = new Map();
    for (const s of filtradas) {
      const k = s.metodoPago || 'otro';
      map.set(k, (map.get(k) || 0) + (Number(s.total) || 0));
    }
    return [...map.entries()].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  }, [filtradas]);

  const toggleDia = (key) => setExpandidos((prev) => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });
  const todosExpandidos = porDia.length > 0 && expandidos.size === porDia.length;
  const toggleTodos = () => setExpandidos(todosExpandidos ? new Set() : new Set(porDia.map((d) => d.key)));

  const exportProductos = () => exportarCsv('reporte-productos.csv', [
    ['#', 'Código', 'Producto', 'Unidades', 'Transacciones', 'Total vendido'],
    ...productos.map((p, i) => [i + 1, p.codigo, p.nombre, p.unidades, p.trans, p.total]),
  ]);
  const exportPeriodo = () => exportarCsv('reporte-ventas.csv', [
    ['Fecha', 'Ventas', 'Total'],
    ...porDia.map((d) => [fechaCorta(d.fecha), d.ventas.length, d.total]),
  ]);

  return (
    <AdminLayout title="Reportes">
      {loading ? <Loader /> : (
        <>
          <p className="rep-sub">{sales.length.toLocaleString('es-AR')} ventas cargadas</p>

          <div className="tabs">
            <button className={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>🏆 Productos más vendidos</button>
            <button className={`tab ${tab === 'periodo' ? 'active' : ''}`} onClick={() => setTab('periodo')}>🗓️ Ventas por período</button>
          </div>

          {/* Filtros de fecha */}
          <div className="card rep-filters">
            {RANGOS.map((r) => (
              <button key={r.id} className={`rep-chip ${rango === r.id ? 'active' : ''}`} onClick={() => setRango(r.id)}>{r.label}</button>
            ))}
            {rango === 'custom' && (
              <div className="row gap-8" style={{ marginLeft: 8 }}>
                <input className="input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                <span className="muted">→</span>
                <input className="input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </div>
            )}
          </div>

          {/* ── Tab Productos ── */}
          {tab === 'productos' && (
            <>
              <div className="toolbar">
                <div className="row gap-8">
                  <span className="chip-soft">{productos.length.toLocaleString('es-AR')} productos distintos</span>
                  <span className="chip-soft">{filtradas.length.toLocaleString('es-AR')} ventas analizadas</span>
                </div>
                <button className="btn btn-soft btn-sm" onClick={exportProductos}>⬇️ Exportar Excel</button>
              </div>

              <div className="table-wrap card">
                <table className="table">
                  <thead>
                    <tr><th style={{ width: 48 }}>#</th><th>Producto</th><th className="num">Unidades</th><th className="num">Transacc.</th><th className="num">Total vendido</th><th style={{ width: 180 }}>Popularidad</th></tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr><td colSpan={6} className="muted">Sin ventas en el período.</td></tr>
                    ) : productos.map((p, i) => (
                      <tr key={p.key}>
                        <td><span className={`rank ${i < 3 ? `rank-${i + 1}` : ''}`}>{i + 1}</span></td>
                        <td><span className="prod-name">{p.nombre}</span>{p.codigo && <span className="code-chip" style={{ marginLeft: 0, display: 'block', width: 'fit-content', marginTop: 2 }}>{p.codigo}</span>}</td>
                        <td className="num"><strong>{p.unidades.toLocaleString('es-AR')}</strong></td>
                        <td className="num">{p.trans.toLocaleString('es-AR')}</td>
                        <td className="num"><strong>{formatMoney(p.total)}</strong></td>
                        <td><div className="bar-track"><div className="bar-fill" style={{ width: `${(p.unidades / maxUnidades) * 100}%` }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Tab Período ── */}
          {tab === 'periodo' && (
            <>
              <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat"><span className="stat-ic">📆</span><div><div className="stat-v">{porDia.length}</div><div className="stat-l">Días con ventas</div></div></div>
                <div className="stat info"><span className="stat-ic">🧾</span><div><div className="stat-v">{filtradas.length.toLocaleString('es-AR')}</div><div className="stat-l">Total ventas</div></div></div>
                <div className="stat ok"><span className="stat-ic">💵</span><div><div className="stat-v">{formatMoney(totalFacturado)}</div><div className="stat-l">Total facturado</div></div></div>
                <div className="stat"><span className="stat-ic">🎟️</span><div><div className="stat-v">{formatMoney(ticket)}</div><div className="stat-l">Ticket promedio</div></div></div>
              </div>

              <div className="toolbar">
                <span className="chip-soft">{filtradas.length.toLocaleString('es-AR')} ventas · {porDia.length} días</span>
                <div className="row gap-8">
                  <button className="btn btn-ghost btn-sm" onClick={toggleTodos}>{todosExpandidos ? 'Contraer todo' : 'Expandir todo'}</button>
                  <button className="btn btn-soft btn-sm" onClick={exportPeriodo}>⬇️ Exportar Excel</button>
                </div>
              </div>

              <div className="rep-periodo">
                <div className="stack gap-12">
                  {porDia.length === 0 ? (
                    <div className="card" style={{ padding: 20 }}><p className="muted">Sin ventas en el período.</p></div>
                  ) : porDia.map((d) => {
                    const abierto = expandidos.has(d.key);
                    return (
                      <div className="card dia-card" key={d.key}>
                        <button className="dia-head" onClick={() => toggleDia(d.key)}>
                          <span className="dia-caret">{abierto ? '▾' : '▸'}</span>
                          <strong>{fechaCorta(d.fecha)}</strong>
                          <span className="chip-soft">{d.ventas.length} venta{d.ventas.length !== 1 ? 's' : ''}</span>
                          <span className="dia-total">{formatMoney(d.total)}</span>
                        </button>
                        {abierto && (
                          <div className="dia-detalle">
                            {d.ventas.map((s) => {
                              const m = PAYMENT_METHODS[s.metodoPago];
                              return (
                                <div className="dia-venta" key={s.id}>
                                  <span className="muted">{horaCorta(toDate(s.fecha))}</span>
                                  <span>{m?.icon || ''} {m?.label || s.metodoPago}</span>
                                  <span className="muted">{s.cliente || 'Consumidor final'}</span>
                                  <span className="num"><strong>{formatMoney(s.total)}</strong></span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <aside className="card rep-pagos">
                  <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: 14 }}>Por método de pago</h3>
                  {porPago.length === 0 ? <p className="muted">Sin datos.</p> : porPago.map(({ k, v }) => {
                    const m = PAYMENT_METHODS[k];
                    const pct = totalFacturado > 0 ? (v / totalFacturado) * 100 : 0;
                    return (
                      <div className="pago-row" key={k}>
                        <div className="pago-top"><span>{m?.icon || '•'} {m?.label || k}</span><strong>{formatMoney(v)}</strong></div>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                        <div className="pago-pct">{pct.toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </aside>
              </div>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default Reports;
