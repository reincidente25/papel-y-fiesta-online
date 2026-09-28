// src/components/common/Brand.jsx
// Logo textual reutilizable con la paleta de la marca.
const Brand = ({ size = '1.35rem' }) => (
  <span className="brand" style={{ fontSize: size }}>
    <span className="b-papel">Papel</span>
    <span className="b-amp">&amp;</span>
    <span className="b-fiesta">Fiesta</span>
  </span>
);

export default Brand;
