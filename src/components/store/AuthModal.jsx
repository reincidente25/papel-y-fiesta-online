// src/components/store/AuthModal.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Brand from '../common/Brand';
import '../../pages/auth/auth.css';

const AuthModal = ({ open, mode = 'login', onClose }) => {
  const { login, register, resetPassword, demoMode } = useAuth();
  const [tab, setTab] = useState(mode);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Al abrir, respetar la pestaña pedida y limpiar el estado.
  useEffect(() => {
    if (open) { setTab(mode); setError(''); setInfo(''); setForm({ nombre: '', email: '', password: '', confirm: '' }); }
  }, [open, mode]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const switchTab = (t) => { setTab(t); setError(''); setInfo(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (demoMode) { setError('Conectá Firebase (.env) para usar la autenticación real.'); return; }

    if (tab === 'register') {
      if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
      if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    }

    setLoading(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.email, form.password, form.nombre);
      onClose();
    } catch (err) {
      setError(mapError(err, tab));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(''); setInfo('');
    if (!form.email) { setError('Ingresá tu email para recuperar la contraseña.'); return; }
    if (demoMode) { setError('Conectá Firebase para enviar el mail de recupero.'); return; }
    try {
      await resetPassword(form.email);
      setInfo('Te enviamos un mail para restablecer la contraseña.');
    } catch {
      setError('No pudimos enviar el mail. Revisá el email ingresado.');
    }
  };

  return (
    <div className="authm-overlay" onClick={onClose}>
      <div className="authm" onClick={(e) => e.stopPropagation()}>
        <button className="authm-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="authm-brand"><Brand size="1.5rem" /></div>

        <div className="authm-tabs">
          <button className={`authm-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Ingresar</button>
          <button className={`authm-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>Crear cuenta</button>
        </div>

        {demoMode && <div className="demo-hint">Modo sin backend: la autenticación se activa al cargar tus credenciales de Firebase.</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'register' && (
            <div className="field">
              <label>Nombre</label>
              <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Tu nombre" required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="tu@email.com" required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" required />
          </div>
          {tab === 'register' && (
            <div className="field">
              <label>Repetir contraseña</label>
              <input className="input" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="••••••••" required />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-ok">{info}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Procesando...' : tab === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        {tab === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button className="auth-link" onClick={handleReset}>¿Olvidaste tu contraseña?</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Traduce los códigos de error de Firebase a mensajes claros.
function mapError(err, tab) {
  const code = err?.code || '';
  if (tab === 'register' && code === 'auth/email-already-in-use') return 'Ese email ya está registrado.';
  if (code === 'auth/invalid-email') return 'El email no es válido.';
  if (code === 'auth/weak-password') return 'La contraseña es muy débil (mínimo 6 caracteres).';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Email o contraseña incorrectos.';
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Probá de nuevo en unos minutos.';
  return tab === 'login' ? 'No pudimos iniciar sesión. Intentá de nuevo.' : 'No pudimos crear la cuenta. Intentá de nuevo.';
}

export default AuthModal;
