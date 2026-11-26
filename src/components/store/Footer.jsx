// src/components/store/Footer.jsx
import { Link } from 'react-router-dom';
import Brand from '../common/Brand';
import { STORE_INFO } from '../../config/store';
import './Footer.css';

const waNum = (STORE_INFO.whatsapp || '').replace(/[^\d]/g, '');

const Footer = () => (
  <footer className="footer">
    {/* Tira de beneficios */}
    <div className="footer-bene">
      <div className="container footer-bene-inner">
        <div className="fb-item"><span>🚚</span><div><strong>Envíos a todo el país</strong><small>Correo Argentino o retiro en el local</small></div></div>
        <div className="fb-item"><span>💳</span><div><strong>Múltiples formas de pago</strong><small>Transferencia, débito y crédito en cuotas</small></div></div>
        <div className="fb-item"><span>🔒</span><div><strong>Compra segura</strong><small>Te acompañamos en todo el proceso</small></div></div>
        <div className="fb-item"><span>💬</span><div><strong>Atención personalizada</strong><small>Escribinos por WhatsApp</small></div></div>
      </div>
    </div>

    <div className="container footer-inner">
      <div className="footer-col footer-brand">
        <Brand />
        <p className="muted">Librería, cotillón y regalería. Todo para tu día a día, tus festejos y tus regalos.</p>
        <div className="footer-social">
          {waNum && <a href={`https://api.whatsapp.com/send?phone=${waNum}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>}
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📷</a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
        </div>
      </div>

      <div className="footer-col">
        <h4>Tienda</h4>
        <Link to="/catalogo">Catálogo</Link>
        <Link to="/carrito">Mi carrito</Link>
        <Link to="/catalogo">Cotillón y fiesta</Link>
        <Link to="/catalogo">Regalería</Link>
      </div>

      <div className="footer-col">
        <h4>Mi cuenta</h4>
        <Link to="/perfil">Mi perfil</Link>
        <Link to="/mis-pedidos">Mis pedidos</Link>
        <Link to="/login">Ingresar</Link>
        <Link to="/registro">Crear cuenta</Link>
      </div>

      <div className="footer-col">
        <h4>Contacto</h4>
        {waNum && <a href={`https://api.whatsapp.com/send?phone=${waNum}`} target="_blank" rel="noreferrer">💬 {STORE_INFO.whatsapp}</a>}
        <a href={`mailto:${STORE_INFO.email}`}>✉️ {STORE_INFO.email}</a>
        <span className="muted">🕑 Lun a Vie 9 a 18 · Sáb 9 a 13</span>
        <span className="muted">📍 Retiro en el local (a coordinar)</span>
      </div>
    </div>

    <div className="footer-bottom">
      <span className="muted">© {new Date().getFullYear()} {STORE_INFO.nombre}. Todos los derechos reservados.</span>
      <span className="muted">Hecho con 🧡 para tus festejos</span>
    </div>
  </footer>
);

export default Footer;
