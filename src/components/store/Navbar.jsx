// src/components/store/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useAuthModal } from '../../context/AuthModalContext';
import Brand from '../common/Brand';
import './Navbar.css';

const Navbar = () => {
  const { user, isAdmin, demoMode, logout } = useAuth();
  const { count } = useCart();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const userRef = useRef(null);

  const handleLogout = async () => {
    setMenu(false);
    await logout();
    navigate('/');
  };

  // Cerrar el menú del usuario al hacer clic fuera.
  useEffect(() => {
    if (!menu) return undefined;
    const onClick = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menu]);

  const closeAll = () => { setOpen(false); setMenu(false); };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>
          <Brand />
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setOpen(false)}>Inicio</NavLink>
          <NavLink to="/catalogo" onClick={() => setOpen(false)}>Catálogo</NavLink>
          {(isAdmin || demoMode) && <NavLink to="/admin" onClick={() => setOpen(false)}>Panel</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/carrito" className="nav-cart" aria-label="Carrito">
            🛒
            {count > 0 && <span className="nav-cart-badge">{count}</span>}
          </Link>

          {user ? (
            <div className="nav-user" ref={userRef}>
              <button className="nav-user-name" onClick={() => setMenu((m) => !m)} aria-haspopup="true" aria-expanded={menu}>
                👤 {user.displayName || user.email} <span className="nav-caret">▾</span>
              </button>
              {menu && (
                <div className="nav-dropdown">
                  <Link to="/perfil" onClick={closeAll}>👤 Mi perfil</Link>
                  <Link to="/mis-pedidos" onClick={closeAll}>🧾 Mis pedidos</Link>
                  <button onClick={handleLogout}>↩ Salir</button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth">
              <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); openAuth('login'); }}>Ingresar</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setOpen(false); openAuth('register'); }}>Crear cuenta</button>
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
