// src/services/categoriesService.js
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { DEFAULT_CATEGORIES } from '../constants';

const COL = 'categorias';
const useMock = MOCK_MODE || !isFirebaseConfigured;

/**
 * Categorías para la tienda y el panel.
 * En modo mock devuelve las categorías por defecto; con backend, las de Firestore.
 * Forma: { id (slug), name, icon?, orden?, activa?, cantidad? }
 */
export async function getCategories({ soloActivas = true } = {}) {
  if (useMock) {
    return DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));
  }
  const snap = await getDocs(query(collection(db, COL), orderBy('orden')));
  let cats = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.nombre || d.id, orden: data.orden, activa: data.activa, cantidad: data.cantidad || 0 };
  });
  if (soloActivas) cats = cats.filter((c) => c.activa !== false);
  return cats;
}
