import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { descargarIcs } from "../../../shared/lib/calendario";
import { colones, fechaLarga, hora } from "../../../shared/lib/formato";
import { Boton, BotonEnlace } from "../../../shared/ui/Boton";
import { Logo } from "../../../shared/ui/Logo";
import type { CitaResumen } from "../api";

const retraso = (ms: number) => ({ "--retraso": `${ms}ms` }) as CSSProperties;
const mayuscula = (t: string) => t.replace(/^./, (c) => c.toUpperCase());

function Dato({
  etiqueta,
  children,
  nota,
}: {
  etiqueta: string;
  children: ReactNode;
  nota?: string;
}) {
  return (
    <div>
      <span className="text-xs font-bold tracking-[1.5px] text-dorado-texto">{etiqueta}</span>
      <p className="m-0 mt-1.5 text-[17px] font-semibold">{children}</p>
      {nota ? <p className="m-0 mt-0.5 text-[13px] text-texto-3">{nota}</p> : null}
    </div>
  );
}

function Check() {
  return (
    <div
      aria-hidden="true"
      className="animar-pop relative flex size-[88px] items-center justify-center rounded-full border-[1.5px] border-arena"
    >
      <span className="absolute -inset-0.5 rounded-full border-[1.5px] border-arena-claro motion-safe:animate-ping motion-safe:[animation-iteration-count:2]" />
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#13505F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          className="motion-safe:[stroke-dasharray:24] motion-safe:[animation:sv-dibujar-check_.55s_var(--ease-sv)_.45s_backwards]"
        />
      </svg>
    </div>
  );
}

export function ConfirmadaPage() {
  const cita = (useLocation().state as { cita?: CitaResumen } | null)?.cita;

  useEffect(() => {
    document.title = "Cita confirmada · Sonrisa Viva";
  }, []);

  return (
    <div className="min-h-screen bg-marfil font-sans text-tinta">
      <header className="border-b border-borde">
        <div className="mx-auto max-w-[1160px] px-5 py-3.5 md:px-8">
          <Link to="/" aria-label="Sonrisa Viva — volver al inicio" className="no-underline">
            <Logo compacto />
          </Link>
        </div>
      </header>
      {cita ? (
        <main className="mx-auto flex max-w-[760px] flex-col items-center gap-6 px-5 py-16 text-center">
          <Check />
          <span
            className="animar-entrada text-[13px] font-bold tracking-[3px] text-dorado-texto"
            style={retraso(550)}
          >
            CITA CONFIRMADA
          </span>
          <h1
            className="animar-entrada m-0 font-serif text-[40px] font-medium leading-[1.08] md:text-[54px]"
            style={retraso(650)}
          >
            ¡Listo, {cita.paciente.nombre}! Te esperamos.
          </h1>
          <p
            className="animar-entrada m-0 max-w-[560px] text-[17px] leading-relaxed text-texto-2"
            style={retraso(750)}
          >
            Enviamos la confirmación a <strong className="text-tinta">{cita.paciente.email}</strong>{" "}
            con un enlace para cambiar o cancelar la cita hasta 24 horas antes.
          </p>
          <section
            aria-label="Detalle de la cita"
            className="animar-entrada grid w-full grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5 rounded-[22px] border border-borde bg-white px-8 py-7 text-left"
            style={retraso(900)}
          >
            <Dato etiqueta="SERVICIO">{cita.servicio.nombre}</Dato>
            <Dato etiqueta="CUÁNDO" nota={`${hora(cita.inicio)} – ${hora(cita.fin)}`}>
              {mayuscula(fechaLarga(cita.inicio))}
            </Dato>
            <Dato etiqueta="CON">
              {cita.dentista.nombre} {cita.dentista.apellidos}
            </Dato>
            <div>
              <span className="text-xs font-bold tracking-[1.5px] text-dorado-texto">
                PRECIO APROX.
              </span>
              <p className="m-0 mt-1.5 font-serif text-[28px] font-semibold text-petroleo">
                {colones(cita.precio_colones)}
              </p>
            </div>
          </section>
          <div className="animar-entrada flex flex-wrap justify-center gap-3" style={retraso(1050)}>
            <Boton onClick={() => descargarIcs(cita)}>Agregar al calendario</Boton>
            <BotonEnlace to="/" variante="contorno">
              Volver al inicio
            </BotonEnlace>
          </div>
          <p className="m-0 text-[13px] text-texto-3">
            ¿No te llegó el correo? Revisa la carpeta de spam o escríbenos por WhatsApp.
          </p>
        </main>
      ) : (
        <main className="mx-auto flex max-w-[640px] flex-col items-center gap-5 px-5 py-20 text-center">
          <h1 className="m-0 font-serif text-[40px] font-medium">Tu reserva ya fue registrada.</h1>
          <p className="m-0 text-texto-2">
            Revisa tu correo para ver el detalle y el enlace para gestionarla.
          </p>
          <Link to="/" className="font-semibold text-petroleo">
            Volver al inicio
          </Link>
        </main>
      )}
    </div>
  );
}
