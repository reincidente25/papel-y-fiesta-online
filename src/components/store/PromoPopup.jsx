// src/components/store/PromoPopup.jsx
// Popup promocional de la landing: se muestra al entrar si está activo, y se
// puede cerrar. Se recuerda por versión (si el admin lo cambia, vuelve a salir).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopup } from '../../services/popupService';

const PromoPopup = () => {
  const [promo, setPromo] = useState(null);
  const [open, setOpen] = useState(false);

  // Se muestra cada vez que se abre la landing (sin recordar el cierre).
  useEffect(() => {
    getPopup().then((p) => {
      if (!p.activo || (!p.imagen && !p.titulo)) return;
      setPromo(p);
      setOpen(true);
    });
  }, []);

  const cerrar = () => setOpen(false);

  if (!open || !promo) return null;

  const tieneImg = Boolean(promo.imagen);
  const hayTexto = promo.titulo || promo.texto || (promo.ctaLink && promo.ctaTexto);

  return (
    <div className="promo-pop-overlay" onClick={cerrar}>
      <div className={`promo-pop2 texto-${promo.textoColor || 'blanco'}`} onClick={(e) => e.stopPropagation()}>
        <button className="promo-pop-x" onClick={cerrar} aria-label="Cerrar">✕</button>
        {tieneImg && <img className="promo-pop2-img" src={promo.imagen} alt={promo.titulo || 'Promoción'} />}
        {hayTexto && (
          <div className={`promo-pop2-content ${tieneImg ? 'overlay' : 'plano'}`}>
            {promo.titulo && <h3>{promo.titulo}</h3>}
            {promo.texto && <p>{promo.texto}</p>}
            {promo.ctaLink && promo.ctaTexto && (
              <Link to={promo.ctaLink} className="btn btn-primary" onClick={cerrar}>{promo.ctaTexto}</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoPopup;
