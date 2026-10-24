// src/components/store/StoreLayout.jsx
import Navbar from './Navbar';
import Footer from './Footer';
import { MOCK_MODE } from '../../config/app';

const StoreLayout = ({ children }) => {
  return (
    <div className="store">
      {MOCK_MODE && (
        <div className="demo-banner">
          🧪 Datos de ejemplo (los productos aún no vienen del backend).
        </div>
      )}
      <Navbar />
      <main className="store-main">{children}</main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
