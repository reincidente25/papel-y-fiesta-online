// src/services/purchasesService.js
import {
  collection, getDocs, addDoc, query, orderBy, serverTimestamp,
  limit, startAfter, where, Timestamp, getCountFromServer, getAggregateFromServer, sum,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_PURCHASES } from '../data/mockManagement';
import { getProducts, updateProduct } from './productsService';

const COL = 'compras';
const useMock = MOCK_MODE || !isFirebaseConfigured;

export async function getPurchases() {
  if (useMock) return [...MOCK_PURCHASES].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const snap = await getDocs(query(collection(db, COL), orderBy('fecha', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPurchasesPage({ pageSize = 20, cursor = null } = {}) {
  if (useMock) {
    const all = [...MOCK_PURCHASES].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const start = cursor || 0;
    return { items: all.slice(start, start + pageSize), cursor: start + pageSize, hasMore: start + pageSize < all.length };
  }
  const col = collection(db, COL);
  const q = cursor
    ? query(col, orderBy('fecha', 'desc'), startAfter(cursor), limit(pageSize))
    : query(col, orderBy('fecha', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  };
}

// Compras dentro de un rango de fechas (para la caja por turno).
export async function getPurchasesBetween(desde, hasta = null) {
  if (useMock) {
    const d = (c) => (c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha));
    return MOCK_PURCHASES
      .filter((c) => { const x = d(c); return x >= desde && (!hasta || x <= hasta); })
      .sort((a, b) => d(b) - d(a));
  }
  const col = collection(db, COL);
  const parts = [where('fecha', '>=', Timestamp.fromDate(desde))];
  if (hasta) parts.push(where('fecha', '<=', Timestamp.fromDate(hasta)));
  const snap = await getDocs(query(col, ...parts, orderBy('fecha', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPurchasesStats() {
  const CANCELADAS = ['cancelada', 'cancelado'];
  if (useMock) {
    const hoy = new Date().toDateString();
    const now = new Date();
    const d = (c) => (c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha));
    const delDia = MOCK_PURCHASES.filter((c) => d(c).toDateString() === hoy);
    const delMes = MOCK_PURCHASES.filter((c) => d(c).getMonth() === now.getMonth() && d(c).getFullYear() === now.getFullYear());
    return {
      comprasHoy: delDia.length,
      totalHoy: delDia.reduce((n, c) => n + (c.total || 0), 0),
      totalMes: delMes.reduce((n, c) => n + (c.total || 0), 0),
      canceladas: MOCK_PURCHASES.filter((c) => CANCELADAS.includes(c.estado)).length,
    };
  }
  const col = collection(db, COL);
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const qHoy = query(col, where('fecha', '>=', Timestamp.fromDate(inicioHoy)));
  const qMes = query(col, where('fecha', '>=', Timestamp.fromDate(inicioMes)));
  const [cntHoy, sumHoy, sumMes, cntCanc] = await Promise.all([
    getCountFromServer(qHoy),
    getAggregateFromServer(qHoy, { total: sum('total') }),
    getAggregateFromServer(qMes, { total: sum('total') }),
    getCountFromServer(query(col, where('estado', 'in', CANCELADAS))),
  ]);
  return {
    comprasHoy: cntHoy.data().count,
    totalHoy: sumHoy.data().total || 0,
    totalMes: sumMes.data().total || 0,
    canceladas: cntCanc.data().count,
  };
}

/**
 * Registra una compra nueva: suma stock y actualiza costo de los productos,
 * y mueve caja si se pagó en efectivo.
 */
export async function createPurchase(purchase) {
  const items = (purchase.items || []).map((i) => ({
    productoId: i.productoId || '', codigo: i.codigo || '', nombre: i.nombre,
    cantidad: i.cantidad, costoUnit: i.costoUnit, subtotal: i.costoUnit * i.cantidad,
  }));
  // Con ítems, el total sale de las líneas; si no, se usa el monto total ingresado.
  const total = items.length ? items.reduce((n, i) => n + i.subtotal, 0) : (Number(purchase.total) || 0);
  const data = {
    proveedor: purchase.proveedorNombre || purchase.proveedor || '—',
    proveedorId: purchase.proveedorId || '',
    remito: purchase.remito || '', factura: purchase.factura || '',
    notas: purchase.notas || '',
    items, total, cantItems: items.reduce((n, i) => n + i.cantidad, 0),
    estado: purchase.estado || 'recibida', metodoPago: purchase.metodoPago || '',
    migrado: false,
  };

  let compraId;
  if (useMock) {
    const id = `c-${Date.now()}`;
    MOCK_PURCHASES.push({ id, compraId: id, fecha: new Date().toISOString(), ...data });
    compraId = id;
  } else {
    const ref = await addDoc(collection(db, COL), { ...data, fecha: serverTimestamp() });
    compraId = ref.id;
  }

  // Sumar stock y actualizar costo de los productos referenciados
  const productos = await getProducts();
  for (const item of items) {
    if (!item.productoId && !item.codigo) continue;
    const prod = productos.find((p) => p.id === item.productoId || p.codigo === item.codigo);
    if (prod) await updateProduct(prod.id, { stock: (prod.stock || 0) + item.cantidad, precioCosto: item.costoUnit });
  }

  return compraId;
}
