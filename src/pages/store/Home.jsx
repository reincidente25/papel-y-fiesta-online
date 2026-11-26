// src/pages/store/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';
import PromoPopup from '../../components/store/PromoPopup';
import Loader from '../../components/common/Loader';
import { getPublicProducts } from '../../services/productsService';
import { getCategories } from '../../services/categoriesService';
import { LANDING } from '../../config/landing';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import './store.css';

// Degradados de respaldo para categorías sin foto (se asigna por posición).
const GRADS = [
  'linear-gradient(135deg,#F7941E,#ffb45e)',
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#00b894,#55efc4)',
  'linear-gradient(135deg,#e17055,#fab1a0)',
  'linear-gradient(135deg,#0984e3,#74b9ff)',
  'linear-gradient(135deg,#d63031,#ff7675)',
  'linear-gradient(135deg,#fdcb6e,#ffeaa7)',
  'linear-gradient(135deg,#2d3436,#636e72)',
];

const ms = (f) => {
  if (!f) return 0;
  if (typeof f === 'string') return new Date(f).getTime();
  if (f.seconds) return f.seconds * 1000;
  if (f.toMillis) return f.toMillis();
  return 0;
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    Promise.all([getPublicProducts(), getCategories()])
      .then(([pub, cats]) => {
        const dest = pub.filter((p) => p.destacado);
        setFeatured((dest.length ? dest : pub).slice(0, 10));
        // Novedades: los más recientes (por fecha de creación).
        const recientes = [...pub].sort((a, b) => ms(b.creadoEn) - ms(a.creadoEn)).slice(0, 10);
        setNovedades(recientes);
        // Cantidad de productos web por categoría.
        const conteo = new Map();
        for (const p of pub) if (p.categoria) conteo.set(p.categoria, (conteo.get(p.categoria) || 0) + 1);
        const conProd = cats.filter((c) => conteo.get(c.id)).map((c) => ({ ...c, cantidad: conteo.get(c.id) }));
        setCategories((conProd.length ? conProd : cats).slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  const home = LANDING;
  const heroStyle = home.heroImagen
    ? {
      backgroundImage: `linear-gradient(rgba(20,16,10,.5),rgba(20,16,10,.55)), url(${home.heroImagen}), linear-gradient(135deg,#2b2b2b,#4a3a2a)`,
      backgroundPosition: `center ${home.heroPos || 'center'}`,
    }
    : undefined;

  return (
    <StoreLayout>
      <PromoPopup />

      {/* Hero */}
      <section className={`hero2 ${home.heroImagen ? 'has-img' : ''}`} style={heroStyle}>
        <div className="container hero2-inner">
          <span className="hero2-eyebrow">{home.heroEyebrow}</span>
          <h1 className="hero2-title">{home.heroTitulo}</h1>
          <p className="hero2-sub">{home.heroSubtitulo}</p>
          <div className="hero2-cta">
            <Link to={home.ctaLink || '/catalogo'} className="btn btn-primary btn-lg">{home.ctaTexto || 'Ver catálogo'}</Link>
            {!user && <button className="btn btn-light" onClick={() => openAuth('register')}>Crear cuenta</button>}
          </div>
        </div>
      </section>

      {/* Tiras de valor */}
      <section className="container">
        <div className="valores">
          <div className="valor"><span>🚚</span><div><strong>Envíos a todo el país</strong><small>Correo Argentino y retiro en el local</small></div></div>
          <div className="valor"><span>🎁</span><div><strong>Regalería para sorprender</strong><small>Ideas para cada ocasión</small></div></div>
          <div className="valor"><span>🎉</span><div><strong>Todo el cotillón</strong><small>Armamos combos a medida</small></div></div>
          <div className="valor"><span>💳</span><div><strong>Transferencia o tarjeta</strong><small>Débito y crédito en cuotas</small></div></div>
        </div>
      </section>

      {/* Categorías (galería moderna, nombre sobre la imagen) */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Explorá por categoría</h2>
            <p>Encontrá rápido lo que buscás, sea para estudiar, festejar o regalar.</p>
          </div>
          <Link to="/catalogo" className="btn btn-ghost btn-sm">Ver todo</Link>
        </div>
        <div className="cat-gallery">
          {categories.map((cat, i) => (
            <Link key={cat.id} to={`/catalogo?cat=${cat.id}`} className="cat-tile"
              style={cat.imagen ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 55%, rgba(0,0,0,.05) 100%), url(${cat.imagen})` } : { backgroundImage: GRADS[i % GRADS.length] }}>
              {!cat.imagen && <span className="cat-tile-emoji">{cat.icon || '🏷️'}</span>}
              <div className="cat-tile-body">
                <h3>{cat.name}</h3>
                {cat.cantidad != null && <span className="cat-tile-count">{cat.cantidad} producto{cat.cantidad !== 1 ? 's' : ''}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Destacados</h2>
            <p>Nuestra selección de la semana.</p>
          </div>
          <Link to="/catalogo" className="btn btn-ghost btn-sm">Ver todo</Link>
        </div>
        {loading ? <Loader /> : (
          <div className="product-grid">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Banda de dos mundos */}
      <section className="section container">
        <div className="duo">
          <Link to="/catalogo" className="duo-card duo-fiesta">
            <div className="duo-content">
              <span className="duo-eyebrow">Para tu próxima fiesta</span>
              <h3>Cotillón & Fiesta 🎉</h3>
              <p>Globos, combos temáticos, velas y todo para que la celebración sea un éxito.</p>
              <span className="duo-link">Ver cotillón →</span>
            </div>
          </Link>
          <Link to="/catalogo" className="duo-card duo-regalo">
            <div className="duo-content">
              <span className="duo-eyebrow">Para sorprender</span>
              <h3>Regalería 🎁</h3>
              <p>Ideas originales para regalar en cualquier ocasión, listas para entregar.</p>
              <span className="duo-link">Ver regalos →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Novedades */}
      {!loading && novedades.length > 0 && (
        <section className="section container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Novedades ✨</h2>
              <p>Lo último que sumamos al catálogo.</p>
            </div>
            <Link to="/catalogo" className="btn btn-ghost btn-sm">Ver todo</Link>
          </div>
          <div className="product-grid">
            {novedades.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Cómo comprar */}
      <section className="section container">
        <h2 className="section-title" style={{ marginBottom: 18 }}>Comprar es muy fácil</h2>
        <div className="steps">
          <div className="step"><span className="step-n">1</span><div><strong>Elegí tus productos</strong><p>Agregá al carrito lo que necesites.</p></div></div>
          <div className="step"><span className="step-n">2</span><div><strong>Hacé tu pedido</strong><p>Elegí envío o retiro y forma de pago.</p></div></div>
          <div className="step"><span className="step-n">3</span><div><strong>Confirmamos el stock</strong><p>Te avisamos y te pasamos cómo pagar.</p></div></div>
          <div className="step"><span className="step-n">4</span><div><strong>Lo recibís</strong><p>Despachamos por correo o lo retirás.</p></div></div>
        </div>
      </section>

      {/* Promo final */}
      <section className="section container">
        <div className="promo">
          <div>
            <h2>¿Organizás un evento o buscás un regalo?</h2>
            <p>Armamos combos de cotillón y regalería a medida. Consultanos por cantidades mayoristas.</p>
          </div>
          <Link to="/catalogo" className="btn btn-primary">Ver catálogo</Link>
        </div>
      </section>
    </StoreLayout>
  );
};

export default Home;
