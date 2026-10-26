// src/components/admin/ImageUploader.jsx
// Subida de múltiples fotos a Firebase Storage con reordenamiento (drag) y
// agregado por URL. Devuelve un array de URLs; la primera es la portada.
import { useRef, useState } from 'react';
import { uploadProductImages } from '../../services/storageService';

const ImageUploader = ({ value = [], codigo = '', onChange }) => {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const dragIndex = useRef(null);

  const imgs = value || [];
  const update = (next) => onChange?.(next);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setError('');
    setSubiendo(true);
    try {
      const urls = await uploadProductImages(files, codigo);
      update([...imgs, ...urls]);
    } catch (e) {
      setError('No se pudieron subir las imágenes. Revisá tu conexión o permisos de Storage.');
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubiendo(false);
    }
  };

  const addUrl = () => {
    const url = window.prompt('Pegá la URL de la imagen:', 'https://');
    if (url && url.startsWith('http')) update([...imgs, url]);
  };

  const remove = (i) => update(imgs.filter((_, idx) => idx !== i));

  const onDrop = (to) => {
    const from = dragIndex.current;
    if (from === null || from === to) return;
    const next = [...imgs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragIndex.current = null;
    update(next);
  };

  return (
    <div className="uploader">
      <div className="uploader-grid">
        {imgs.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className={`uploader-thumb ${i === 0 ? 'is-cover' : ''}`}
            draggable
            onDragStart={() => { dragIndex.current = i; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            <img src={url} alt={`Foto ${i + 1}`} onError={(e) => { e.target.style.opacity = '.3'; }} />
            {i === 0 && <span className="cover-badge">Portada</span>}
            <button type="button" className="thumb-del" title="Quitar" onClick={() => remove(i)}>×</button>
          </div>
        ))}

        <button type="button" className="uploader-add" onClick={() => inputRef.current?.click()} disabled={subiendo}>
          {subiendo ? '⏳' : '＋'}<small>{subiendo ? 'Subiendo…' : 'Agregar fotos'}</small>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      <div className="row gap-8" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addUrl}>🔗 Agregar por URL</button>
        {imgs.length > 1 && <span className="hint">{imgs.length} fotos · la 1ª es la portada</span>}
      </div>

      {error && <p className="hint" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
};

export default ImageUploader;
