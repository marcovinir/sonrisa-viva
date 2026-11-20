import type { CSSProperties } from "react";
import { colones } from "../../../shared/lib/formato";
import { BotonEnlace } from "../../../shared/ui/Boton";
import { useServicios } from "../api";

const retraso = (ms: number) => ({ "--retraso": `${ms}ms` }) as CSSProperties;

const DIENTE_GRANDE =
  "M38 22C26 22 19 32 19 44.5c0 9.6 3.4 16.4 5.8 24 2.9 9.6 3.8 20.7 6.2 30.3 1.9 7.7 4.8 13.9 9.6 13.9 6.2 0 7.7-8.6 9.1-17.3 1.4-8.2 3.8-15.8 12.5-15.8s11.1 7.7 12.5 15.8c1.4 8.6 2.9 17.3 9.1 17.3 4.8 0 7.7-6.2 9.6-13.9 2.4-9.6 3.4-20.7 6.2-30.3 2.4-7.7 5.8-14.4 5.8-24C105 32 98 22 86 22c-8.2 0-13.4 4.3-24 4.3S46.2 22 38 22z";

function Insignia({
  className,
  icono,
  titulo,
  texto,
  ms,
}: {
  className: string;
  icono: React.ReactNode;
  titulo: string;
  texto: string;
  ms: number;
}) {
  return (
    <div
      className={`animar-flotar absolute flex items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-3 shadow-[0_18px_36px_-22px_rgba(14,47,56,.5)] ${className}`}
      style={retraso(ms)}
    >
      <span
        aria-hidden="true"
        className="flex size-[38px] items-center justify-center rounded-full"
      >
        {icono}
      </span>
      <span className="flex flex-col text-[13px] leading-snug">
        <strong>{titulo}</strong>
        <span className="text-texto-3">{texto}</span>
      </span>
    </div>
  );
}

export function Hero() {
  const { data } = useServicios();
  const minimo = data?.length ? Math.min(...data.map((s) => s.precio_colones)) : null;
  const textoPrecio =
    minimo !== null ? `Valoración desde ${colones(minimo)}` : "Valoración con precio claro";

  return (
    <section
      id="inicio"
      className="mx-auto grid max-w-[1200px] items-center gap-16 px-5 pb-24 pt-14 md:grid-cols-2 md:px-8 md:pt-[88px]"
    >
      <div className="flex flex-col gap-7">
        <span className="animar-entrada text-[13px] font-bold tracking-[3px] text-dorado-texto">
          SAN JOSÉ · COSTA RICA
        </span>
        <h1
          className="animar-entrada m-0 font-serif text-[46px] font-medium leading-[1.03] tracking-[-0.5px] md:text-[76px]"
          style={retraso(80)}
        >
          Odontología cuidadosa, <em className="text-petroleo">sonrisas que duran.</em>
        </h1>
        <p
          className="animar-entrada m-0 max-w-[520px] text-[17px] leading-relaxed text-texto-2 md:text-[19px]"
          style={retraso(160)}
        >
          Un equipo de cuatro especialistas que se toma el tiempo de explicarte cada paso. Elige el
          servicio, mira las horas libres y reserva en menos de un minuto, sin crear cuenta.
        </p>
        <div className="animar-entrada flex flex-wrap gap-3.5" style={retraso(240)}>
          <BotonEnlace to="/reservar" tamano="lg">
            Agenda tu cita
          </BotonEnlace>
          <a
            href="#servicios"
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-tinta px-7 py-4 font-semibold text-tinta no-underline transition-transform duration-300 motion-safe:hover:-translate-y-0.5"
          >
            Ver servicios
          </a>
        </div>
        <div
          className="animar-entrada flex flex-wrap gap-7 border-t border-borde pt-3 text-sm text-texto-2"
          style={retraso(320)}
        >
          <span>
            <strong className="text-tinta">Lun a vie</strong> 8:00–12:00 · 13:00–17:00
          </span>
          <span>
            <strong className="text-tinta">Sábado</strong> 8:00–12:00
          </span>
        </div>
      </div>

      <div className="relative pb-6 pr-6">
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-[calc(100%-24px)] w-[calc(100%-24px)] rounded-[220px_220px_24px_24px] border-[1.5px] border-arena"
        />
        <div
          role="img"
          aria-label="Ilustración de un diente brillante"
          className="animar-arco relative flex h-[420px] flex-col items-center justify-center overflow-hidden rounded-[220px_220px_24px_24px] bg-[linear-gradient(160deg,#1B5A69_0%,#0E2F38_100%)] md:h-[560px]"
        >
          <div
            aria-hidden="true"
            className="absolute -left-20 -top-28 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(217,188,140,.45)_0%,rgba(217,188,140,0)_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute size-[380px] rounded-full border border-dashed border-arena-claro/35"
          />
          <div
            aria-hidden="true"
            className="absolute size-[470px] rounded-full border border-arena-claro/15"
          />
          <svg
            aria-hidden="true"
            width="260"
            height="260"
            viewBox="0 0 120 120"
            fill="none"
            className="relative"
          >
            <path
              className="animar-dibujar"
              d={DIENTE_GRANDE}
              stroke="#F8F5EF"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M40 46c6 4.5 13 6.5 22 6.5S78 50.5 84 46"
              stroke="#D9BC8C"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              className="animar-titilar"
              d="M100 16l2.2 6.3 6.3 2.2-6.3 2.2-2.2 6.3-2.2-6.3-6.3-2.2 6.3-2.2z"
              fill="#D9BC8C"
            />
            <path
              className="animar-titilar"
              style={retraso(1100)}
              d="M18 86l1.5 4.3 4.3 1.5-4.3 1.5-1.5 4.3-1.5-4.3-4.3-1.5 4.3-1.5z"
              fill="#D9BC8C"
            />
            <path
              className="animar-titilar"
              style={retraso(2200)}
              d="M30 12l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z"
              fill="#F8F5EF"
            />
          </svg>
        </div>
        <Insignia
          className="-left-2 top-20 md:-left-9 md:top-24"
          ms={1100}
          titulo="Agenda en línea"
          texto="Sin crear cuenta"
          icono={
            <span className="flex size-[38px] items-center justify-center rounded-full bg-[#E3EEF0]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#13505F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4.5" width="18" height="16" rx="3" />
                <path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4" />
              </svg>
            </span>
          }
        />
        <Insignia
          className="-right-1 bottom-20 md:-right-3"
          ms={1300}
          titulo={textoPrecio}
          texto="Precio claro desde el inicio"
          icono={
            <span className="flex size-[38px] items-center justify-center rounded-full bg-[#F4EADB] font-serif text-xl font-semibold text-dorado-texto">
              ₡
            </span>
          }
        />
      </div>
    </section>
  );
}
