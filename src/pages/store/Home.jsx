// src/pages/store/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';
import Loader from '../../components/common/Loader';
import { getFeaturedProducts } from '../../services/productsService';
import { DEFAULT_CATEGORIES } from '../../constants';
import './store.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedProducts()
      .then(setFeatured)
      .finally(() => setLoading(false));
  }, []);

  return (
    <StoreLayout>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">🎉 Librería &amp; Cotillón online</span>
            <h1>Todo para tu día a día y tus <span className="accent">festejos</span></h1>
            <p>Útiles escolares, artículos de oficina, materiales de arte y todo el cotillón para tu próxima fiesta. Envíos a todo el país.</p>
            <div className="hero-cta">
              <Link to="/catalogo" className="btn btn-primary">Ver catálogo</Link>
              <Link to="/registro" className="btn btn-ghost">Crear cuenta</Link>
            </div>
          </div>
          <div className="hero-art">
            <img
              src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=80"
              alt="Artículos de librería y fiesta"
            />
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Explorá por categoría</h2>
            <p>Encontrá rápido lo que buscás.</p>
          </div>
        </div>
        <div className="cat-grid">
          {DEFAULT_CATEGORIES.map((cat) => (
            <Link key={cat.id} to={`/catalogo?cat=${cat.id}`} className="cat-chip">
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
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
        {loading ? (
          <Loader />
        ) : (
          <div className="product-grid">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Promo */}
      <section className="section container">
        <div className="promo">
          <div>
            <h2>¿Organizás un evento?</h2>
            <p>Armamos combos de cotillón a medida. Consultanos por cantidades mayoristas.</p>
          </div>
          <Link to="/catalogo?cat=fiesta" className="btn btn-primary">Ver cotillón</Link>
        </div>
      </section>
    </StoreLayout>
  );
};

export default Home;
