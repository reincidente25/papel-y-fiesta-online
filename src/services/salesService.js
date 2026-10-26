// src/services/salesService.js
import {
  collection, getDocs, addDoc, query, orderBy, serverTimestamp,
  limit, startAfter, where, Timestamp, getCountFromServer, getAggregateFromServer, sum,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_SALES } from '../data/mockManagement';
import { PAYMENT_METHODS } from '../constants';
import { getProducts, updateProduct } from './productsService';
import { addCashMovement } from './cashService';

const COL = 'ventas';
const useMock = MOCK_MODE || !isFirebaseConfigured;

export async function getSales() {
  if (useMock) return [...MOCK_SALES].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const snap = await getDocs(query(collection(db, COL), orderBy('fecha', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Página de ventas (orden por fecha desc). `cursor` es el último doc de la
// página anterior (o un índice, en mock). Devuelve { items, cursor, hasMore }.
export async function getSalesPage({ pageSize = 20, cursor = null } = {}) {
  if (useMock) {
    const all = [...MOCK_SALES].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const start = cursor || 0;
    const items = all.slice(start, start + pageSize);
    const next = start + pageSize;
    return { items, cursor: next, hasMore: next < all.length };
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

// KPIs exactos sin traer todo (agregaciones del servidor).
export async function getSalesStats() {
  if (useMock) {
    const hoy = new Date().toDateString();
    return {
      count: MOCK_SALES.length,
      totalHistorico: MOCK_SALES.reduce((n, s) => n + (s.total || 0), 0),
      totalHoy: MOCK_SALES.filter((s) => new Date(s.fecha).toDateString() === hoy).reduce((n, s) => n + (s.total || 0), 0),
    };
  }
  const col = collection(db, COL);
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
  const [cnt, aggAll, aggHoy] = await Promise.all([
    getCountFromServer(col),
    getAggregateFromServer(col, { total: sum('total') }),
    getAggregateFromServer(query(col, where('fecha', '>=', Timestamp.fromDate(inicioHoy))), { total: sum('total') }),
  ]);
  return {
    count: cnt.data().count,
    totalHistorico: aggAll.data().total || 0,
    totalHoy: aggHoy.data().total || 0,
  };
}

/**
 * Registra una venta nueva (POS). Descuenta stock y, si es efectivo, mueve caja.
 * @param sale { canal, items:[{productoId,nombre,cantidad,precioUnit}], descuento, metodoPago, cliente }
 */
export async function createSale(sale) {
  const items = sale.items.map((i) => ({
    productoId: i.productoId,
    codigo: i.codigo || '',
    nombre: i.nombre,
    cantidad: i.cantidad,
    precioUnit: i.precioUnit,
    subtotal: i.precioUnit * i.cantidad,
  }));
  const subtotal = items.reduce((n, i) => n + i.subtotal, 0);
  const montoDesc = Number(sale.montoDesc) || 0;
  const recargoMonto = Number(sale.recargoMonto) || 0;
  const total = subtotal - montoDesc + recargoMonto;

  const data = {
    canal: sale.canal || 'local', items, subtotal,
    tipoDescuento: sale.tipoDescuento || 'Monto fijo',
    valorDesc: Number(sale.valorDesc) || 0,
    montoDesc, descuento: montoDesc,
    recargoPct: Number(sale.recargoPct) || 0, recargoMonto,
    cuotas: Number(sale.cuotas) || 0,
    total, metodoPago: sale.metodoPago, cliente: sale.cliente || '', clienteId: sale.clienteId || '',
    cantItems: items.reduce((n, i) => n + i.cantidad, 0),
    estado: 'completada', migrado: false,
  };

  let ventaId;
  if (useMock) {
    const id = `v-${Date.now()}`;
    MOCK_SALES.push({ id, ventaId: id, fecha: new Date().toISOString(), ...data });
    ventaId = id;
  } else {
    const ref = await addDoc(collection(db, COL), { ...data, fecha: serverTimestamp() });
    ventaId = ref.id;
  }

  // Descontar stock
  const productos = await getProducts();
  for (const item of items) {
    const prod = productos.find((p) => p.id === item.productoId || p.codigo === item.codigo);
    if (prod) await updateProduct(prod.id, { stock: Math.max(0, (prod.stock || 0) - item.cantidad) });
  }

  // Movimiento de caja si afecta efectivo
  if (PAYMENT_METHODS[sale.metodoPago]?.afectaCaja) {
    await addCashMovement({ tipo: 'venta', concepto: `Venta #${String(ventaId).slice(-6)}`, metodoPago: sale.metodoPago, monto: total });
  }

  return ventaId;
}
