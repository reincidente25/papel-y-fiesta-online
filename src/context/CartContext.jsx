// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'pf_cart_guest';
const keyFor = (user) => (user ? `pf_cart_${user.uid}` : GUEST_KEY);

const leer = (key) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
};
const escribir = (key, items) => {
  try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* ignore */ }
};
// Fusiona dos carritos (suma cantidades por id de línea).
const fusionar = (a = [], b = []) => {
  const map = new Map(a.map((i) => [i.id, { ...i }]));
  for (const it of b) {
    const ex = map.get(it.id);
    if (ex) ex.cantidad += it.cantidad;
    else map.set(it.id, { ...it });
  }
  return [...map.values()];
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => leer(keyFor(user)));
  const keyRef = useRef(keyFor(user));
  const listo = useRef(true);

  // Aviso tipo "toast" (ej: "Agregado al carrito").
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const notify = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  // Cambia el carrito al iniciar/cerrar sesión. Al loguearse, fusiona lo que
  // el invitado tenía con el carrito guardado del usuario.
  useEffect(() => {
    const nuevaKey = keyFor(user);
    if (nuevaKey === keyRef.current) return;
    const anterior = keyRef.current;
    listo.current = false;
    if (user && anterior === GUEST_KEY) {
      const invitado = leer(GUEST_KEY);
      const delUsuario = leer(nuevaKey);
      const merged = invitado.length ? fusionar(delUsuario, invitado) : delUsuario;
      setItems(merged);
      escribir(nuevaKey, merged);
      escribir(GUEST_KEY, []);
    } else {
      setItems(leer(nuevaKey));
    }
    keyRef.current = nuevaKey;
  }, [user]);

  // Persiste el carrito en la clave actual. Tras un cambio de sesión salteamos
  // una vuelta para no pisar el carrito ya fusionado con el estado viejo.
  useEffect(() => {
    if (!listo.current) { listo.current = true; return; }
    escribir(keyRef.current, items);
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
        precio: product.precioVenta, // el precio es del producto, no de la variante
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
