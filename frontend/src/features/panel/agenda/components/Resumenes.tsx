import type { CSSProperties, ReactNode } from "react";
import { hora, isoDia, partesCR } from "../../../../shared/lib/formato";
import type { CitaPanel } from "../api";
import { estadoVisual, textoFaltan } from "../semana";

const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function Tarjeta({
  etiqueta,
  icono,
  oscura = false,
  retraso,
  children,
}: {
  etiqueta: string;
  icono: ReactNode;
  oscura?: boolean;
  retraso: number;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={etiqueta}
      className={`animar-entrada flex items-center gap-3.5 rounded-2xl px-[18px] py-4 ${
        oscura ? "bg-petroleo text-white" : "border border-borde bg-white"
      }`}
      style={{ "--retraso": `${retraso}ms` } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${
          oscura ? "bg-white/[.12]" : "bg-[#F6EDE0]"
        }`}
      >
        {icono}
      </span>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const Rotulo = ({ children, claro = false }: { children: ReactNode; claro?: boolean }) => (
  <div
    className={`text-xs font-bold tracking-[1.5px] ${claro ? "text-arena-claro" : "text-[#8A6A3B]"}`}
  >
    {children}
  </div>
);

/** «Hoy», «Próxima» y «Por marcar» con las citas de la semana actual. */
export function Resumenes({ citas, ahora }: { citas: CitaPanel[]; ahora: Date }) {
  const hoy = isoDia(ahora);
  const p = partesCR(ahora);
  const deHoy = citas.filter((c) => isoDia(new Date(c.inicio)) === hoy);
  const atendidas = deHoy.filter((c) => c.estado === "completada").length;
  const proxima = citas.find((c) => c.estado === "confirmada" && new Date(c.inicio) > ahora);
  const porMarcar = citas.filter((c) => estadoVisual(c, ahora) === "por_marcar").length;
  const faltan = proxima
    ? Math.round((new Date(proxima.inicio).getTime() - ahora.getTime()) / 60_000)
    : 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
      <Tarjeta
        etiqueta="Hoy"
        retraso={0}
        icono={
          <span className="flex size-11 flex-col items-center justify-center rounded-xl bg-tinta text-marfil">
            <span className="text-[9px] font-bold tracking-[1.5px] text-arena-claro">
              {DIAS_CORTOS[p.diaSemana]}
            </span>
            <span className="font-serif text-[22px] font-semibold">{p.dia}</span>
          </span>
        }
      >
        <Rotulo>HOY</Rotulo>
        <div className="text-base font-bold">
          {deHoy.length === 0
            ? "Sin citas"
            : `${deHoy.length} ${deHoy.length === 1 ? "cita" : "citas"} · ${atendidas} ${
                atendidas === 1 ? "atendida" : "atendidas"
              }`}
        </div>
      </Tarjeta>

      <Tarjeta
        etiqueta="Próxima cita"
        oscura
        retraso={80}
        icono={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D9BC8C"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        }
      >
        {proxima ? (
          <>
            <Rotulo claro>PRÓXIMA · {textoFaltan(faltan).toUpperCase()}</Rotulo>
            <div className="truncate text-base font-bold">
              {hora(proxima.inicio)} · {proxima.paciente.nombre} {proxima.paciente.apellidos}
            </div>
            <div className="truncate text-[13px] text-[#C9D6D9]">{proxima.servicio.nombre}</div>
          </>
        ) : (
          <>
            <Rotulo claro>PRÓXIMA</Rotulo>
            <div className="text-base font-bold">Sin más citas esta semana</div>
          </>
        )}
      </Tarjeta>

      <Tarjeta
        etiqueta="Por marcar"
        retraso={160}
        icono={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A6A3B"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 11l3 3 8-8" />
            <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
          </svg>
        }
      >
        <Rotulo>POR MARCAR</Rotulo>
        <div className="text-base font-bold">
          {porMarcar === 0
            ? "Todo al día"
            : porMarcar === 1
              ? "1 cita ya terminó"
              : `${porMarcar} citas ya terminaron`}
        </div>
        <div className="text-[13px] text-texto-3">
          {porMarcar === 0 ? "No hay asistencias pendientes" : "Marca si asistió o no"}
        </div>
      </Tarjeta>
    </div>
  );
}
