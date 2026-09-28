// src/components/store/Navbar.jsx
import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Brand from '../common/Brand';
import './Navbar.css';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>
          <Brand />
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setOpen(false)}>Inicio</NavLink>
          <NavLink to="/catalogo" onClick={() => setOpen(false)}>Catálogo</NavLink>
          {isAdmin && <NavLink to="/admin" onClick={() => setOpen(false)}>Panel</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/carrito" className="nav-cart" aria-label="Carrito">
            🛒
            {count > 0 && <span className="nav-cart-badge">{count}</span>}
          </Link>

          {user ? (
            <div className="nav-user">
              <span className="nav-user-name">{user.displayName || user.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Salir</button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">Ingresar</Link>
              <Link to="/registro" className="btn btn-primary btn-sm">Crear cuenta</Link>
            </div>
          )}

          <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menú">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
