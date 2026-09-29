// src/services/suppliersService.js
// Mockup: opera sobre datos en memoria. TODO backend: migrar a Firestore (colección `proveedores`).
import { MOCK_SUPPLIERS } from '../data/mockManagement';

const uid = () => `prov-${Date.now()}`;

export async function getSuppliers() {
  return [...MOCK_SUPPLIERS];
}

export async function createSupplier(data) {
  const nuevo = { id: uid(), ...data };
  MOCK_SUPPLIERS.push(nuevo);
  return nuevo.id;
}

export async function updateSupplier(id, data) {
  const i = MOCK_SUPPLIERS.findIndex((s) => s.id === id);
  if (i >= 0) MOCK_SUPPLIERS[i] = { ...MOCK_SUPPLIERS[i], ...data };
}

export async function deleteSupplier(id) {
  const i = MOCK_SUPPLIERS.findIndex((s) => s.id === id);
  if (i >= 0) MOCK_SUPPLIERS.splice(i, 1);
}
