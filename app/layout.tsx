import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emprenlazo · Emprendedores que se conectan",
  description: "Directorio de emprendedores de Córdoba capital y alrededores.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}