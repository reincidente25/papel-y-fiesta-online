// src/components/common/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Ruta protegida: requiere sesión + rol admin.
// En modo demo (sin Firebase) se permite el acceso para poder ver el panel.
const AdminRoute = ({ children }) => {
  const { user, isAdmin, demoMode } = useAuth();

  if (demoMode) return children;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
