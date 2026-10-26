// src/services/purchasesService.js
import {
  collection, getDocs, addDoc, query, orderBy, serverTimestamp,
  limit, startAfter, getCountFromServer, getAggregateFromServer, sum,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { MOCK_PURCHASES } from '../data/mockManagement';
import { PAYMENT_METHODS } from '../constants';
import { getProducts, updateProduct } from './productsService';
import { addCashMovement } from './cashService';

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

export async function getPurchasesStats() {
  if (useMock) {
    return { count: MOCK_PURCHASES.length, totalInvertido: MOCK_PURCHASES.reduce((n, c) => n + (c.total || 0), 0) };
  }
  const col = collection(db, COL);
  const [cnt, agg] = await Promise.all([
    getCountFromServer(col),
    getAggregateFromServer(col, { total: sum('total') }),
  ]);
  return { count: cnt.data().count, totalInvertido: agg.data().total || 0 };
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

  if (data.estado === 'pagada' && PAYMENT_METHODS[purchase.metodoPago]?.afectaCaja) {
    await addCashMovement({ tipo: 'compra', concepto: `Compra #${String(compraId).slice(-6)}`, metodoPago: purchase.metodoPago, monto: total });
  }

  return compraId;
}
