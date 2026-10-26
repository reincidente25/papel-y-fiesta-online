// src/services/suppliersService.js
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_SUPPLIERS } from '../data/mockManagement';

const COL = 'proveedores';
const useMock = MOCK_MODE || !isFirebaseConfigured;

export async function getSuppliers() {
  if (useMock) return [...MOCK_SUPPLIERS];
  const snap = await getDocs(query(collection(db, COL), orderBy('nombre')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createSupplier(data) {
  const payload = { estado: 'activo', ...data };
  if (useMock) {
    const nuevo = { id: `prov-${Date.now()}`, ...payload };
    MOCK_SUPPLIERS.push(nuevo);
    return nuevo.id;
  }
  const ref = await addDoc(collection(db, COL), { ...payload, creado: serverTimestamp() });
  return ref.id;
}

export async function updateSupplier(id, data) {
  if (useMock) {
    const i = MOCK_SUPPLIERS.findIndex((s) => s.id === id);
    if (i >= 0) MOCK_SUPPLIERS[i] = { ...MOCK_SUPPLIERS[i], ...data };
    return;
  }
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteSupplier(id) {
  if (useMock) {
    const i = MOCK_SUPPLIERS.findIndex((s) => s.id === id);
    if (i >= 0) MOCK_SUPPLIERS.splice(i, 1);
    return;
  }
  await deleteDoc(doc(db, COL, id));
}
