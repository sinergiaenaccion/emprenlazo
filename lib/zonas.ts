// Zonas habilitadas. Los datos vienen de la tabla `zonas` (solo las habilitadas, por RLS).
// Los recuadros (bbox) son aproximados y pueden superponerse entre zonas.
export type Zona = {
  id: string;
  nombre: string;
  tipo: "barrio" | "localidad";
  grupo: string;
  // Punto de referencia de la zona: lo usan los emprendimientos que atienden desde su casa.
  centro_lat: number;
  centro_lng: number;
  bbox_sur: number;
  bbox_norte: number;
  bbox_oeste: number;
  bbox_este: number;
};

export const ZONA_COLUMNAS =
  "id,nombre,tipo,grupo,centro_lat,centro_lng,bbox_sur,bbox_norte,bbox_oeste,bbox_este";

// Devuelve la primera zona habilitada cuyo recuadro contiene el punto, o null.
// Si los recuadros se superponen, gana la primera en el orden recibido.
export function zonaDeUbicacion(zonas: Zona[], lat: number, lng: number): Zona | null {
  return (
    zonas.find(
      (z) =>
        lat >= z.bbox_sur &&
        lat <= z.bbox_norte &&
        lng >= z.bbox_oeste &&
        lng <= z.bbox_este
    ) ?? null
  );
}
