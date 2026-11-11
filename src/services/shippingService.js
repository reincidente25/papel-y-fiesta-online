// src/services/shippingService.js
import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured } from '../config/firebase';

// Cotiza el envío (Cloud Function: Correo Argentino + fallback estimado).
export async function cotizarEnvio({ cpDestino, cantidad = 1, pesoGramos } = {}) {
  if (!isFirebaseConfigured) {
    // Modo demo: estimación local simple.
    const kg = Math.max(0.5, (0.5 * cantidad));
    return { estimado: true, rates: [{ deliveredType: 'D', productName: 'Envío estimado a domicilio', price: Math.round(2500 + 1200 * kg) }] };
  }
  const res = await httpsCallable(functions, 'cotizarEnvio')({ cpDestino, cantidad, pesoGramos });
  return res.data;
}
