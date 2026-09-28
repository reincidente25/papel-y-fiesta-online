# 🎉 Papel & Fiesta — E-commerce

Tienda online de librería y cotillón con panel de administración, construida con
**React + Vite + Firebase**.

## Stack

- **React 18** + **Vite 5**
- **Firebase 10** (Auth + Firestore)
- **React Router 6**
- CSS propio con design system basado en la paleta de la marca (naranja + gris + tinta)

## Modo demo

La app funciona **sin configurar Firebase**: arranca en modo demo con datos de
ejemplo (`src/data/mockProducts.js`), lo que permite ver toda la UI —tienda y
panel— antes de conectar el backend.

## Estructura

```
src/
├── config/firebase.js         ← init Firebase + flag isFirebaseConfigured
├── constants/                 ← estados de producto/pedido, roles, categorías
├── context/
│   ├── AuthContext.jsx        ← sesión + perfil con rol (cliente/admin)
│   └── CartContext.jsx        ← carrito (persistido en localStorage)
├── services/                  ← acceso a Firestore (products, orders, users)
├── data/mockProducts.js       ← datos demo / semilla
├── utils/format.js            ← moneda ARS, fechas, margen
├── components/
│   ├── common/                ← Loader, Brand, rutas protegidas
│   ├── store/                 ← Navbar, Footer, ProductCard, StoreLayout
│   └── admin/                 ← AdminLayout + estilos del panel
├── pages/
│   ├── store/                 ← Home, Catálogo, Detalle, Carrito
│   ├── auth/                  ← Login, Registro
│   └── admin/                 ← Dashboard, Productos (ABM), Pedidos
└── App.jsx                    ← rutas públicas + privadas de admin
```

## Rutas

**Tienda (público)**: `/` · `/catalogo` · `/producto/:id` · `/carrito`
**Auth**: `/login` · `/registro`
**Admin (rol admin)**: `/admin` · `/admin/productos` · `/admin/productos/nuevo` · `/admin/pedidos`

## Setup

```bash
npm install
cp .env.example .env   # completar credenciales de Firebase
npm run dev
```

## Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com).
2. Activar **Authentication** (Email/Password) y **Firestore**.
3. Copiar credenciales del SDK a `.env`.
4. Ver [`DATA_MODEL.md`](./DATA_MODEL.md) para el esquema de colecciones y las
   reglas de seguridad sugeridas.
5. Para crear el primer **admin**: registrarse en la app y luego cambiar
   `rol` a `admin` en el documento `usuarios/{uid}` desde la consola.

## Próximos pasos

- [ ] Subida de imágenes con Firebase Storage
- [ ] Categorías administrables desde el panel
- [ ] Checkout con medio de pago (Mercado Pago)
- [ ] Historial de pedidos para el cliente
- [ ] Descuento de stock automático al confirmar pedido
