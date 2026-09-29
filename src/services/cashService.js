// src/services/cashService.js
// Mockup en memoria. TODO backend: colecciones `cajaSesiones` y `cajaMovimientos`.
import { MOCK_CASH_MOVEMENTS, MOCK_CASH_SESSION } from '../data/mockManagement';
import { CASH_TYPES, PAYMENT_METHODS } from '../constants';

let session = { ...MOCK_CASH_SESSION };

export async function getCashSession() {
  return { ...session };
}

export async function getCashMovements() {
  return [...MOCK_CASH_MOVEMENTS].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// Saldo en efectivo (lo que afecta la caja física)
export async function getCashBalance() {
  return MOCK_CASH_MOVEMENTS
    .filter((m) => PAYMENT_METHODS[m.metodoPago]?.afectaCaja)
    .reduce((acc, m) => acc + (CASH_TYPES[m.tipo]?.signo || 1) * m.monto, 0);
}

export async function addCashMovement(mov) {
  const nuevo = { id: `m-${Date.now()}`, fecha: new Date().toISOString(), ...mov };
  MOCK_CASH_MOVEMENTS.push(nuevo);
  return nuevo.id;
}

export async function openCashSession(montoInicial) {
  session = { id: `caja-${Date.now()}`, estado: 'abierta', aperturaFecha: new Date().toISOString(), montoInicial: Number(montoInicial) || 0, cierreFecha: null, montoFinal: null };
  await addCashMovement({ tipo: 'ingreso', concepto: 'Apertura de caja', metodoPago: 'efectivo', monto: Number(montoInicial) || 0 });
  return session;
}

export async function closeCashSession(montoFinal) {
  session = { ...session, estado: 'cerrada', cierreFecha: new Date().toISOString(), montoFinal: Number(montoFinal) || 0 };
  return session;
}
