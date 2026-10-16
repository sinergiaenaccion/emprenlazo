# Emprenlazo

Directorio de emprendedores de la zona norte de Córdoba capital y Sierras Chicas. La cobertura se define por zonas habilitadas, que se pueden ampliar gradualmente.

## Puesta en marcha

1. Copiá `.env.example` como `.env.local` y completá la anon key de Supabase (Project Settings → API Keys).
2. En Supabase → SQL Editor, ejecutá en este orden:
   1. `supabase/schema.sql`
   2. `supabase/migrations/20261011_merchant_accounts_catalog.sql`
   3. `supabase/migrations/20261016_cobertura_zonas_y_seguridad_altas.sql`
   4. `supabase/migrations/20261016b_ubicacion_aproximada.sql`
3. `npm install` y `npm run dev`.

> La migración `20261011` crea la tabla `productos` con precios y stock. Esa parte no está aprobada para el MVP. No la ejecutes en producción hasta que se decida si el catálogo entra en esta etapa.

## Zonas

- Las zonas viven en la tabla `zonas`. Solo se muestran las que tienen `habilitada = true`.
- Para ampliar la cobertura, cambiá `habilitada` a `true` en la zona correspondiente, o agregá una zona nueva.
- Cada zona tiene un recuadro aproximado (`bbox_*`). Los recuadros pueden superponerse y no reflejan límites oficiales todavía. Antes de decidir si un comercio entra en una zona, reemplazalos por los límites oficiales.
- Un comercio con local muestra su punto exacto. Quien atiende desde su casa no envía su punto: se guarda el punto de referencia de la zona y la ficha queda marcada como `ubicacion_aproximada`.
- El punto de referencia de cada zona (`centro_lat`, `centro_lng`) cae dentro de su recuadro y fuera de los recuadros de las demás zonas, para que la zona se resuelva igual sin importar el orden.

## Estado del proyecto

Base en Next.js 16, React 19 y Supabase. Pendientes:

- Panel de administración y moderación de fichas.
- Aceptación de términos registrada, páginas legales y canal de reportes.
- Decisión sobre el catálogo de productos.
