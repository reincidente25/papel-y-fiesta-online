# Emails transaccionales (Brevo)

Los emails salen solos mediante **triggers de Firestore** (Cloud Functions, región `southamerica-east1`).

## Instancias

| Función | Se dispara cuando | Destinatario |
|---|---|---|
| `onUsuarioCreado` | se crea `usuarios/{uid}` (registro) | cliente (bienvenida) |
| `onUsuarioActualizado` | cambia `email` en `usuarios/{uid}` | correo nuevo + correo anterior |
| `onPedidoCreado` | se crea `pedidos/{id}` | cliente (confirmación) + admin (aviso) |
| `onPedidoEstadoCambiado` | cambia `estado` en `pedidos/{id}` | cliente |

## Configuración (una sola vez)

1. **Remitente verificado en Brevo**: en Brevo → *Senders & IP* dar de alta y verificar el email que usarás como remitente (p. ej. `hola@papelyfiesta.com`).

2. **API key como secret** (no se guarda en el código):
   ```bash
   firebase functions:secrets:set BREVO_API_KEY
   # pegar la API key v3 de Brevo (Settings → SMTP & API → API Keys)
   ```

3. **Parámetros** (no secretos). Se cargan al desplegar; podés ponerlos en `functions/.env`:
   ```
   BREVO_SENDER_EMAIL=hola@papelyfiesta.com
   BREVO_SENDER_NAME=Papel & Fiesta
   ADMIN_NOTIFY_EMAIL=ventas@papelyfiesta.com
   SITE_URL=https://papelyfiesta.com
   ```
   - `ADMIN_NOTIFY_EMAIL` vacío → no se manda el aviso interno de nuevo pedido.
   - `SITE_URL` vacío → los emails salen sin botones de enlace.

4. **Desplegar**:
   ```bash
   firebase deploy --only functions
   ```

## Notas

- Si falta `BREVO_SENDER_EMAIL` o la API key, la función no rompe: loguea y no envía.
- El **reset de contraseña** y la **verificación de email** los envía Firebase Auth directamente; se pueden "brandear" aparte desde Authentication → Templates, o migrar a Brevo con `generatePasswordResetLink` si se quiere control total.
- Para que `onUsuarioActualizado` dispare el aviso de cambio de email, la app debe actualizar `usuarios/{uid}.email` al cambiar el correo (falta la pantalla de perfil que lo haga).
