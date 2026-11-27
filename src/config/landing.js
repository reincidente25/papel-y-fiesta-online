// src/config/landing.js
// Configuración de la portada (landing). Editá esto antes de cada deploy.
//
// IMAGEN DEL HERO:
//   - Poné tu foto en la carpeta `public/` del proyecto, con el nombre `hero.jpg`.
//     Ruta final del archivo: public/hero.jpg
//   - Para usar otro nombre/carpeta, cambiá `heroImagen` abajo (ej. '/fotos/portada.jpg').
//   - Dejalo en '' (vacío) para usar el degradado de marca, sin imagen.
export const LANDING = {
  heroImagen: '/hero.jpg',
  heroPos: 'center', // alineación vertical de la imagen: 'top' | 'center' | 'bottom'

  heroEyebrow: 'Librería · Juguetería didáctica · Regalería · Cotillón',
  heroTitulo: 'Todo para crear, celebrar y regalar.',
  heroSubtitulo: 'Descubrí productos que inspiran tu creatividad, acompañan tu día a día y hacen especial cada momento.',
  ctaTexto: 'Explorá nuestra tienda',
  ctaLink: '/catalogo',
  heroNota: 'Envíos a todo el país',
};
