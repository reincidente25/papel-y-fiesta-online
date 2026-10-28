// src/services/salesService.js
import {
  collection, getDocs, addDoc, query, orderBy, serverTimestamp,
  limit, startAfter, where, Timestamp, getCountFromServer, getAggregateFromServer, sum,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_SALES } from '../data/mockManagement';
import { getProducts, updateProduct } from './productsService';

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

// Ventas dentro de un rango de fechas (para la caja por turno).
export async function getSalesBetween(desde, hasta = null) {
  if (useMock) {
    const d = (s) => (s.fecha?.toDate ? s.fecha.toDate() : new Date(s.fecha));
    return MOCK_SALES
      .filter((s) => { const x = d(s); return x >= desde && (!hasta || x <= hasta); })
      .sort((a, b) => d(b) - d(a));
  }
  const col = collection(db, COL);
  const parts = [where('fecha', '>=', Timestamp.fromDate(desde))];
  if (hasta) parts.push(where('fecha', '<=', Timestamp.fromDate(hasta)));
  const snap = await getDocs(query(col, ...parts, orderBy('fecha', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// KPIs exactos sin traer todo (agregaciones del servidor).
export async function getSalesStats() {
  const CANCELADAS = ['cancelada', 'cancelado'];
  if (useMock) {
    const hoy = new Date().toDateString();
    const now = new Date();
    const d = (s) => (s.fecha?.toDate ? s.fecha.toDate() : new Date(s.fecha));
    const delDia = MOCK_SALES.filter((s) => d(s).toDateString() === hoy);
    const delMes = MOCK_SALES.filter((s) => d(s).getMonth() === now.getMonth() && d(s).getFullYear() === now.getFullYear());
    return {
      ventasHoy: delDia.length,
      totalHoy: delDia.reduce((n, s) => n + (s.total || 0), 0),
      totalMes: delMes.reduce((n, s) => n + (s.total || 0), 0),
      canceladas: MOCK_SALES.filter((s) => CANCELADAS.includes(s.estado)).length,
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
    ventasHoy: cntHoy.data().count,
    totalHoy: sumHoy.data().total || 0,
    totalMes: sumMes.data().total || 0,
    canceladas: cntCanc.data().count,
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
    varianteId: i.varianteId || '',
    variante: i.variante || '',
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

  // Descontar stock (siempre a nivel producto; la variante es solo informativa).
  // Agrupamos por producto para no pisar descuentos de varias líneas/variantes.
  const productos = await getProducts();
  const cambios = new Map(); // productoId -> stock resultante
  for (const item of items) {
    const prod = productos.find((p) => p.id === item.productoId || p.codigo === item.codigo);
    if (!prod) continue;
    const base = cambios.has(prod.id) ? cambios.get(prod.id) : (prod.stock ?? 0);
    cambios.set(prod.id, Math.max(0, base - item.cantidad));
  }
  for (const [pid, stock] of cambios) await updateProduct(pid, { stock });

  return ventaId;
}
