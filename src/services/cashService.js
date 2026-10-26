// src/services/cashService.js
// Caja por turno: apertura (fondo inicial) y cierre. El saldo y los totales se
// derivan de las ventas y compras ocurridas durante el turno abierto.
import {
  collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy, limit,
  serverTimestamp, Timestamp, getAggregateFromServer, sum,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_SALES, MOCK_PURCHASES } from '../data/mockManagement';

const COL = 'cajaSesiones';
const useMock = MOCK_MODE || !isFirebaseConfigured;

let mockSession = null; // turno en memoria (modo mock)

export async function getCajaActual() {
  if (useMock) return mockSession;
  const snap = await getDocs(query(collection(db, COL), where('estado', '==', 'abierta'), orderBy('aperturaFecha', 'desc'), limit(1)));
  return snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
}

export async function abrirCaja(fondoInicial) {
  const base = { estado: 'abierta', fondoInicial: Number(fondoInicial) || 0, cierreFecha: null };
  if (useMock) {
    mockSession = { id: `caja-${Date.now()}`, aperturaFecha: new Date().toISOString(), ...base };
    return mockSession;
  }
  const ref = await addDoc(collection(db, COL), { ...base, aperturaFecha: serverTimestamp() });
  return { id: ref.id, ...base };
}

export async function cerrarCaja(id, { montoFinal, totales } = {}) {
  if (useMock) {
    const s = mockSession ? { ...mockSession, estado: 'cerrada', cierreFecha: new Date().toISOString(), montoFinal: Number(montoFinal) || 0, totales } : null;
    mockSession = null;
    return s;
  }
  await updateDoc(doc(db, COL, id), { estado: 'cerrada', cierreFecha: serverTimestamp(), montoFinal: Number(montoFinal) || 0, totales: totales || {} });
}

const toJs = (v) => (v?.toDate ? v.toDate() : (v ? new Date(v) : null));

// Saldo rápido de la caja actual (para el Dashboard).
export async function getCajaSaldo() {
  const caja = await getCajaActual();
  if (!caja) return 0;
  const desde = toJs(caja.aperturaFecha);
  if (useMock) {
    const inRange = (arr) => arr.filter((x) => toJs(x.fecha) >= desde).reduce((n, x) => n + (x.total || 0), 0);
    return (caja.fondoInicial || 0) + inRange(MOCK_SALES) - inRange(MOCK_PURCHASES);
  }
  const [sV, sC] = await Promise.all([
    getAggregateFromServer(query(collection(db, 'ventas'), where('fecha', '>=', Timestamp.fromDate(desde))), { total: sum('total') }),
    getAggregateFromServer(query(collection(db, 'compras'), where('fecha', '>=', Timestamp.fromDate(desde))), { total: sum('total') }),
  ]);
  return (caja.fondoInicial || 0) + (sV.data().total || 0) - (sC.data().total || 0);
}
