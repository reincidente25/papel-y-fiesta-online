// src/services/salesService.js
import {
  collection, getDocs, addDoc, query, orderBy, serverTimestamp,
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
  const montoDesc = Number(sale.descuento) || 0;
  const total = subtotal - montoDesc;

  let ventaId;
  if (useMock) {
    const nueva = {
      id: `v-${Date.now()}`, ventaId: `v-${Date.now()}`, fecha: new Date().toISOString(),
      canal: sale.canal || 'local', items, subtotal, montoDesc, descuento: montoDesc,
      total, metodoPago: sale.metodoPago, cliente: sale.cliente || '', estado: 'completada', migrado: false,
    };
    MOCK_SALES.push(nueva);
    ventaId = nueva.id;
  } else {
    const ref = await addDoc(collection(db, COL), {
      canal: sale.canal || 'local', fecha: serverTimestamp(), items,
      subtotal, montoDesc, descuento: montoDesc, total,
      metodoPago: sale.metodoPago, cliente: sale.cliente || '',
      cantItems: items.reduce((n, i) => n + i.cantidad, 0),
      estado: 'completada', migrado: false,
    });
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
