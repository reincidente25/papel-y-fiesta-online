// src/services/categoriesService.js
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';
import { DEFAULT_CATEGORIES } from '../constants';

const COL = 'categorias';
const useMock = MOCK_MODE || !isFirebaseConfigured;

// slug legible para el ID del documento (y para filtrar productos por categoría).
export const slugify = (s) => (s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Categorías para la tienda y el panel.
 * Forma: { id (slug), name, icon?, imagen?, descripcion?, orden?, activa? }
 * Se ordena en el cliente para no perder docs sin campo `orden`.
 */
export async function getCategories({ soloActivas = true } = {}) {
  if (useMock) {
    return DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));
  }
  const snap = await getDocs(collection(db, COL));
  let cats = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id, name: data.nombre || d.id,
      orden: data.orden ?? 999, activa: data.activa,
      icon: data.icon || '', imagen: data.imagen || '', descripcion: data.descripcion || '',
    };
  });
  if (soloActivas) cats = cats.filter((c) => c.activa !== false);
  return cats.sort((a, b) => (a.orden - b.orden) || a.name.localeCompare(b.name));
}

export async function createCategory({ nombre, icon = '', imagen = '', descripcion = '', orden = 999, activa = true }) {
  const id = slugify(nombre);
  if (!id) throw new Error('El nombre de la categoría no es válido.');
  if (!useMock) {
    await setDoc(doc(db, COL, id), {
      nombre, icon, imagen, descripcion, orden: Number(orden) || 999, activa,
      creadoEn: serverTimestamp(),
    }, { merge: true });
  }
  return id;
}

export async function updateCategory(id, data) {
  if (useMock) return;
  await updateDoc(doc(db, COL, id), { ...data, actualizadoEn: serverTimestamp() });
}

export async function deleteCategory(id) {
  if (useMock) return;
  await deleteDoc(doc(db, COL, id));
}
