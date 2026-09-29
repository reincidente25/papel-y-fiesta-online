// src/services/customersService.js
// Mockup en memoria. TODO backend: colección `clientes`.
import { MOCK_CUSTOMERS } from '../data/mockManagement';

export async function getCustomers() {
  return [...MOCK_CUSTOMERS];
}

export async function createCustomer(data) {
  const nuevo = { id: `cli-${Date.now()}`, saldoCtaCte: 0, ...data };
  MOCK_CUSTOMERS.push(nuevo);
  return nuevo.id;
}

export async function updateCustomer(id, data) {
  const i = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
  if (i >= 0) MOCK_CUSTOMERS[i] = { ...MOCK_CUSTOMERS[i], ...data };
}

export async function deleteCustomer(id) {
  const i = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
  if (i >= 0) MOCK_CUSTOMERS.splice(i, 1);
}
