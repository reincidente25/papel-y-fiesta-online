// src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Brand from '../common/Brand';
import './admin.css';

const NAV = [
  { path: '/admin',          label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/productos', label: 'Productos', icon: '📦' },
  { path: '/admin/importar',  label: 'Importar',  icon: '⬇️' },
  { path: '/admin/pedidos',   label: 'Pedidos',   icon: '🧾' },
];

const AdminLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Link to="/admin" className="admin-logo"><Brand size="1.2rem" /></Link>
        <span className="admin-tag">Panel</span>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/" className="admin-nav-item">🏬 Ver tienda</Link>
          <div className="admin-user">{user?.email || 'Modo demo'}</div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button className="admin-burger" onClick={() => setOpen(!open)}>☰</button>
          <h1 className="admin-title">{title}</h1>
        </header>
        <div className="admin-content">{children}</div>
      </div>

      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}
    </div>
  );
};

export default AdminLayout;
