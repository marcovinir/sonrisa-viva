import { useEffect } from "react";
import { Encabezado } from "../components/Encabezado";
import { Hero } from "../components/Hero";
import { PiePagina } from "../components/PiePagina";
import { Especialidades, Pasos, QuienesSomos } from "../components/Secciones";

export function LandingPage() {
  useEffect(() => {
    document.title = "Sonrisa Viva · Clínica dental en San José";
  }, []);
  return (
    <div className="min-h-screen bg-marfil font-sans text-tinta">
      <Encabezado />
      <main>
        <Hero />
        <Especialidades />
        <Pasos />
        <QuienesSomos />
      </main>
      <PiePagina />
    </div>
  );
}
