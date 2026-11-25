// src/hooks/useRecargos.js
// Carga los % de recargo configurados en el panel (config/pagos) con respaldo a los defaults.
import { useEffect, useState } from 'react';
import { getPagos } from '../services/pagosService';
import { RECARGO_DEBITO, CREDITO_OPCIONES, getRecargoDebito, getCreditoOpciones, recargoPctDe } from '../config/recargos';

export function useRecargos() {
  const [cfg, setCfg] = useState({ recargoDebito: RECARGO_DEBITO, creditoOpciones: CREDITO_OPCIONES });

  useEffect(() => {
    let cancel = false;
    getPagos()
      .then((p) => { if (!cancel) setCfg({ recargoDebito: getRecargoDebito(p), creditoOpciones: getCreditoOpciones(p) }); })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);

  return {
    recargoDebito: cfg.recargoDebito,
    creditoOpciones: cfg.creditoOpciones,
    pctDe: (metodo, cuotas) => recargoPctDe(metodo, cuotas, cfg),
  };
}
