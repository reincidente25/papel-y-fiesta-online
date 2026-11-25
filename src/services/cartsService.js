// src/services/cartsService.js
// Carritos persistidos por usuario en Firestore (carritos/{uid}).
// Estados: 'activo' (en uso), 'abandonado' (marcado por la función programada),
// 'contactado' | 'recuperado' | 'descartado' (gestión), 'convertido' (se hizo pedido).
import { collection, doc, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_ABANDONED_CARTS } from '../data/mockManagement';

const COL = 'carritos';
const useMock = !isFirebaseConfigured;

const ms = (f) => {
  if (!f) return 0;
  if (typeof f === 'string') return new Date(f).getTime();
  if (f.seconds) return f.seconds * 1000;
  if (f.toMillis) return f.toMillis();
  return 0;
};

// Guarda/actualiza el carrito del usuario (lo deja 'activo').
export async function saveCart(uid, data) {
  if (!uid || useMock) return;
  try {
    await setDoc(doc(db, COL, uid), { ...data, estado: 'activo', actualizadoEn: serverTimestamp() }, { merge: true });
  } catch { /* ignore */ }
}

// Marca el carrito como convertido (se concretó el pedido).
export async function markCartConverted(uid) {
  if (!uid || useMock) return;
  try { await setDoc(doc(db, COL, uid), { estado: 'convertido', items: [], actualizadoEn: serverTimestamp() }, { merge: true }); }
  catch { /* ignore */ }
}

// Lista los carritos para gestionar (excluye activos/convertidos y vacíos).
export async function getAbandonedCarts() {
  if (useMock) return [...MOCK_ABANDONED_CARTS].sort((a, b) => ms(b.actualizadoEn) - ms(a.actualizadoEn));
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => (c.items?.length || 0) > 0 && !['activo', 'convertido'].includes(c.estado))
    .sort((a, b) => ms(b.actualizadoEn) - ms(a.actualizadoEn));
}

// Cantidad de carritos abandonados nuevos (sin gestionar) → para el badge del menú.
export async function getAbandonedCount() {
  if (useMock) return MOCK_ABANDONED_CARTS.filter((c) => c.estado === 'abierto' || c.estado === 'abandonado').length;
  try {
    const list = await getAbandonedCarts();
    return list.filter((c) => c.estado === 'abandonado').length;
  } catch { return 0; }
}

export async function updateCartStatus(id, estado) {
  if (useMock) {
    const i = MOCK_ABANDONED_CARTS.findIndex((c) => c.id === id);
    if (i >= 0) MOCK_ABANDONED_CARTS[i] = { ...MOCK_ABANDONED_CARTS[i], estado };
    return;
  }
  await updateDoc(doc(db, COL, id), { estado });
}
