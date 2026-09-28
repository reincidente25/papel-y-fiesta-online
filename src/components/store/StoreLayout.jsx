// src/components/store/StoreLayout.jsx
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

const StoreLayout = ({ children }) => {
  const { demoMode } = useAuth();
  return (
    <div className="store">
      {demoMode && (
        <div className="demo-banner">
          🧪 Modo demo — Firebase no configurado. Los datos son de ejemplo.
        </div>
      )}
      <Navbar />
      <main className="store-main">{children}</main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
