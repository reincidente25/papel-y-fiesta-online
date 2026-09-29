// src/services/salesService.js
// Mockup en memoria. TODO backend: colección `ventas` + transacción que descuenta stock.
import { MOCK_SALES } from '../data/mockManagement';
import { PAYMENT_METHODS } from '../constants';
import { getProducts, updateProduct } from './productsService';
import { addCashMovement } from './cashService';

export async function getSales() {
  return [...MOCK_SALES].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * Registra una venta: descuenta stock y, si el pago es en efectivo,
 * genera el movimiento de caja correspondiente.
 * @param sale { canal, items:[{productoId,nombre,cantidad,precioUnit}], descuento, metodoPago, cliente }
 */
export async function createSale(sale) {
  const subtotal = sale.items.reduce((n, i) => n + i.precioUnit * i.cantidad, 0);
  const total = subtotal - (Number(sale.descuento) || 0);
  const nueva = {
    id: `v-${Date.now()}`,
    fecha: new Date().toISOString(),
    canal: sale.canal || 'local',
    items: sale.items,
    subtotal,
    descuento: Number(sale.descuento) || 0,
    total,
    metodoPago: sale.metodoPago,
    cliente: sale.cliente || '',
  };
  MOCK_SALES.push(nueva);

  // Descontar stock
  const productos = await getProducts();
  for (const item of sale.items) {
    const prod = productos.find((p) => p.id === item.productoId);
    if (prod) {
      await updateProduct(prod.id, { stock: Math.max(0, (prod.stock || 0) - item.cantidad) });
    }
  }

  // Movimiento de caja si afecta efectivo
  if (PAYMENT_METHODS[sale.metodoPago]?.afectaCaja) {
    await addCashMovement({ tipo: 'venta', concepto: `Venta #${nueva.id}`, metodoPago: sale.metodoPago, monto: total });
  }

  return nueva.id;
}
