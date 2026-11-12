// src/components/store/PromoPopup.jsx
// Popup promocional de la landing: se muestra al entrar si está activo, y se
// puede cerrar. Se recuerda por versión (si el admin lo cambia, vuelve a salir).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopup } from '../../services/popupService';

const KEY = 'pf_popup_ver';

const PromoPopup = () => {
  const [promo, setPromo] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getPopup().then((p) => {
      if (!p.activo || (!p.imagen && !p.titulo)) return;
      let visto = '';
      try { visto = localStorage.getItem(KEY) || ''; } catch { /* ignore */ }
      if (String(p.ver) === visto) return; // ya lo cerró en esta versión
      setPromo(p);
      setOpen(true);
    });
  }, []);

  const cerrar = () => {
    setOpen(false);
    try { localStorage.setItem(KEY, String(promo?.ver || '')); } catch { /* ignore */ }
  };

  if (!open || !promo) return null;

  return (
    <div className="promo-pop-overlay" onClick={cerrar}>
      <div className="promo-pop" onClick={(e) => e.stopPropagation()}>
        <button className="promo-pop-x" onClick={cerrar} aria-label="Cerrar">✕</button>
        {promo.imagen && <div className="promo-pop-img" style={{ backgroundImage: `url(${promo.imagen})` }} />}
        <div className="promo-pop-body">
          {promo.titulo && <h3>{promo.titulo}</h3>}
          {promo.texto && <p>{promo.texto}</p>}
          <div className="promo-pop-cta">
            {promo.ctaLink && promo.ctaTexto && (
              <Link to={promo.ctaLink} className="btn btn-primary" onClick={cerrar}>{promo.ctaTexto}</Link>
            )}
            <button className="btn btn-ghost" onClick={cerrar}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;
