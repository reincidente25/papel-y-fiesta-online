// src/components/store/Footer.jsx
import Brand from '../common/Brand';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <div className="footer-col">
        <Brand />
        <p className="muted">Todo para tu escritorio, tu escuela y tus festejos.</p>
      </div>
      <div className="footer-col">
        <h4>Tienda</h4>
        <a href="/catalogo">Catálogo</a>
        <a href="/carrito">Mi carrito</a>
      </div>
      <div className="footer-col">
        <h4>Contacto</h4>
        <span className="muted">hola@papelyfiesta.com</span>
        <span className="muted">WhatsApp: +54 9 ...</span>
      </div>
    </div>
    <div className="footer-bottom">
      <span className="muted">© {new Date().getFullYear()} Papel &amp; Fiesta. Todos los derechos reservados.</span>
    </div>
  </footer>
);

export default Footer;
