// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AdminRoute from './components/common/AdminRoute';

// Tienda (público)
import Home from './pages/store/Home';
import Catalog from './pages/store/Catalog';
import ProductDetail from './pages/store/ProductDetail';
import Cart from './pages/store/Cart';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import ImportProducts from './pages/admin/ImportProducts';
import AdminOrders from './pages/admin/AdminOrders';
import Sales from './pages/admin/Sales';
import Purchases from './pages/admin/Purchases';
import Suppliers from './pages/admin/Suppliers';
import Customers from './pages/admin/Customers';
import Cash from './pages/admin/Cash';
import Reports from './pages/admin/Reports';

const App = () => (
  <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Tienda pública */}
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />

          {/* Autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Panel de administración */}
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/productos" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/productos/nuevo" element={<AdminRoute><ProductForm /></AdminRoute>} />
          <Route path="/admin/productos/:id" element={<AdminRoute><ProductForm /></AdminRoute>} />
          <Route path="/admin/importar" element={<AdminRoute><ImportProducts /></AdminRoute>} />
          <Route path="/admin/ventas" element={<AdminRoute><Sales /></AdminRoute>} />
          <Route path="/admin/compras" element={<AdminRoute><Purchases /></AdminRoute>} />
          <Route path="/admin/proveedores" element={<AdminRoute><Suppliers /></AdminRoute>} />
          <Route path="/admin/clientes" element={<AdminRoute><Customers /></AdminRoute>} />
          <Route path="/admin/caja" element={<AdminRoute><Cash /></AdminRoute>} />
          <Route path="/admin/reportes" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/admin/pedidos" element={<AdminRoute><AdminOrders /></AdminRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
);

export default App;
