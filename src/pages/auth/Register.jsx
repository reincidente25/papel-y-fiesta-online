// src/pages/auth/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Brand from '../../components/common/Brand';
import './auth.css';

const Register = () => {
  const { register, demoMode } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (demoMode) {
      navigate('/');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, nombre);
      navigate('/');
    } catch (err) {
      setError(
        err?.code === 'auth/email-already-in-use'
          ? 'Ese email ya está registrado.'
          : 'No pudimos crear la cuenta. Intentá de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><Brand size="1.8rem" /></div>
        <p className="auth-sub">Creá tu cuenta</p>

        {demoMode && <div className="demo-hint">Modo demo: el registro está simulado.</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre" required={!demoMode} />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" required={!demoMode} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" required={!demoMode} />
          </div>
          <div className="field">
            <label>Repetir contraseña</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" required={!demoMode} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-foot">¿Ya tenés cuenta? <Link to="/login">Ingresá</Link></p>
        <Link to="/" className="auth-back">← Volver a la tienda</Link>
      </div>
    </div>
  );
};

export default Register;
