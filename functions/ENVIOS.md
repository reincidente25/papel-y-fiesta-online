# Estimación de envíos (Mi Correo Argentino)

La tienda cotiza el envío por **código postal** desde la ficha de cada producto
(componente `ShippingEstimator`), que llama a la Cloud Function `cotizarEnvio`.

## Cómo funciona

1. El cliente ingresa (o se precarga, del domicilio predeterminado) el **CP de destino**.
2. `cotizarEnvio` llama a la API de **Mi Correo Argentino** (`/rates`) con el CP de
   origen del local, el CP de destino y un **peso estándar** por ítem × cantidad.
3. Devuelve las tarifas (Paq.ar Clásico/Express, a domicilio `D` o sucursal `S`).
4. **Si no hay credenciales o la API falla**, devuelve un **estimado** propio
   (base + por kg × factor de zona) y lo marca como "Valor estimado".

## Configuración

Secrets (API Mi Correo Argentino — se piden dando de alta la cuenta):
```bash
firebase functions:secrets:set CA_USER_TOKEN      # usuario del /token (Basic)
firebase functions:secrets:set CA_PASSWORD_TOKEN  # password del /token (Basic)
firebase functions:secrets:set CA_EMAIL           # email de la cuenta Mi Correo
firebase functions:secrets:set CA_PASSWORD        # password de la cuenta Mi Correo
```

Parámetros (en `functions/.env`):
```
CA_ENV=prod                 # o "test" para el ambiente de pruebas
CA_CP_ORIGEN=2000           # CP del local (origen del envío)
ENVIO_PESO_ESTANDAR_G=500   # peso por ítem en gramos (estándar)
# Fallback cuando no hay API:
ENVIO_FALLBACK_BASE=2500
ENVIO_FALLBACK_POR_KG=1200
```

Desplegar: `firebase deploy --only functions`.

## Notas

- Mientras no cargues las credenciales + `CA_CP_ORIGEN`, la tienda muestra el
  **estimado propio** (sirve para que la pantalla funcione desde ya).
- Hoy se usa **peso estándar** (elección del proyecto). Si más adelante querés
  precisión, se agrega un campo `pesoGramos` por producto y se envía en la
  cotización (el back ya lo acepta).
- Otros couriers (Andreani, OCA, Vía Cargo, Uber/Moova) se integran reemplazando
  `lib/correoArgentino.js` por el cliente del courier, sin tocar la pantalla.
