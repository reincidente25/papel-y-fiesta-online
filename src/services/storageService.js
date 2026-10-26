// src/services/storageService.js
// Subida de imágenes a Firebase Storage. En modo demo (sin Firebase) devuelve
// una URL local (object URL) para poder previsualizar sin backend.
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../config/firebase';
import { MOCK_MODE } from '../config/app';

const useMock = MOCK_MODE || !isFirebaseConfigured;

// Normaliza un nombre de archivo para usarlo como ruta segura.
const slug = (s) => (s || 'img')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Sube un archivo de imagen de un producto y devuelve su URL pública.
 * @param {File} file
 * @param {string} codigo - código del producto (carpeta destino)
 */
export async function uploadProductImage(file, codigo = 'varios') {
  if (useMock) {
    // Sin backend: previsualización local (no persiste al recargar).
    return URL.createObjectURL(file);
  }
  const nombre = `${Date.now()}-${slug(file.name)}`;
  const path = `productos/${slug(codigo)}/${nombre}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}

export async function uploadProductImages(files, codigo) {
  const arr = Array.from(files || []);
  return Promise.all(arr.map((f) => uploadProductImage(f, codigo)));
}

// Borra una imagen por su URL de descarga (si es de Firebase Storage).
export async function deleteImageByUrl(url) {
  if (useMock || !url || !url.includes('firebasestorage')) return;
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // La imagen puede no existir o ya haber sido borrada: lo ignoramos.
  }
}
