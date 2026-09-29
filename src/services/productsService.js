// src/services/productsService.js
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_PRODUCTS } from '../data/mockProducts';

const COL = 'productos';
const useMock = MOCK_MODE || !isFirebaseConfigured;

/**
 * Capa de acceso a productos.
 * Si Firebase no está configurado, devuelve datos mock para poder
 * desarrollar la UI sin backend.
 */

export async function getProducts() {
  if (useMock) return [...MOCK_PRODUCTS];
  const snap = await getDocs(query(collection(db, COL), orderBy('nombre')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPublicProducts() {
  // Solo productos visibles en la tienda
  const all = await getProducts();
  return all.filter((p) => p.estado === 'activo' || p.estado === 'sin_stock');
}

export async function getProductById(id) {
  if (useMock) return MOCK_PRODUCTS.find((p) => p.id === id) || null;
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getFeaturedProducts() {
  const all = await getProducts();
  return all.filter((p) => p.destacado && p.estado === 'activo');
}

export async function createProduct(data) {
  if (useMock) {
    const nuevo = { id: `demo-${Date.now()}`, ...data };
    MOCK_PRODUCTS.push(nuevo);
    return nuevo.id;
  }
  const ref = await addDoc(collection(db, COL), {
    ...data,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id, data) {
  if (useMock) {
    const i = MOCK_PRODUCTS.findIndex((p) => p.id === id);
    if (i >= 0) MOCK_PRODUCTS[i] = { ...MOCK_PRODUCTS[i], ...data };
    return;
  }
  await updateDoc(doc(db, COL, id), { ...data, actualizadoEn: serverTimestamp() });
}

export async function deleteProduct(id) {
  if (useMock) {
    const i = MOCK_PRODUCTS.findIndex((p) => p.id === id);
    if (i >= 0) MOCK_PRODUCTS.splice(i, 1);
    return;
  }
  await deleteDoc(doc(db, COL, id));
}

export async function getProductsByCategory(categoria) {
  if (useMock) return MOCK_PRODUCTS.filter((p) => p.categoria === categoria);
  const snap = await getDocs(query(collection(db, COL), where('categoria', '==', categoria)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
