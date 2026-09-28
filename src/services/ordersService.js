// src/services/ordersService.js
import {
  collection, doc, getDocs, addDoc, updateDoc,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const COL = 'pedidos';

export async function createOrder(order) {
  if (!isFirebaseConfigured) {
    // eslint-disable-next-line no-console
    console.info('[demo] Pedido simulado:', order);
    return `demo-order-${Date.now()}`;
  }
  const ref = await addDoc(collection(db, COL), {
    ...order,
    estado: 'pendiente',
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrders() {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(db, COL), orderBy('creadoEn', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrdersByUser(uid) {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(db, COL), where('usuarioId', '==', uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(id, estado) {
  if (!isFirebaseConfigured) return;
  await updateDoc(doc(db, COL, id), { estado, actualizadoEn: serverTimestamp() });
}
