// src/services/posImportService.js
import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';

// Datos de ejemplo para modo demo (simula el catálogo del POS).
const DEMO_POS = [
  { productoId: 'pos-101', nombre: 'Lápiz HB x12', precioLocal: 2400, stockLocal: 60, categoria: 'libreria', imagen: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80' },
  { productoId: 'pos-102', nombre: 'Témpera 250ml surtida', precioLocal: 3100, stockLocal: 18, categoria: 'arte', imagen: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80' },
  { productoId: 'pos-103', nombre: 'Globos metalizados x50', precioLocal: 5600, stockLocal: 40, categoria: 'fiesta', imagen: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80' },
  { productoId: 'pos-104', nombre: 'Cartuchera doble cierre', precioLocal: 7800, stockLocal: 9, categoria: 'escolar', imagen: 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&q=80' },
  { productoId: 'pos-105', nombre: 'Cinta adhesiva ancha', precioLocal: 1500, stockLocal: 120, categoria: 'oficina', imagen: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80' },
];

/**
 * Lista los productos del POS a través de la Cloud Function segura.
 * En modo demo devuelve datos de ejemplo.
 */
export async function listPosProducts(search = '') {
  if (MOCK_MODE || !isFirebaseConfigured || !functions) {
    const q = search.trim().toLowerCase();
    const items = q ? DEMO_POS.filter((p) => p.nombre.toLowerCase().includes(q)) : DEMO_POS;
    return { items, total: items.length, demo: true };
  }
  const call = httpsCallable(functions, 'listPosProducts');
  const res = await call({ search });
  return res.data;
}
