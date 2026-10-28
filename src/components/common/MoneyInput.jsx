// src/components/common/MoneyInput.jsx
// Campo de dinero con símbolo $ y separadores de miles (formato argentino:
// punto para miles, coma para decimales). Expone el valor numérico por onChange.
import { useState, useEffect } from 'react';

// "1020.5" -> "1.020,5"
const toDisplay = (num) => {
  if (num === '' || num === null || num === undefined || Number.isNaN(Number(num))) return '';
  const [ent, dec] = String(num).split('.');
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec !== undefined ? `${miles},${dec}` : miles;
};

// Texto tipeado -> número. Punto = miles (se ignora), coma = decimal.
const toNumber = (text) => {
  const limpio = String(text).replace(/[^\d,]/g, '');
  const [ent = '', dec] = limpio.split(',');
  const n = Number(`${ent || '0'}${dec !== undefined ? '.' + dec : ''}`);
  return Number.isNaN(n) ? 0 : n;
};

// Reformatea mientras se escribe, respetando la coma decimal en curso.
const formatText = (text) => {
  const limpio = String(text).replace(/[^\d,]/g, '');
  const partes = limpio.split(',');
  const ent = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (partes.length === 1) return ent;
  return `${ent},${partes.slice(1).join('').slice(0, 2)}`;
};

const MoneyInput = ({ value, onChange, placeholder = '0', ...rest }) => {
  const [text, setText] = useState(() => toDisplay(value));

  // Sincroniza cuando el valor externo cambia y no coincide con lo mostrado.
  useEffect(() => {
    if (toNumber(text) !== (Number(value) || 0)) setText(toDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handle = (e) => {
    const formateado = formatText(e.target.value);
    setText(formateado);
    onChange?.(toNumber(formateado));
  };

  return (
    <div className="money-input">
      <span className="money-sign">$</span>
      <input className="input" type="text" inputMode="decimal"
        value={text} onChange={handle} placeholder={placeholder} {...rest} />
    </div>
  );
};

export default MoneyInput;
