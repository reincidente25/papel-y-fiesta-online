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

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    Promise.all([getPublicProducts(), getCategories()])
      .then(([pub, cats]) => {
        const dest = pub.filter((p) => p.destacado);
        setFeatured((dest.length ? dest : pub).slice(0, 10));
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
      // La última capa (degradado de marca) se ve si la imagen falta.
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
          <div className="valor"><span>✏️</span><div><strong>Librería completa</strong><small>Escolar, oficina y arte</small></div></div>
        </div>
      </section>

      {/* Categorías (estilo recorrido) */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Explorá por categoría</h2>
            <p>Encontrá rápido lo que buscás, sea para estudiar, festejar o regalar.</p>
          </div>
          <Link to="/catalogo" className="btn btn-ghost btn-sm">Ver todo</Link>
        </div>
        <div className="cat-cards">
          {categories.map((cat, i) => (
            <Link key={cat.id} to={`/catalogo?cat=${cat.id}`} className="cat-card2">
              <div className="cat-card2-media" style={cat.imagen ? { backgroundImage: `url(${cat.imagen})` } : { background: GRADS[i % GRADS.length] }}>
                {!cat.imagen && <span className="cat-card2-emoji">{cat.icon || '🏷️'}</span>}
              </div>
              <div className="cat-card2-body">
                <h3>{cat.name}</h3>
                <p>{cat.descripcion || `Descubrí todo en ${cat.name}`}</p>
                <span className="cat-card2-link">Ver productos →</span>
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

      {/* Promo */}
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
