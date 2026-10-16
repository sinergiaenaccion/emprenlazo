"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Zona, ZONA_COLUMNAS, zonaDeUbicacion } from "@/lib/zonas";

type Categoria = { id: string; nombre: string };

export default function SumatePage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("categorias").select("id,nombre").order("nombre")
      .then(({ data }) => setCategorias(data ?? []));
    supabase.from("zonas").select(ZONA_COLUMNAS).order("nombre")
      .then(({ data }) => setZonas((data ?? []) as Zona[]));
  }, []);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setMensaje("");
    setEnviando(true);
    const form = new FormData(formElement);
    const numero = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
    const instagram = String(form.get("instagram") ?? "").replace(/^@/, "").trim();
    const lat = Number(form.get("lat"));
    const lng = Number(form.get("lng"));
    const zonaElegida = zonas.find((z) => z.id === String(form.get("zona_id") ?? ""));

    if (!zonaElegida) {
      setError("Elegí una zona de la lista.");
      setEnviando(false);
      return;
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Revisá las coordenadas: latitud entre -90 y 90 y longitud entre -180 y 180.");
      setEnviando(false);
      return;
    }

    // El punto tiene que caer dentro de la zona elegida.
    if (zonaDeUbicacion(zonas, lat, lng)?.id !== zonaElegida.id) {
      setError(`La ubicación no está dentro de ${zonaElegida.nombre}. Revisá la latitud y longitud o cambiá la zona.`);
      setEnviando(false);
      return;
    }

    const { error: insertError } = await supabase.from("emprendimientos").insert({
      nombre: String(form.get("nombre") ?? "").trim(),
      categoria: String(form.get("categoria") ?? ""),
      descripcion: String(form.get("descripcion") ?? "").trim() || null,
      zona: zonaElegida.nombre,
      zona_id: zonaElegida.id,
      lat,
      lng,
      whatsapp: numero || null,
      instagram: instagram || null,
      estado: "pendiente",
    });

    if (insertError) {
      setError("No pudimos enviar la solicitud. Verificá los datos e intentá nuevamente.");
    } else {
      formElement.reset();
      setMensaje("¡Listo! Recibimos tu solicitud. El emprendimiento quedará pendiente de revisión antes de aparecer en el directorio.");
    }
    setEnviando(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 font-sans">
      <Link href="/" className="text-sm text-[#FB075B] underline">← Volver al directorio</Link>
      <header className="mb-8 mt-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#FB075B]">Comunidad emprendedora</p>
        <h1 className="mt-2 text-3xl font-bold text-[#5A0A24]">Sumá tu emprendimiento</h1>
        <p className="mt-3 text-neutral-600">Creá tu ficha gratuita para que más personas puedan conocer lo que hacés. Revisaremos la información antes de publicarla.</p>
        <p className="mt-2 text-sm text-neutral-500">Por ahora Emprenlazo recibe emprendimientos de la zona norte de Córdoba capital y de Sierras Chicas.</p>
      </header>

      <form onSubmit={enviar} className="grid gap-5 rounded-2xl border border-neutral-200 p-5 sm:p-7">
        <label className="grid gap-1 text-sm font-medium">Nombre del emprendimiento *
          <input name="nombre" required minLength={2} maxLength={80} className="rounded-lg border border-neutral-300 px-3 py-2.5 font-normal" placeholder="Ej. Dulce Casa" />
        </label>
        <label className="grid gap-1 text-sm font-medium">Categoría *
          <select name="categoria" required className="rounded-lg border border-neutral-300 px-3 py-2.5 font-normal" defaultValue="">
            <option value="" disabled>Elegí una categoría</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">Descripción
          <textarea name="descripcion" maxLength={500} rows={4} className="rounded-lg border border-neutral-300 px-3 py-2.5 font-normal" placeholder="Contá qué ofrecés y qué te diferencia (hasta 500 caracteres)." />
        </label>
        <label className="grid gap-1 text-sm font-medium">Zona *
          <select name="zona_id" required className="rounded-lg border border-neutral-300 px-3 py-2.5 font-normal" defaultValue="">
            <option value="" disabled>Elegí tu barrio o localidad</option>
            {zonas.map((zona) => <option key={zona.id} value={zona.id}>{zona.nombre}</option>)}
          </select>
        </label>
        <fieldset className="grid gap-3 rounded-xl bg-neutral-50 p-4">
          <legend className="px-1 text-sm font-semibold">Ubicación *</legend>
          <p className="text-sm text-neutral-600">Ingresá latitud y longitud del negocio, dentro de la zona que elegiste. Podés obtenerlas desde Google Maps al mantener presionado el punto del mapa. Más adelante vas a poder marcarlo directamente en el mapa.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">Latitud *
              <input name="lat" required type="number" step="any" min="-90" max="90" className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal" placeholder="-31.2946" />
            </label>
            <label className="grid gap-1 text-sm">Longitud *
              <input name="lng" required type="number" step="any" min="-180" max="180" className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal" placeholder="-64.2958" />
            </label>
          </div>
        </fieldset>
        <label className="grid gap-1 text-sm font-medium">WhatsApp
          <input name="whatsapp" inputMode="tel" className="rounded-lg border border-neutral-300 px-3 py-2.5 font-normal" placeholder="5493511234567 (solo números)" />
        </label>
        <label className="grid gap-1 text-sm font-medium">Instagram
          <input name="instagram" maxLength={31} className="rounded-lg border border-neutral-300 px-3 py-2.5 font-normal" placeholder="@tuemprendimiento" />
        </label>
        <p className="text-xs leading-5 text-neutral-500">Al enviar, declarás que la información es correcta y autorizás su revisión para publicar la ficha en Emprenlazo. No incluyas datos personales que no quieras hacer públicos.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {mensaje && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{mensaje}</p>}
        <button disabled={enviando} className="rounded-xl bg-[#FB075B] px-5 py-3 font-semibold text-white disabled:opacity-60">{enviando ? "Enviando..." : "Enviar solicitud"}</button>
      </form>
    </main>
  );
}
