// src/components/admin/VariantImage.jsx
// Foto única para una variante. Click = subir archivo; también permite URL.
import { useRef, useState } from 'react';
import { uploadProductImage } from '../../services/storageService';

const VariantImage = ({ value = '', codigo = '', onChange }) => {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSubiendo(true);
    try {
      const url = await uploadProductImage(file, codigo);
      onChange?.(url);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubiendo(false);
    }
  };

  const addUrl = (e) => {
    e.stopPropagation();
    const url = window.prompt('URL de la imagen de la variante:', 'https://');
    if (url && url.startsWith('http')) onChange?.(url);
  };

  return (
    <div className="var-img">
      <button type="button" className="var-img-box" title="Subir foto"
        onClick={() => inputRef.current?.click()} disabled={subiendo}>
        {subiendo ? '⏳' : value ? <img src={value} alt="" /> : '📷'}
      </button>
      {value
        ? <button type="button" className="var-img-x" title="Quitar" onClick={(e) => { e.stopPropagation(); onChange?.(''); }}>×</button>
        : <button type="button" className="var-img-url" title="Por URL" onClick={addUrl}>🔗</button>}
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
};

export default VariantImage;
