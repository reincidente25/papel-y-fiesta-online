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

  heroEyebrow: 'Librería · Cotillón · Regalería',
  heroTitulo: 'Todo para tu día a día, tus festejos y tus regalos',
  heroSubtitulo: 'Útiles escolares, oficina, arte, cotillón para tu próxima fiesta y regalería para sorprender. Envíos a todo el país.',
  ctaTexto: 'Ver catálogo',
  ctaLink: '/catalogo',
};
