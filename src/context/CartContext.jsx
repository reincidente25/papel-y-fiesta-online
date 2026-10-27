// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'pf_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Aviso tipo "toast" (ej: "Agregado al carrito").
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const notify = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = (product, cantidad = 1, variante = null) => {
    // La línea del carrito es única por producto + variante.
    const lineId = variante ? `${product.id}::${variante.id}` : product.id;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === lineId);
      if (existing) {
        return prev.map((i) =>
          i.id === lineId ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      const base = product.nombreWeb || product.nombre;
      return [...prev, {
        id: lineId,
        productoId: product.id,
        varianteId: variante?.id || '',
        variante: variante ? (variante.tipo ? `${variante.tipo}: ${variante.nombre}` : variante.nombre) : '',
        nombre: variante ? `${base} — ${variante.tipo ? variante.tipo + ': ' : ''}${variante.nombre}` : base,
        precio: variante ? (Number(variante.precioVenta) || 0) : product.precioVenta,
        imagen: variante?.imagen || product.imagen,
        cantidad,
      }];
    });
    notify('Agregado al carrito');
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const setQty = (id, cantidad) =>
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, cantidad) } : i))
        .filter((i) => i.cantidad > 0)
    );

  const clearCart = () => setItems([]);

  const { count, total } = useMemo(() => ({
    count: items.reduce((n, i) => n + i.cantidad, 0),
    total: items.reduce((n, i) => n + i.precio * i.cantidad, 0),
  }), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQty, clearCart, count, total, notify }}>
      {children}
      {toast && (
        <div className="cart-toast" role="status" aria-live="polite">
          <span className="cart-toast-ico">✓</span> {toast}
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};

export default CartContext;
