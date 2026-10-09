// Centro de referencia: Córdoba capital. Radio de cobertura: 30 km.
export const CORDOBA_CENTRO = { lat: -31.4201, lng: -64.1888 };
export const RADIO_KM = 30;

export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function estaEnCobertura(lat: number, lng: number) {
  return distanciaKm(CORDOBA_CENTRO, { lat, lng }) <= RADIO_KM;
}