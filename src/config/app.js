// src/config/app.js
//
// MOCK_MODE controla si productos, categorías y pedidos usan datos de ejemplo.
// - false: usan Firestore cuando hay credenciales (.env). Si NO hay .env,
//          igual caen a mock automáticamente (para desarrollar sin backend).
// - true:  fuerzan mock siempre, aunque exista .env.
//
// Módulos de gestión del local (ventas, compras, caja, clientes, proveedores,
// carritos) siguen en memoria por ahora: aún no están migrados al backend.
export const MOCK_MODE = false;
