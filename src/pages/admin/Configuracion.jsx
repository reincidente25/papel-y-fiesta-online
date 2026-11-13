// src/pages/admin/Configuracion.jsx
// Configuración de la tienda en pestañas: Categorías, Promoción y Pagos.
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminCategories from './AdminCategories';
import PromoSettings from './PromoSettings';
import PagosPanel from './PagosPanel';

const TABS = [
  { id: 'categorias', label: '🏷️ Categorías' },
  { id: 'promo', label: '🎯 Promoción' },
  { id: 'pagos', label: '🏦 Pagos' },
];

const Configuracion = () => {
  const [tab, setTab] = useState('categorias');
  return (
    <AdminLayout title="Configuración">
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === 'categorias' && <AdminCategories embedded />}
      {tab === 'promo' && <PromoSettings embedded />}
      {tab === 'pagos' && <PagosPanel />}
    </AdminLayout>
  );
};

export default Configuracion;
