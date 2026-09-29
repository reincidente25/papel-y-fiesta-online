// src/services/cartsService.js
// Carritos abandonados (mockup en memoria).
// TODO backend: persistir el carrito por usuario/sesión en Firestore y marcar
// como "abandonado" cuando pasa X tiempo sin convertirse en pedido
// (una Cloud Function programada revisa y actualiza el estado).
import { MOCK_ABANDONED_CARTS } from '../data/mockManagement';

export async function getAbandonedCarts() {
  return [...MOCK_ABANDONED_CARTS].sort((a, b) => new Date(b.actualizadoEn) - new Date(a.actualizadoEn));
}

export async function updateCartStatus(id, estado) {
  const i = MOCK_ABANDONED_CARTS.findIndex((c) => c.id === id);
  if (i >= 0) MOCK_ABANDONED_CARTS[i] = { ...MOCK_ABANDONED_CARTS[i], estado };
}
