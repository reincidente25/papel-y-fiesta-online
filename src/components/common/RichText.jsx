// src/components/common/RichText.jsx
// Editor de texto enriquecido liviano (sin dependencias). Guarda HTML simple:
// negrita, cursiva, subrayado, listas con viñetas / numeradas y enlaces.
import { useEffect, useRef } from 'react';

const TOOLS = [
  { cmd: 'bold', label: 'B', title: 'Negrita', style: { fontWeight: 800 } },
  { cmd: 'italic', label: 'I', title: 'Cursiva', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'U', title: 'Subrayado', style: { textDecoration: 'underline' } },
  { cmd: 'insertUnorderedList', label: '• Lista', title: 'Viñetas' },
  { cmd: 'insertOrderedList', label: '1. Lista', title: 'Numerada' },
];

const RichText = ({ value = '', onChange, placeholder = '' }) => {
  const ref = useRef(null);

  // Sincroniza el HTML entrante solo cuando difiere (evita romper el cursor).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const emit = () => onChange?.(ref.current?.innerHTML || '');

  const exec = (cmd) => {
    ref.current?.focus();
    if (cmd === 'createLink') {
      const url = window.prompt('URL del enlace:', 'https://');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    emit();
  };

  const empty = !value || value === '<br>';

  return (
    <div className="rte">
      <div className="rte-toolbar">
        {TOOLS.map((t) => (
          <button key={t.cmd} type="button" className="rte-btn" title={t.title}
            style={t.style} onMouseDown={(e) => { e.preventDefault(); exec(t.cmd); }}>
            {t.label}
          </button>
        ))}
        <button type="button" className="rte-btn" title="Enlace"
          onMouseDown={(e) => { e.preventDefault(); exec('createLink'); }}>🔗</button>
        <button type="button" className="rte-btn" title="Quitar formato"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}>⨯</button>
      </div>
      <div className="rte-area" data-ph={empty ? placeholder : ''}>
        <div
          ref={ref}
          className="rte-input"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
        />
      </div>
    </div>
  );
};

export default RichText;
