// src/pages/Construccion.jsx
// Landing de "Web en construcción": muestra solo un login (sin registro).
// Al autenticarse, el AuthProvider actualiza el usuario y el sitio se habilita.
import { useState } from 'react';
import Brand from '../components/common/Brand';
import { useAuth } from '../context/AuthContext';
import './construccion.css';

const Construccion = () => {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setCargando(true);
    try {
      await login(email.trim(), pass);
      // El AuthProvider detecta la sesión y habilita el sitio.
    } catch {
      setError('Email o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  const recuperar = async () => {
    if (!email.trim()) { setError('Ingresá tu email para recuperar la contraseña.'); return; }
    setError(''); setMsg('');
    try { await resetPassword(email.trim()); setMsg('Te enviamos un email para restablecer la contraseña.'); }
    catch { setError('No pudimos enviar el email. Revisá la dirección.'); }
  };

  return (
    <div className="constr">
      <div className="constr-card">
        <Brand size="1.8rem" />
        <span className="constr-badge">🚧 Sitio en construcción</span>
        <h1>Estamos preparando algo lindo 🎉</h1>
        <p className="constr-sub">Muy pronto vas a poder comprar online toda nuestra librería, cotillón y regalería. ¡Volvé en unos días!</p>

        <form className="constr-form" onSubmit={entrar}>
          <div className="constr-formtitle">Acceso</div>
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <input className="input" type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} required autoComplete="current-password" />
          {error && <p className="constr-error">{error}</p>}
          {msg && <p className="constr-ok">{msg}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
          <button type="button" className="constr-link" onClick={recuperar}>¿Olvidaste tu contraseña?</button>
        </form>
      </div>
    </div>
  );
};

export default Construccion;
