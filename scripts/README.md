# Scripts — Importación a Firestore

## Importar productos desde Excel

Sube los productos del Excel a la colección `productos` de Firestore.
**El ID de cada documento es el Código** (ej. `VAR-046`), y el campo `codigo`
también queda guardado dentro para filtrar rápido.

### 1. Instalar dependencias
```bash
cd scripts
npm install
```

### 2. Service account key de Firebase
1. Firebase Console → ⚙️ **Configuración del proyecto** → pestaña **Cuentas de servicio**.
2. **Generar nueva clave privada** → se descarga un JSON.
3. Guardalo como **`scripts/serviceAccountKey.json`**.
   > Está en `.gitignore`: NO se sube al repo. Es una credencial sensible.

### 3. Poner el Excel
Dejá el archivo `.xlsx` dentro de `scripts/` (toma el primero que encuentre),
o pasá la ruta como argumento.

Columnas esperadas (tolera acentos y mayúsculas):
`Código, Nombre, Marca, Descripción, Proveedor, Precio Compra, Precio Venta, Stock, Stock Mínimo, Estado`

### 4. Ejecutar
```bash
npm run import
# o con una ruta específica:
node import-productos.mjs /ruta/al/stock.xlsx
```

### Notas
- Es **idempotente**: si lo corrés de nuevo, actualiza los productos existentes
  por su código (no duplica). Usa `merge`, así respeta campos que hayas editado
  desde el panel salvo los que vienen del Excel.
- Precios: entiende el formato argentino `$1.020,00`.
- Estado: `Activo` → `activo`, `Inactivo` → `pausado`.
- `categoria`, `imagen` y `destacado` quedan vacíos para completar desde el panel.
