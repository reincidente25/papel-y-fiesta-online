// src/pages/admin/AbandonedCarts.jsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getAbandonedCarts, updateCartStatus } from '../../services/cartsService';
import { ABANDONED_STATUS, ABANDONED_STATUS_LIST } from '../../constants';
import { STORE_INFO } from '../../config/store';
import { formatMoney, formatDate } from '../../utils/format';

// Tiempo transcurrido desde la última actividad, legible.
const desde = (fecha) => {
  const ms = Date.now() - new Date(fecha).getTime();
  const h = Math.floor(ms / 3.6e6);
  if (h < 1) return 'hace minutos';
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d > 1 ? 's' : ''}`;
};

// Arma el mensaje de WhatsApp para recuperar el carrito.
const waLink = (cart) => {
  if (!cart.telefono) return null;
  const lista = cart.items.map((i) => `• ${i.cantidad}x ${i.nombre}`).join('\n');
  const msg = `¡Hola ${cart.cliente || ''}! Te escribimos de ${STORE_INFO.nombre} 🎉\n\n`
    + `Vimos que dejaste estos productos en tu carrito:\n${lista}\n\n`
    + `Total: ${formatMoney(cart.total)}\n\n`
    + `¿Querés que te ayudemos a terminar la compra? Tenemos stock disponible.`;
  return `https://wa.me/${cart.telefono}?text=${encodeURIComponent(msg)}`;
};

const AbandonedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('abierto');

  const load = () => { setLoading(true); getAbandonedCarts().then(setCarts).finally(() => setLoading(false)); };
  useEffect(load, []);

  const setStatus = async (id, estado) => {
    await updateCartStatus(id, estado);
    const updated = await getAbandonedCarts();
    setCarts(updated);
    setDetail((d) => (d ? updated.find((c) => c.id === d.id) || null : null));
  };

  const visible = filter === 'todos' ? carts : carts.filter((c) => c.estado === filter);
  const abiertos = carts.filter((c) => c.estado === 'abierto');
  const potencial = abiertos.reduce((n, c) => n + c.total, 0);
  const recuperados = carts.filter((c) => c.estado === 'recuperado').length;

  return (
    <AdminLayout title="Carritos abandonados">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi"><span className="kpi-icon">🛒</span><span className="kpi-value">{abiertos.length}</span><span className="kpi-label">Abandonados sin contactar</span></div>
        <div className="card kpi"><span className="kpi-icon">💸</span><span className="kpi-value">{formatMoney(potencial)}</span><span className="kpi-label">Venta potencial a recuperar</span></div>
        <div className="card kpi"><span className="kpi-icon">✅</span><span className="kpi-value">{recuperados}</span><span className="kpi-label">Recuperados</span></div>
      </div>

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="todos">Todos</option>
          {ABANDONED_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : visible.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛒</div>
          <h3>No hay carritos en este estado</h3>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Ítems</th><th>Total</th><th>Última actividad</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {visible.map((c) => {
                const st = ABANDONED_STATUS[c.estado] || ABANDONED_STATUS.abierto;
                const link = waLink(c);
                return (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(c)}>
                    <td><strong>{c.cliente || 'Visitante'}</strong></td>
                    <td>{c.telefono || c.email || '—'}</td>
                    <td>{c.items.reduce((n, i) => n + i.cantidad, 0)}</td>
                    <td><strong>{formatMoney(c.total)}</strong></td>
                    <td>{desde(c.actualizadoEn)}</td>
                    <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {link
                        ? <a className="btn btn-soft btn-sm" href={link} target="_blank" rel="noreferrer">💬 WhatsApp</a>
                        : <span className="hint">sin teléfono</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle del carrito */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Carrito abandonado" width={480}>
        {detail && (() => {
          const link = waLink(detail);
          return (
            <div>
              <div className="ticket-info">
                <div className="ti"><span className="k">Cliente</span><span className="v">{detail.cliente || 'Visitante'}</span></div>
                <div className="ti"><span className="k">Contacto</span><span className="v">{detail.telefono || detail.email || '—'}</span></div>
                <div className="ti"><span className="k">Última actividad</span><span className="v">{formatDate(detail.actualizadoEn)}</span></div>
                <div className="ti"><span className="k">Estado</span><span className="v"><span className={`badge ${(ABANDONED_STATUS[detail.estado] || ABANDONED_STATUS.abierto).badge}`}>{(ABANDONED_STATUS[detail.estado] || ABANDONED_STATUS.abierto).label}</span></span></div>
              </div>
              <table className="table" style={{ marginBottom: 12 }}>
                <thead><tr><th>Producto</th><th style={{ textAlign: 'center' }}>Cant.</th><th style={{ textAlign: 'right' }}>Importe</th></tr></thead>
                <tbody>
                  {detail.items.map((i, idx) => (
                    <tr key={idx}><td>{i.nombre}</td><td style={{ textAlign: 'center' }}>{i.cantidad}</td><td style={{ textAlign: 'right' }}>{formatMoney(i.precio * i.cantidad)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="pos-total"><span>Total</span><span>{formatMoney(detail.total)}</span></div>

              <div className="ticket-actions" style={{ flexWrap: 'wrap' }}>
                {link && <a className="btn btn-primary" href={link} target="_blank" rel="noreferrer" onClick={() => setStatus(detail.id, 'contactado')}>💬 Contactar por WhatsApp</a>}
                <button className="btn btn-soft" onClick={() => setStatus(detail.id, 'recuperado')}>Marcar recuperado</button>
                <button className="btn btn-ghost" onClick={() => setStatus(detail.id, 'descartado')}>Descartar</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </AdminLayout>
  );
};

export default AbandonedCarts;
