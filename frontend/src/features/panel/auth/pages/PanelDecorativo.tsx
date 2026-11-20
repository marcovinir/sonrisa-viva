import type { CSSProperties } from "react";
import { Diente } from "../../../../shared/ui/Diente";

/** Columna petróleo con arcos dorados girando lento (login, activar, recuperar). */
export function PanelDecorativo({
  titulo,
  destacado,
  texto,
}: {
  titulo: string;
  destacado: string;
  texto: string;
}) {
  return (
    <section className="relative flex flex-[1_1_420px] flex-col justify-between gap-10 overflow-hidden bg-[radial-gradient(120%_80%_at_0%_100%,#1B5A69_0%,#0E2F38_60%)] p-10 text-marfil md:p-14">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 -top-36 size-[520px] rounded-full border border-dashed border-arena-claro/35 motion-safe:animate-[spin_60s_linear_infinite]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-80 -top-64 size-[760px] rounded-full border border-dotted border-arena-claro/20 motion-safe:animate-[spin_90s_linear_infinite_reverse]"
      />
      <div className="animar-entrada relative flex items-center gap-3">
        <Diente tamano={30} trazo="#D9BC8C" sonrisa />
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[34px] font-semibold">Sonrisa Viva</span>
          <span className="mt-1.5 text-[10px] font-bold tracking-[3px] text-arena-claro">
            PANEL DE LA CLÍNICA
          </span>
        </span>
      </div>
      <div
        className="animar-entrada relative flex max-w-[420px] flex-col gap-4"
        style={{ "--retraso": "120ms" } as CSSProperties}
      >
        <p className="m-0 font-serif text-[44px] font-medium leading-[1.05] md:text-[52px]">
          {titulo} <em className="text-arena-claro">{destacado}</em>
        </p>
        <p className="m-0 text-base leading-relaxed text-[#C9D6D9]">{texto}</p>
      </div>
      <span className="relative text-[13px] text-[#A9BEC3]">
        Solo para el personal de la clínica.
      </span>
    </section>
  );
}
