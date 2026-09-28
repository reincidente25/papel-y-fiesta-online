# Importar productos desde el POS (Fase 2)

Puente seguro para traer productos del proyecto de inventario del local a la
tienda, eligiendo desde el panel (`/admin/importar`) cuáles publicar.

## Cómo funciona

```
Panel (/admin/importar)  →  Cloud Function listPosProducts  →  Firestore del POS
   (solo admin)              (Admin SDK, del lado servidor)      (lee, sin costo)
```

- La Function corre en el proyecto de la **tienda** y lee el Firestore del **POS**
  con el Admin SDK. **Nunca** devuelve el precio de costo.
- Solo responde a usuarios con `rol: admin` en la tienda.
- Al importar, se crea el producto en `productos` con:
  - `precioVenta` = precio web (editable, puede diferir del local)
  - `stock` = cupo reservado para la web
  - `origen: { fuente: 'pos', productoId }` para evitar duplicados.

## Requisitos

1. **Plan Blaze** en el proyecto de la tienda (Cloud Functions lo requiere).
   El uso entra en el free tier → costo ~USD 0. Recomendado: crear una
   **alerta de presupuesto** de USD 1 en Google Cloud Billing.
2. **Firebase CLI**: `npm i -g firebase-tools` y `firebase login`.

## Configuración (una vez)

### 1. Apuntar el proyecto
En `.firebaserc`, reemplazar `TU_PROJECT_ID_DE_LA_TIENDA` por el projectId real
de la tienda (o correr `firebase use --add`).

### 2. Ajustar el mapeo de campos del POS
En `functions/index.js`, la función `mapPosDoc()` traduce los campos del POS a
los de la tienda. Ajustar los nombres a los reales del inventario
(nombre, precio, stock, categoría, imagen).

### 3. Permiso de lectura cruzado (IAM)
El service account del runtime de la tienda debe poder leer el Firestore del POS:

1. En Google Cloud Console → proyecto de la **tienda** → IAM → copiá el email del
   service account `PROJECT_ID@appspot.gserviceaccount.com`.
2. En el proyecto del **POS** → IAM → **Otorgar acceso** → pegá ese email →
   rol **Cloud Datastore Viewer** (`roles/datastore.viewer`) → Guardar.

### 4. Definir parámetros y desplegar
```bash
cd functions && npm install && cd ..

# projectId del POS y (opcional) nombre de la colección de productos del POS
firebase functions:config:set   # (o usar el prompt de params al desplegar)
firebase deploy --only functions
```
Al desplegar, Firebase pedirá los valores de `POS_PROJECT_ID` y `POS_COLLECTION`
(definidos con `defineString` en `functions/index.js`).

### 5. Reglas de Firestore
```bash
firebase deploy --only firestore:rules
```

## Refrescar cupo / precios
Reimportar no duplica (los ya importados aparecen deshabilitados como
"Importado"). Para actualizar cupo o precio de un producto ya publicado, se
edita desde **Productos**. (A futuro: botón de "resincronizar" que recalcula el
cupo contra el stock actual del POS.)
