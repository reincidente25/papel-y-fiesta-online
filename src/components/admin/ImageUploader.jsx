// src/components/admin/ImageUploader.jsx
// Vista previa + subida de fotos en un mismo bloque (del tamaño de la vista
// previa). Permite subir archivos, agregar por URL, navegar entre fotos y
// abrir un modal con todas (reordenar / eliminar). La 1ª foto es la portada.
import { useRef, useState } from 'react';
import Modal from '../common/Modal';
import { uploadProductImages } from '../../services/storageService';

const ImageUploader = ({ value = [], codigo = '', onChange }) => {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [activa, setActiva] = useState(0);
  const [galeria, setGaleria] = useState(false);
  const dragIndex = useRef(null);

  const imgs = value || [];
  const idx = Math.min(activa, Math.max(0, imgs.length - 1));
  const update = (next, nextActiva) => {
    onChange?.(next);
    if (typeof nextActiva === 'number') setActiva(nextActiva);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setError('');
    setSubiendo(true);
    try {
      const urls = await uploadProductImages(files, codigo);
      update([...imgs, ...urls], imgs.length); // muestra la primera nueva
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
    if (url && url.startsWith('http')) update([...imgs, url], imgs.length);
  };

  const remove = (i) => {
    const next = imgs.filter((_, k) => k !== i);
    update(next, Math.max(0, Math.min(idx, next.length - 1)));
  };

  const move = (dir) => {
    if (imgs.length < 2) return;
    setActiva((a) => (a + dir + imgs.length) % imgs.length);
  };

  const onDrop = (to) => {
    const from = dragIndex.current;
    if (from === null || from === to) return;
    const next = [...imgs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragIndex.current = null;
    update(next, to);
  };

  const pick = () => inputRef.current?.click();
  const hay = imgs.length > 0;
  const actual = imgs[idx];

  return (
    <div className="uploader">
      {/* Área principal (tamaño de la vista previa) */}
      <div className="up-main">
        {hay ? (
          <>
            <img src={actual} alt={`Foto ${idx + 1}`} onError={(e) => { e.target.style.opacity = '.3'; }} />
            {idx === 0 && <span className="up-cover">Portada</span>}
            <span className="up-count">{idx + 1} / {imgs.length}</span>

            {imgs.length > 1 && (
              <>
                <button type="button" className="up-nav left" title="Anterior" onClick={() => move(-1)}>‹</button>
                <button type="button" className="up-nav right" title="Siguiente" onClick={() => move(1)}>›</button>
              </>
            )}

            <div className="up-actions-over">
              <button type="button" title="Ver todas" onClick={() => setGaleria(true)}>⤢</button>
              <button type="button" title="Quitar esta foto" onClick={() => remove(idx)}>🗑</button>
            </div>
          </>
        ) : (
          <button type="button" className="up-empty" onClick={pick} disabled={subiendo}>
            <span className="up-empty-ico">{subiendo ? '⏳' : '📷'}</span>
            {subiendo ? 'Subiendo…' : 'Subí fotos del producto'}
          </button>
        )}
      </div>

      {/* Tira de miniaturas */}
      {imgs.length > 1 && (
        <div className="up-strip">
          {imgs.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className={`up-thumb ${i === idx ? 'active' : ''}`}
              onClick={() => setActiva(i)}
            >
              <img src={url} alt={`Mini ${i + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="up-buttons">
        <button type="button" className="btn btn-soft btn-sm" onClick={pick} disabled={subiendo}>
          {subiendo ? 'Subiendo…' : '＋ Subir fotos'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addUrl}>🔗 Por URL</button>
        {imgs.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGaleria(true)}>Ver todas ({imgs.length})</button>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />

      {error && <p className="hint" style={{ color: 'var(--danger)' }}>{error}</p>}

      {/* Modal galería: reordenar (arrastrar) y eliminar */}
      <Modal open={galeria} onClose={() => setGaleria(false)} title="Fotos del producto" width={720}>
        <p className="hint" style={{ marginBottom: 14 }}>Arrastrá para reordenar. La primera es la portada.</p>
        <div className="up-gallery">
          {imgs.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`up-gthumb ${i === 0 ? 'is-cover' : ''}`}
              draggable
              onDragStart={() => { dragIndex.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
            >
              <img src={url} alt={`Foto ${i + 1}`} />
              {i === 0 && <span className="up-cover">Portada</span>}
              <button type="button" className="thumb-del" title="Quitar" onClick={() => remove(i)}>×</button>
            </div>
          ))}
          <button type="button" className="up-gadd" onClick={pick} disabled={subiendo}>
            {subiendo ? '⏳' : '＋'}<small>Agregar</small>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ImageUploader;
