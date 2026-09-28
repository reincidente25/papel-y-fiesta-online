// src/pages/auth/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Brand from '../../components/common/Brand';
import './auth.css';

const Login = () => {
  const { login, demoMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (demoMode) {
      navigate('/');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><Brand size="1.8rem" /></div>
        <p className="auth-sub">Ingresá a tu cuenta</p>

        {demoMode && <div className="demo-hint">Modo demo: podés entrar sin credenciales.</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required={!demoMode} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required={!demoMode} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-foot">¿No tenés cuenta? <Link to="/registro">Registrate</Link></p>
        <Link to="/" className="auth-back">← Volver a la tienda</Link>
      </div>
    </div>
  );
};

export default Login;
