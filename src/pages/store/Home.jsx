// src/pages/store/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';
import Loader from '../../components/common/Loader';
import { getPublicProducts } from '../../services/productsService';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import './store.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    getPublicProducts()
      .then((pub) => {
        // Destacados: los marcados; si no hay, algunos productos web.
        const dest = pub.filter((p) => p.destacado);
        setFeatured((dest.length ? dest : pub).slice(0, 10));
        // Categorías que tienen productos en la web, por cantidad (hasta 10).
        const map = new Map();
        for (const p of pub) {
          if (!p.categoria) continue;
          const e = map.get(p.categoria) || { id: p.categoria, name: p.categoriaNombre || p.categoria, cantidad: 0 };
          e.cantidad += 1;
          map.set(p.categoria, e);
        }
        const top = [...map.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
        setCategories(top);
      })
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
              {!user && <button className="btn btn-ghost" onClick={() => openAuth('register')}>Crear cuenta</button>}
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
          {categories.map((cat) => (
            <Link key={cat.id} to={`/catalogo?cat=${cat.id}`} className="cat-chip">
              <span className="cat-icon">{cat.icon || '🏷️'}</span>
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
