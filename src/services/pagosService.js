// src/services/pagosService.js
// Datos de pago/transferencia editables desde el panel (config/pagos).
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const COL = 'config';
const DOC = 'pagos';

export const PAGOS_DEFAULT = { titular: '', banco: '', cbu: '', alias: '' };

export async function getPagos() {
  if (!isFirebaseConfigured) return { ...PAGOS_DEFAULT };
  try {
    const snap = await getDoc(doc(db, COL, DOC));
    return snap.exists() ? { ...PAGOS_DEFAULT, ...snap.data() } : { ...PAGOS_DEFAULT };
  } catch {
    return { ...PAGOS_DEFAULT };
  }
}

export async function savePagos(data) {
  if (isFirebaseConfigured) {
    await setDoc(doc(db, COL, DOC), { ...data, actualizadoEn: serverTimestamp() }, { merge: true });
  }
  return data;
}

// Texto para el mensaje de WhatsApp (omite vacíos).
export const transferenciaTexto = (p = {}) => [
  p.titular && `Titular: ${p.titular}`,
  p.banco && `Banco: ${p.banco}`,
  p.cbu && `CBU: ${p.cbu}`,
  p.alias && `Alias: ${p.alias}`,
].filter(Boolean).join('\n');
