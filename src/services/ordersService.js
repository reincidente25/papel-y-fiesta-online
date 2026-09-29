// src/services/ordersService.js
import {
  collection, doc, getDocs, addDoc, updateDoc,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_ORDERS } from '../data/mockManagement';

const COL = 'pedidos';
const useMock = MOCK_MODE || !isFirebaseConfigured;

export async function createOrder(order) {
  if (useMock) {
    const nuevo = { id: `p-${Date.now()}`, estado: 'pendiente', creadoEn: new Date().toISOString(), ...order };
    MOCK_ORDERS.unshift(nuevo);
    return nuevo.id;
  }
  const ref = await addDoc(collection(db, COL), {
    ...order,
    estado: 'pendiente',
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrders() {
  if (useMock) return [...MOCK_ORDERS];
  const snap = await getDocs(query(collection(db, COL), orderBy('creadoEn', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrderById(id) {
  if (useMock) return MOCK_ORDERS.find((o) => o.id === id) || null;
  const snap = await getDocs(query(collection(db, COL), where('__name__', '==', id)));
  return snap.docs.length ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
}

export async function getOrdersByUser(uid) {
  if (useMock) return MOCK_ORDERS.filter((o) => o.usuarioId === uid);
  const snap = await getDocs(query(collection(db, COL), where('usuarioId', '==', uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(id, estado) {
  if (useMock) {
    const i = MOCK_ORDERS.findIndex((o) => o.id === id);
    if (i >= 0) MOCK_ORDERS[i] = { ...MOCK_ORDERS[i], estado };
    return;
  }
  await updateDoc(doc(db, COL, id), { estado, actualizadoEn: serverTimestamp() });
}
