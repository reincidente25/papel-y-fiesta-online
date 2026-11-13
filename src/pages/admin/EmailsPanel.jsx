// src/pages/admin/EmailsPanel.jsx
// Administra los correos: activar/desactivar cada uno y editar asunto/texto.
import { useEffect, useState } from 'react';
import Loader from '../../components/common/Loader';
import { getEmailsConfig, saveEmailsConfig, EMAIL_CATALOG } from '../../services/emailsService';

const EmailsPanel = () => {
  const [cfg, setCfg] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => { getEmailsConfig().then(setCfg).finally(() => setLoading(false)); }, []);

  const get = (code) => cfg[code] || {};
  const set = (code, k, v) => setCfg((c) => ({ ...c, [code]: { ...c[code], [k]: v } }));

  const guardar = async () => {
    setSaving(true); setOk(false);
    try { await saveEmailsConfig(cfg); setOk(true); setTimeout(() => setOk(false), 2500); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <p className="hint" style={{ marginBottom: 16 }}>
        Activá o desactivá cada correo. El contenido y el diseño se manejan desde el código; acá solo elegís cuáles se envían.
      </p>

      {EMAIL_CATALOG.map((g) => (
        <div key={g.grupo} style={{ marginBottom: 22 }}>
          <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: 12 }}>{g.grupo}</h3>
          <div className="mail-list">
            {g.items.map((it) => {
              const o = get(it.code);
              const activo = o.activo !== false;
              return (
                <div className={`mail-card ${!activo ? 'is-off' : ''}`} key={it.code}>
                  <div className="mail-card-head">
                    <strong>{it.nombre}</strong>
                    <label className="switch mail-switch">
                      <input type="checkbox" checked={activo} onChange={(e) => set(it.code, 'activo', e.target.checked)} />
                      <span className="track" /><span className="switch-label">{activo ? 'Activo' : 'Desactivado'}</span>
                    </label>
                  </div>
                  <p className="hint" style={{ margin: 0 }}>Asunto: {it.asunto}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="form-actions" style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', paddingTop: 10 }}>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando…' : 'Guardar correos'}</button>
        {ok && <span className="save-ok" style={{ alignSelf: 'center' }}>✓ Guardado</span>}
      </div>
    </div>
  );
};

export default EmailsPanel;
