// src/services/customersService.js
// Clientes = clientes locales (alta en mostrador, colección `clientes`) +
// usuarios registrados en la web (`usuarios` con rol cliente). El ABM solo
// opera sobre los clientes locales; los de la web se leen (los gestiona el
// propio usuario desde su perfil).
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_CUSTOMERS } from '../data/mockManagement';
import { ROLES } from '../constants';

const COL = 'clientes';
const useMock = MOCK_MODE || !isFirebaseConfigured;

const nombreCompleto = (u) =>
  [u.nombre, u.apellido].filter(Boolean).join(' ') || u.nombre || u.email || 'Sin nombre';

export async function getCustomers() {
  if (useMock) return MOCK_CUSTOMERS.map((c) => ({ origen: 'local', ...c }));

  const [locSnap, webSnap] = await Promise.all([
    getDocs(collection(db, COL)),
    getDocs(query(collection(db, 'usuarios'), where('rol', '==', ROLES.CLIENTE))),
  ]);

  const locales = locSnap.docs.map((d) => ({
    id: d.id, origen: 'local', tipo: 'minorista', saldoCtaCte: 0, ...d.data(),
  }));

  const web = webSnap.docs.map((d) => {
    const u = d.data();
    return {
      id: d.id, origen: 'web',
      nombre: nombreCompleto(u),
      email: u.email || '',
      telefono: u.whatsapp || u.telefono || '',
      dni: u.dni || '',
      tipo: 'minorista', saldoCtaCte: 0,
      domicilios: u.domicilios || [],
    };
  });

  return [...locales, ...web].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
}

// ABM: siempre sobre clientes LOCALES.
export async function createCustomer(data) {
  if (useMock) {
    const nuevo = { id: `cli-${Date.now()}`, origen: 'local', saldoCtaCte: 0, ...data };
    MOCK_CUSTOMERS.push(nuevo);
    return nuevo.id;
  }
  const ref = await addDoc(collection(db, COL), { ...data, creadoEn: serverTimestamp() });
  return ref.id;
}

export async function updateCustomer(id, data) {
  if (useMock) {
    const i = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
    if (i >= 0) MOCK_CUSTOMERS[i] = { ...MOCK_CUSTOMERS[i], ...data };
    return;
  }
  await updateDoc(doc(db, COL, id), { ...data, actualizadoEn: serverTimestamp() });
}

export async function deleteCustomer(id) {
  if (useMock) {
    const i = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
    if (i >= 0) MOCK_CUSTOMERS.splice(i, 1);
    return;
  }
  await deleteDoc(doc(db, COL, id));
}
