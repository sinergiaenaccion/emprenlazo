-- Emprenlazo: ubicación aproximada para quienes atienden desde su casa.
-- Ejecutar en Supabase SQL Editor después de 20261016_cobertura_zonas_y_seguridad_altas.sql.
-- No guarda la dirección ni el punto exacto: para estos emprendimientos se guarda
-- el punto de referencia de la zona, que cae dentro de su recuadro y fuera de los demás.

alter table public.emprendimientos
  add column if not exists ubicacion_aproximada boolean not null default false;

grant select (ubicacion_aproximada) on public.emprendimientos to anon, authenticated;

-- Punto de referencia de cada zona (reemplaza el centro geométrico, que en algunas
-- zonas caía dentro del recuadro de otra zona).
update public.zonas z
set centro_lat = v.lat, centro_lng = v.lng
from (values
  ('unquillo', -31.2338964, -64.3182906),
  ('mendiolaza', -31.2646776, -64.2995018),
  ('villa-allende', -31.2987833, -64.279733),
  ('saldan', -31.3249654, -64.3071406),
  ('la-calera', -31.3474024, -64.3377462),
  ('villa-warcalde', -31.3470758, -64.2931318),
  ('los-boulevares', -31.343345, -64.225622),
  ('jardin-claret', -31.3469338, -64.2400417),
  ('villa-belgrano', -31.3576184, -64.251377),
  ('arguello', -31.3476928, -64.2643446),
  ('cerro-de-las-rosas', -31.3761497, -64.2302497),
  ('alto-verde', -31.3733291, -64.2177592),
  ('villa-cabrera', -31.3851503, -64.217285),
  ('alta-cordoba', -31.3909536, -64.1838494)
) as v(id, lat, lng)
where z.id = v.id;
