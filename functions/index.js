// functions/index.js
// Puente seguro entre la tienda (Papel & Fiesta) y el POS/inventario del local.
//
// Lee los productos del proyecto del POS con el Admin SDK (del lado servidor),
// NUNCA devuelve el precio de costo, y solo responde a usuarios admin de la tienda.

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Parámetros de configuración (se definen al desplegar) ──────────────────
// projectId del POS y nombre de la colección de productos en el POS.
const POS_PROJECT_ID = defineString('POS_PROJECT_ID');
const POS_COLLECTION = defineString('POS_COLLECTION', { default: 'productos' });

const REGION = 'southamerica-east1';

// App por defecto = proyecto de la TIENDA (usa las credenciales del runtime).
const tiendaApp = initializeApp();
const tiendaDb = getFirestore(tiendaApp);

// Segunda app = proyecto del POS. El service account del runtime de la tienda
// debe tener el rol "Cloud Datastore Viewer" (datastore.viewer) en el proyecto
// del POS para poder leer su Firestore (permiso cruzado por IAM, sin claves).
let posDb = null;
function getPosDb() {
  if (posDb) return posDb;
  const posApp = initializeApp(
    { projectId: POS_PROJECT_ID.value(), credential: applicationDefault() },
    'pos'
  );
  posDb = getFirestore(posApp);
  return posDb;
}

// ── Mapeo de un documento del POS a la forma que consume la tienda ─────────
// ⚠️ AJUSTAR los nombres de campos a los reales del POS.
// (Pasame un documento de ejemplo y lo dejo exacto.)
function mapPosDoc(id, d) {
  return {
    productoId: id,
    nombre:      d.nombre ?? d.descripcion ?? d.titulo ?? '(sin nombre)',
    // precio de venta del local (se usa como sugerencia; el precio web se edita aparte)
    precioLocal: Number(d.precioVenta ?? d.precio ?? d.precioLista ?? 0),
    stockLocal:  Number(d.stock ?? d.cantidad ?? d.existencia ?? 0),
    categoria:   d.categoria ?? d.rubro ?? null,
    imagen:      d.imagen ?? d.foto ?? d.urlImagen ?? null,
    // 🔒 NUNCA incluir precio de costo ni datos sensibles del POS.
  };
}

async function assertAdmin(auth) {
  if (!auth) throw new HttpsError('unauthenticated', 'Necesitás iniciar sesión.');
  const snap = await tiendaDb.doc(`usuarios/${auth.uid}`).get();
  if (!snap.exists || snap.data().rol !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo administradores pueden importar.');
  }
}

// ── Listar productos del POS para la pantalla de importación ───────────────
export const listPosProducts = onCall({ region: REGION }, async (request) => {
  await assertAdmin(request.auth);

  const search = String(request.data?.search || '').trim().toLowerCase();
  const snap = await getPosDb().collection(POS_COLLECTION.value()).get();

  let items = snap.docs.map((doc) => mapPosDoc(doc.id, doc.data()));
  if (search) items = items.filter((p) => p.nombre.toLowerCase().includes(search));
  items.sort((a, b) => a.nombre.localeCompare(b.nombre));

  return { items, total: items.length };
});
