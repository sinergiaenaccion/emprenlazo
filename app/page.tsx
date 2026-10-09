"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CORDOBA_CENTRO, RADIO_KM, distanciaKm, estaEnCobertura } from "@/lib/geo";

type Emprendimiento = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  zona: string;
  lat: number;
  lng: number;
  whatsapp: string | null;
  instagram: string | null;
};

type Categoria = { id: string; nombre: string };

export default function Home() {
  const [items, setItems] = useState<Emprendimiento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState<string>("todas");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("categorias").select("id,nombre").order("nombre").then(({ data, error }) => {
      if (error) setError(error.message);
      else setCategorias(data ?? []);
    });

    supabase.from("emprendimientos")
      .select("id,nombre,categoria,descripcion,zona,lat,lng,whatsapp,instagram")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setItems((data ?? []).filter((e) => estaEnCobertura(e.lat, e.lng)));
      });
  }, []);

  const visibles = useMemo(
    () => items.filter((e) => categoria === "todas" || e.categoria === categoria),
    [items, categoria]
  );

  return (
    <main className="mx-auto max-w-3xl p-4 font-sans">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-[#5A0A24]">
          Empren<span className="text-[#FB075B]">lazo</span>
        </h1>
        <p className="text-sm text-neutral-600">
          Emprendedores que se conectan · Córdoba capital y alrededores ({RADIO_KM} km)
        </p>
      </header>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setCategoria("todas")} className={`rounded-full px-3 py-1 text-sm ${categoria === "todas" ? "bg-[#FB075B] text-white" : "bg-neutral-100"}`}>
          Todas
        </button>
        {categorias.map((c) => (
          <button key={c.id} onClick={() => setCategoria(c.id)} className={`rounded-full px-3 py-1 text-sm ${categoria === c.id ? "bg-[#FB075B] text-white" : "bg-neutral-100"}`}>
            {c.nombre}
          </button>
        ))}
      </div>
      {error && <p className="text-red-600">Error: {error}</p>}
      <ul className="grid gap-4">
        {visibles.map((e) => (
          <li key={e.id} className="rounded-xl border border-neutral-200 p-4">
            <h2 className="text-lg font-semibold text-[#5A0A24]">{e.nombre}</h2>
            <p className="text-sm text-neutral-500">
              {e.zona} · {distanciaKm(CORDOBA_CENTRO, { lat: e.lat, lng: e.lng }).toFixed(1)} km del centro
            </p>
            {e.descripcion && <p className="mt-2 text-sm">{e.descripcion}</p>}
            <div className="mt-3 flex gap-3 text-sm">
              {e.whatsapp && <a className="text-[#FB075B] underline" href={`https://wa.me/${e.whatsapp}`}>WhatsApp</a>}
              {e.instagram && <a className="text-[#FB075B] underline" href={`https://instagram.com/${e.instagram}`}>Instagram</a>}
            </div>
          </li>
        ))}
      </ul>
      {!error && visibles.length === 0 && (
        <p className="mt-8 text-center text-neutral-500">Todavía no hay emprendimientos aprobados en esta categoría.</p>
      )}
    </main>
  );
}