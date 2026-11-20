import { useEffect } from "react";
import { Contacto } from "../components/Contacto";
import { Encabezado } from "../components/Encabezado";
import { Equipo } from "../components/Equipo";
import { Hero } from "../components/Hero";
import { PiePagina } from "../components/PiePagina";
import { Especialidades, Pasos, QuienesSomos } from "../components/Secciones";
import { Servicios } from "../components/Servicios";
import { Testimonios } from "../components/Testimonios";

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
        <Servicios />
        <Equipo />
        <Testimonios />
        <Contacto />
      </main>
      <PiePagina />
    </div>
  );
}
