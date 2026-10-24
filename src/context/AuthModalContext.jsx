// src/context/AuthModalContext.jsx
import { createContext, useContext, useState } from 'react';
import AuthModal from '../components/store/AuthModal';

const AuthModalContext = createContext(null);

export const AuthModalProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, mode: 'login' });

  const openAuth = (mode = 'login') => setState({ open: true, mode });
  const closeAuth = () => setState((s) => ({ ...s, open: false }));

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      <AuthModal open={state.open} mode={state.mode} onClose={closeAuth} />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal debe usarse dentro de AuthModalProvider');
  return ctx;
};
