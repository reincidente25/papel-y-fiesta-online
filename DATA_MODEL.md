# Modelo de datos — Papel & Fiesta (Firestore)

Base de datos NoSQL en Cloud Firestore. Colecciones principales:

## `productos/{productoId}`
| Campo          | Tipo      | Descripción                                        |
|----------------|-----------|----------------------------------------------------|
| `nombre`       | string    | Nombre del producto                                |
| `descripcion`  | string    | Descripción larga                                  |
| `categoria`    | string    | ID de categoría (`libreria`, `fiesta`, etc.)       |
| `precioCosto`  | number    | Precio de costo (solo visible en el panel)         |
| `precioVenta`  | number    | Precio de venta al público                         |
| `stock`        | number    | Unidades disponibles                               |
| `estado`       | string    | `activo` \| `pausado` \| `sin_stock` \| `borrador` |
| `destacado`    | boolean   | Se muestra en la home                              |
| `imagen`       | string    | URL de la imagen (luego: Firebase Storage)         |
| `creadoEn`     | timestamp | Alta                                               |
| `actualizadoEn`| timestamp | Última edición                                     |

## `usuarios/{uid}`
El `uid` coincide con el UID de Firebase Auth.
| Campo      | Tipo      | Descripción                     |
|------------|-----------|---------------------------------|
| `nombre`   | string    | Nombre del usuario              |
| `email`    | string    | Email                           |
| `rol`      | string    | `cliente` \| `admin`            |
| `creadoEn` | timestamp | Fecha de registro               |

> El primer admin se define manualmente en la consola cambiando `rol` a `admin`.

## `pedidos/{pedidoId}`
| Campo        | Tipo      | Descripción                                              |
|--------------|-----------|---------------------------------------------------------|
| `usuarioId`  | string    | UID del comprador                                       |
| `email`      | string    | Email de contacto                                       |
| `items`      | array     | `[{ id, nombre, precio, cantidad, imagen }]`            |
| `total`      | number    | Total del pedido                                        |
| `estado`     | string    | `pendiente`→`pagado`→`preparando`→`enviado`→`entregado` (o `cancelado`) |
| `creadoEn`   | timestamp | Fecha                                                   |
| `actualizadoEn` | timestamp | Último cambio de estado                             |

## `categorias/{categoriaId}` (a futuro)
Hoy las categorías están en `src/constants/index.js`. Cuando se administren
desde el panel, migran a esta colección: `{ nombre, icon, orden }`.

---

## Reglas de seguridad sugeridas (borrador)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(db)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    match /productos/{id} {
      allow read: if true;               // catálogo público
      allow write: if isAdmin();         // solo admin edita
    }
    match /usuarios/{uid} {
      allow read, write: if request.auth.uid == uid || isAdmin();
    }
    match /pedidos/{id} {
      allow create: if request.auth != null;
      allow read, update: if isAdmin() ||
        (request.auth != null && resource.data.usuarioId == request.auth.uid);
    }
  }
}
```
