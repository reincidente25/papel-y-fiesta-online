// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { createUserProfile, getUserProfile } from '../services/usersService';
import { ROLES } from '../constants';

const DEMO = MOCK_MODE || !isFirebaseConfigured;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // usuario de Firebase Auth
  const [profile, setProfile] = useState(null);   // perfil en Firestore (incluye rol)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO) {
      setLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, nombre) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (nombre) await updateProfile(cred.user, { displayName: nombre });
    await createUserProfile(cred.user.uid, { email, nombre, rol: ROLES.CLIENTE });
    return cred;
  };

  const logout = () => signOut(auth);

  const isAdmin = profile?.rol === ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, login, register, logout, demoMode: DEMO }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export default AuthContext;
