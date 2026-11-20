/** Ilustración de línea por servicio: diente base + un acento (mockups v3). */
import { acentoDe, type Acento } from "./acentos";

const ETIQUETAS: Record<Acento, string> = {
  lupa: "diente con una lupa",
  brillo: "diente brillante",
  escudo: "diente con un escudo",
  capa: "diente con una capa estética",
  brackets: "diente con brackets",
  relleno: "diente con una resina",
  raices: "diente con sus conductos",
  flecha: "diente con una flecha hacia arriba",
};

const FONDOS: Record<string, string> = {
  Preventiva: "linear-gradient(150deg,#E3EEF0 0%,#CFE2E6 100%)",
  Estética: "linear-gradient(150deg,#F7EEDF 0%,#EBDBC0 100%)",
  Ortodoncia: "linear-gradient(150deg,#E6EEEA 0%,#D3E2DA 100%)",
  Restauración: "linear-gradient(150deg,#F1EAE0 0%,#E2D4C1 100%)",
  Cirugía: "linear-gradient(150deg,#E8EDF1 0%,#D3DDE5 100%)",
};

const DIENTE_40 =
  "M15 6.5c-2.5 0-4 2.1-4 4.7 0 2 .7 3.4 1.2 5 .6 2 .8 4.3 1.3 6.3.4 1.6 1 2.9 2 2.9 1.3 0 1.6-1.8 1.9-3.6.3-1.7.8-3.3 2.6-3.3s2.3 1.6 2.6 3.3c.3 1.8.6 3.6 1.9 3.6 1 0 1.6-1.3 2-2.9.5-2 .7-4.3 1.3-6.3.5-1.6 1.2-3 1.2-5 0-2.6-1.5-4.7-4-4.7-1.7 0-2.8.9-5 .9s-3.3-.9-5-.9z";

function DibujoAcento({ acento }: { acento: Acento }) {
  const oro = "#B8935A";
  switch (acento) {
    case "lupa":
      return (
        <g fill="none" stroke={oro} strokeWidth="1.3" strokeLinecap="round">
          <circle cx="30.5" cy="21.5" r="4.2" fill="#FFFFFF" />
          <path d="M33.6 24.6l3.4 3.4" />
        </g>
      );
    case "brillo":
      return (
        <g fill={oro}>
          <path
            className="animar-titilar"
            d="M33 4l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9z"
          />
          <path
            className="animar-titilar"
            style={{ ["--retraso" as string]: "1.1s" }}
            d="M8 9l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"
          />
          <path
            className="animar-titilar"
            style={{ ["--retraso" as string]: "2.2s" }}
            d="M35 15l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z"
          />
        </g>
      );
    case "escudo":
      return (
        <g fill="#F4EADB" stroke={oro} strokeWidth="1.1" strokeLinejoin="round">
          <path d="M20 8.6l3.6 1.4v2.8c0 2.3-1.6 3.9-3.6 4.5-2-.6-3.6-2.2-3.6-4.5V10z" />
          <path d="M18.6 12.6l1 1 1.9-1.9" fill="none" strokeLinecap="round" />
        </g>
      );
    case "capa":
      return (
        <g fill="none" stroke={oro} strokeWidth="1.3" strokeLinecap="round">
          <path d="M12.6 10.4c4.4-2 10.4-2 14.8 0" />
          <path d="M13.2 13c4-1.6 9.6-1.6 13.6 0" />
        </g>
      );
    case "brackets":
      return (
        <g fill={oro} stroke={oro} strokeWidth="1">
          <path d="M6 12.5h28" fill="none" />
          <rect x="14" y="11.2" width="2.6" height="2.6" rx=".5" />
          <rect x="18.7" y="11.2" width="2.6" height="2.6" rx=".5" />
          <rect x="23.4" y="11.2" width="2.6" height="2.6" rx=".5" />
        </g>
      );
    case "relleno":
      return (
        <ellipse cx="21.5" cy="11" rx="3.2" ry="2.1" fill="#D9BC8C" stroke={oro} strokeWidth=".8" />
      );
    case "raices":
      return (
        <g fill="none" stroke={oro} strokeWidth="1.2" strokeLinecap="round">
          <path d="M17.3 12.5c-.2 3 .2 6.5.6 10M22.7 12.5c.2 3-.2 6.5-.6 10" />
          <circle cx="20" cy="10.8" r="1.6" fill="#D9BC8C" />
        </g>
      );
    case "flecha":
      return (
        <path
          d="M34.5 23V8.5M31 12l3.5-3.5L38 12"
          fill="none"
          stroke={oro}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

export function IlustracionServicio({
  slug,
  categoria,
  tamano = "tarjeta",
  className = "",
}: {
  slug: string;
  categoria: string;
  tamano?: "tarjeta" | "miniatura";
  className?: string;
}) {
  const acento = acentoDe(slug);
  const caja =
    tamano === "tarjeta"
      ? "relative h-[150px] w-full overflow-hidden"
      : "relative size-[76px] shrink-0 overflow-hidden rounded-[14px]";
  const svg = tamano === "tarjeta" ? { w: 132, h: 106 } : { w: 64, h: 52 };
  return (
    <div
      role="img"
      aria-label={`Ilustración: ${ETIQUETAS[acento]}`}
      data-acento={acento}
      className={`flex items-center justify-center ${caja} ${className}`}
      style={{ background: FONDOS[categoria] ?? FONDOS.Preventiva }}
    >
      {tamano === "tarjeta" ? (
        <>
          <span
            aria-hidden="true"
            className="absolute -right-[70px] -top-[90px] size-[220px] rounded-full border border-tinta/10"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-[70px] -left-[50px] size-[140px] rounded-full border border-tinta/10"
          />
        </>
      ) : null}
      <svg
        aria-hidden="true"
        width={svg.w}
        height={svg.h}
        viewBox="0 0 40 32"
        className="relative transition-transform duration-500 ease-(--ease-sv) group-hover:-translate-y-1.5 group-hover:-rotate-3"
      >
        <path
          d={DIENTE_40}
          fill="#FFFFFF"
          stroke="#0E2F38"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <DibujoAcento acento={acento} />
      </svg>
    </div>
  );
}
