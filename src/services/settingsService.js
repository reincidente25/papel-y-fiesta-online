// src/services/settingsService.js
// Configuración editable de la tienda (ej. el hero de la landing).
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const COL = 'config';
const DOC = 'home';

export const HOME_DEFAULT = {
  heroEyebrow: 'Librería · Cotillón · Regalería',
  heroTitulo: 'Todo para tu día a día, tus festejos y tus regalos',
  heroSubtitulo: 'Útiles escolares, oficina, arte, cotillón para tu próxima fiesta y regalería para sorprender. Envíos a todo el país.',
  ctaTexto: 'Ver catálogo',
  ctaLink: '/catalogo',
  heroImagen: '',
  heroPos: 'center', // alineación vertical de la imagen: top | center | bottom
};

export async function getHomeConfig() {
  if (!isFirebaseConfigured) return { ...HOME_DEFAULT };
  try {
    const snap = await getDoc(doc(db, COL, DOC));
    return snap.exists() ? { ...HOME_DEFAULT, ...snap.data() } : { ...HOME_DEFAULT };
  } catch {
    return { ...HOME_DEFAULT };
  }
}

export async function saveHomeConfig(data) {
  if (!isFirebaseConfigured) return { ...HOME_DEFAULT, ...data };
  await setDoc(doc(db, COL, DOC), { ...data, actualizadoEn: serverTimestamp() }, { merge: true });
  return data;
}
