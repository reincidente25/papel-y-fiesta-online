// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = (product, cantidad = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, {
        id: product.id,
        nombre: product.nombre,
        precio: product.precioVenta,
        imagen: product.imagen,
        cantidad,
      }];
    });
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
    <CartContext.Provider value={{ items, addItem, removeItem, setQty, clearCart, count, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};

export default CartContext;
