import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Emprenlazo | Emprendedores que se conectan",
    template: "%s | Emprenlazo",
  },
  description:
    "Descubrí emprendimientos, servicios y comercios locales de Córdoba capital y alrededores. Conectá con quienes hacen crecer la economía emprendedora de la comunidad.",
  applicationName: "Emprenlazo",
  keywords: [
    "emprendedores de Córdoba",
    "emprendimientos de Córdoba",
    "directorio de emprendedores",
    "servicios locales",
    "comercios locales",
    "economía emprendedora",
  ],
  openGraph: {
    title: "Emprenlazo | Emprendedores que se conectan",
    description:
      "Un punto de encuentro para descubrir y conectar con emprendimientos de Córdoba capital y alrededores.",
    locale: "es_AR",
    type: "website",
    siteName: "Emprenlazo",
  },
  twitter: {
    card: "summary",
    title: "Emprenlazo | Emprendedores que se conectan",
    description:
      "Descubrí emprendimientos y servicios locales de Córdoba capital y alrededores.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
