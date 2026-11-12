// src/services/popupService.js
// Popup promocional de la landing, gestionable desde el panel (config/popup).
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const COL = 'config';
const DOC = 'popup';

export const POPUP_DEFAULT = {
  activo: false,
  titulo: '',
  texto: '',
  imagen: '',
  ctaTexto: 'Ver más',
  ctaLink: '/catalogo',
  textoColor: 'blanco', // 'blanco' | 'negro' (color del texto sobre la imagen)
  ver: 0,
};

export async function getPopup() {
  if (!isFirebaseConfigured) return { ...POPUP_DEFAULT };
  try {
    const snap = await getDoc(doc(db, COL, DOC));
    return snap.exists() ? { ...POPUP_DEFAULT, ...snap.data() } : { ...POPUP_DEFAULT };
  } catch {
    return { ...POPUP_DEFAULT };
  }
}

export async function savePopup(data) {
  const payload = { ...data, ver: Date.now() };
  if (isFirebaseConfigured) {
    await setDoc(doc(db, COL, DOC), payload, { merge: true });
  }
  return payload;
}
