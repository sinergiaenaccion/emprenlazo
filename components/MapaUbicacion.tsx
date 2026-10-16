"use client";

import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Zona } from "@/lib/zonas";

export type Punto = { lat: number; lng: number };

type LeafletModule = typeof import("leaflet");

type Props = {
  zona: Zona | null;
  punto: Punto | null;
  onCambiar: (punto: Punto) => void;
};

// Centro de Córdoba capital y Sierras Chicas, para el encuadre inicial.
const CENTRO_INICIAL: [number, number] = [-31.33, -64.25];

function iconoPunto(L: LeafletModule) {
  return L.divIcon({
    className: "",
    html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#FB075B;border:3px solid #fff;box-shadow:0 0 0 1px #5A0A24"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function MapaUbicacion({ zona, punto, onCambiar }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<LeafletNS.Map | null>(null);
  const marcadorRef = useRef<LeafletNS.Marker | null>(null);
  const recuadroRef = useRef<LeafletNS.Rectangle | null>(null);
  const onCambiarRef = useRef(onCambiar);
  const [motor, setMotor] = useState<{ L: LeafletModule; mapa: LeafletNS.Map } | null>(null);

  useEffect(() => {
    onCambiarRef.current = onCambiar;
  });

  // Crea el mapa una sola vez. Leaflet se importa acá, nunca en el servidor.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedorRef.current) return;

      const mapa = L.map(contenedorRef.current, {
        center: CENTRO_INICIAL,
        zoom: 13,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa);

      mapa.on("click", (e: LeafletNS.LeafletMouseEvent) => {
        onCambiarRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapaRef.current = mapa;
      setMotor({ L, mapa });
    })();

    return () => {
      cancelado = true;
      mapaRef.current?.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
      recuadroRef.current = null;
    };
  }, []);

  // Marcador del punto elegido (se puede arrastrar para ajustarlo).
  useEffect(() => {
    if (!motor) return;
    const { L, mapa } = motor;

    if (!punto) {
      marcadorRef.current?.remove();
      marcadorRef.current = null;
      return;
    }

    if (marcadorRef.current) {
      marcadorRef.current.setLatLng([punto.lat, punto.lng]);
      return;
    }

    const marcador = L.marker([punto.lat, punto.lng], {
      draggable: true,
      icon: iconoPunto(L),
    }).addTo(mapa);

    marcador.on("dragend", () => {
      const p = marcador.getLatLng();
      onCambiarRef.current({ lat: p.lat, lng: p.lng });
    });

    marcadorRef.current = marcador;
  }, [motor, punto]);

  // Recuadro aproximado de la zona elegida, y encuadre sobre él.
  useEffect(() => {
    if (!motor) return;
    const { L, mapa } = motor;

    recuadroRef.current?.remove();
    recuadroRef.current = null;
    if (!zona) return;

    const limites = L.latLngBounds(
      [zona.bbox_sur, zona.bbox_oeste],
      [zona.bbox_norte, zona.bbox_este]
    );

    recuadroRef.current = L.rectangle(limites, {
      color: "#FB075B",
      weight: 2,
      fillOpacity: 0.08,
      interactive: false,
    }).addTo(mapa);

    mapa.fitBounds(limites, { padding: [20, 20] });
  }, [motor, zona]);

  return (
    <div
      ref={contenedorRef}
      role="application"
      aria-label="Mapa para marcar la ubicación del emprendimiento"
      className="h-80 w-full overflow-hidden rounded-xl border border-neutral-300"
    />
  );
}
