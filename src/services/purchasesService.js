// src/services/purchasesService.js
// Mockup en memoria. TODO backend: colección `compras` + suma de stock/costo.
import { MOCK_PURCHASES } from '../data/mockManagement';
import { PAYMENT_METHODS } from '../constants';
import { getProducts, updateProduct } from './productsService';
import { addCashMovement } from './cashService';

export async function getPurchases() {
  return [...MOCK_PURCHASES].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * Registra una compra: suma stock (y actualiza costo si el ítem referencia un producto).
 * @param purchase { proveedorId, proveedorNombre, items:[{productoId?,nombre,cantidad,costoUnit}], estado, metodoPago }
 */
export async function createPurchase(purchase) {
  const total = purchase.items.reduce((n, i) => n + i.costoUnit * i.cantidad, 0);
  const nueva = {
    id: `c-${Date.now()}`,
    fecha: new Date().toISOString(),
    proveedorId: purchase.proveedorId,
    proveedorNombre: purchase.proveedorNombre,
    items: purchase.items,
    total,
    estado: purchase.estado || 'pendiente',
    metodoPago: purchase.metodoPago,
  };
  MOCK_PURCHASES.push(nueva);

  // Sumar stock y actualizar costo de los productos referenciados
  const productos = await getProducts();
  for (const item of purchase.items) {
    if (!item.productoId) continue;
    const prod = productos.find((p) => p.id === item.productoId);
    if (prod) {
      await updateProduct(prod.id, {
        stock: (prod.stock || 0) + item.cantidad,
        precioCosto: item.costoUnit,
      });
    }
  }

  // Movimiento de caja si se pagó en efectivo
  if (purchase.estado === 'pagada' && PAYMENT_METHODS[purchase.metodoPago]?.afectaCaja) {
    await addCashMovement({ tipo: 'compra', concepto: `Compra #${nueva.id}`, metodoPago: purchase.metodoPago, monto: total });
  }

  return nueva.id;
}
