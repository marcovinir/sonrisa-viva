import { useEffect, useRef, useState } from "react";
import { BotonEnlace } from "../../../shared/ui/Boton";
import { Logo } from "../../../shared/ui/Logo";

const ENLACES = [
  { href: "#inicio", texto: "Inicio" },
  { href: "#nosotros", texto: "Nosotros" },
  { href: "#servicios", texto: "Servicios" },
  { href: "#equipo", texto: "Equipo" },
  { href: "#contacto", texto: "Contacto" },
];

const SUBRAYADO =
  "bg-[linear-gradient(#B8935A,#B8935A)] bg-no-repeat [background-position:0_100%] [background-size:0_1.5px] pb-1 " +
  "transition-[background-size] duration-300 ease-(--ease-sv) hover:[background-size:100%_1.5px]";

export function Encabezado() {
  const [abierto, setAbierto] = useState(false);
  const [compacto, setCompacto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const alScroll = () => setCompacto(window.scrollY > 24);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [abierto]);

  return (
    <header
      data-compacto={compacto || undefined}
      className="sticky top-0 z-30 border-b border-borde bg-marfil/95 transition-[box-shadow,background-color] duration-300 data-compacto:bg-marfil/85 data-compacto:shadow-[0_12px_30px_-20px_rgba(14,47,56,.4)] data-compacto:backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 py-3.5 md:px-8 md:py-[18px]">
        <a
          href="#inicio"
          aria-label="Sonrisa Viva, clínica dental — inicio"
          className="no-underline"
        >
          <Logo />
        </a>
        <nav aria-label="Principal" className="hidden gap-8 text-[15px] font-medium md:flex">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href} className={`text-tinta no-underline ${SUBRAYADO}`}>
              {e.texto}
            </a>
          ))}
        </nav>
        <BotonEnlace to="/reservar" className="hidden md:inline-flex">
          Agenda tu cita
        </BotonEnlace>
        <button
          ref={boton}
          type="button"
          className="flex size-11 items-center justify-center rounded-xl border-[1.5px] border-[#CFC3AE] md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setAbierto((a) => !a)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0E2F38"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path
              d="M4 7h16"
              className={`origin-center transition-transform duration-300 ${abierto ? "translate-y-[5px] rotate-45" : ""}`}
            />
            <path
              d="M4 12h16"
              className={`transition-opacity duration-200 ${abierto ? "opacity-0" : ""}`}
            />
            <path
              d="M4 17h16"
              className={`origin-center transition-transform duration-300 ${abierto ? "-translate-y-[5px] -rotate-45" : ""}`}
            />
          </svg>
        </button>
      </div>
      {abierto ? (
        <nav
          id="menu-movil"
          aria-label="Menú"
          className="animar-in absolute inset-x-0 top-full flex flex-col border-b border-borde bg-white px-5 pb-5 pt-2 md:hidden"
        >
          {ENLACES.map((e, i) => (
            <a
              key={e.href}
              href={e.href}
              onClick={() => setAbierto(false)}
              className="animar-in border-b border-[#EFE8DB] py-3.5 font-semibold text-tinta no-underline"
              style={{ ["--retraso" as string]: `${i * 40}ms` }}
            >
              {e.texto}
            </a>
          ))}
          <BotonEnlace to="/reservar" className="mt-3">
            Agenda tu cita
          </BotonEnlace>
        </nav>
      ) : null}
    </header>
  );
}
