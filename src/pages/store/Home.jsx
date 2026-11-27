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

// Pasteles de respaldo para categorías sin foto (se rota por posición).
const PASTELS = ['#F7A8CB', '#C3ABEF', '#9FE0C4', '#FFD873'];

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
        // Cantidad de productos web por categoría → top 6 con más productos.
        const conteo = new Map();
        for (const p of pub) if (p.categoria) conteo.set(p.categoria, (conteo.get(p.categoria) || 0) + 1);
        const conProd = cats
          .filter((c) => conteo.get(c.id))
          .map((c) => ({ ...c, cantidad: conteo.get(c.id) }))
          .sort((a, b) => b.cantidad - a.cantidad);
        setCategories(conProd.length ? conProd : cats);
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
          {home.heroNota && <p className="hero2-nota">🚚 {home.heroNota}</p>}
        </div>
      </section>

      {/* Cómo comprar (destacado, arriba) */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Comprar es muy fácil</h2>
            <p>En 4 pasos tenés tu pedido listo. No se paga en la web: coordinamos el pago con vos.</p>
          </div>
        </div>
        <div className="steps-big">
          <div className="step-big"><span className="step-big-n">1</span><span className="step-big-ic">🛒</span><strong>Elegí tus productos</strong><p>Navegá el catálogo y agregá al carrito lo que necesites. Podés ver el precio con transferencia o débito.</p></div>
          <div className="step-big"><span className="step-big-n">2</span><span className="step-big-ic">📝</span><strong>Hacé tu pedido</strong><p>Elegí envío a domicilio o retiro en el local, y tu forma de pago (transferencia, débito o crédito en cuotas).</p></div>
          <div className="step-big"><span className="step-big-n">3</span><span className="step-big-ic">✅</span><strong>Confirmamos el stock</strong><p>Te escribimos por WhatsApp/email, confirmamos disponibilidad y te pasamos cómo abonar.</p></div>
          <div className="step-big"><span className="step-big-n">4</span><span className="step-big-ic">📦</span><strong>Lo recibís</strong><p>Despachamos por correo a todo el país o lo retirás por el local cuando esté listo.</p></div>
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
        <div className="cat-mini-grid">
          {categories.map((cat, i) => (
            <Link key={cat.id} to={`/catalogo?cat=${cat.id}`}
              className={`cat-mini ${cat.imagen ? '' : 'cat-mini--pastel'}`}
              style={cat.imagen ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,.7) 0%, rgba(0,0,0,.05) 60%), url(${cat.imagen})` } : { background: PASTELS[i % PASTELS.length] }}>
              {!cat.imagen && <span className="cat-mini-emoji">{cat.icon || '🎁'}</span>}
              <span className="cat-mini-name">{cat.name}</span>
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
            <img className="duo-img" src="/cotillon.jpg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </Link>
          <Link to="/catalogo" className="duo-card duo-regalo">
            <div className="duo-content">
              <span className="duo-eyebrow">Para sorprender</span>
              <h3>Regalería 🎁</h3>
              <p>Ideas originales para regalar en cualquier ocasión, listas para entregar.</p>
              <span className="duo-link">Ver regalos →</span>
            </div>
            <img className="duo-img" src="/regaleria.jpg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </Link>
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
