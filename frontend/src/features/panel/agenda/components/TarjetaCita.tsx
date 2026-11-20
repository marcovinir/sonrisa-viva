import type { CSSProperties } from "react";
import type { CitaPanel } from "../api";
import { ESTADOS } from "../estilos";
import { horaCorta, posicion, type EstadoVisual } from "../semana";

/** Una cita en la grilla: botón que la selecciona. */
export function TarjetaCita({
  cita,
  estado,
  seleccionada,
  retraso,
  onElegir,
}: {
  cita: CitaPanel;
  estado: EstadoVisual;
  seleccionada: boolean;
  retraso: number;
  onElegir: () => void;
}) {
  const e = ESTADOS[estado];
  const { top, alto } = posicion(cita.inicio, cita.fin);
  const paciente = `${cita.paciente.nombre} ${cita.paciente.apellidos}`;
  const ini = horaCorta(cita.inicio);
  const fin = horaCorta(cita.fin);
  // Citas de 45 min o más llevan el chip; de 60 min o más, también el servicio.
  const conChip = alto >= 70;
  const conServicio = alto >= 90;

  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={seleccionada}
      aria-label={`${paciente}, ${cita.servicio.nombre}, de ${ini} a ${fin}, ${e.chip.replace(/^[✓✕] /, "")}`}
      className={`@container animar-in absolute left-1.5 right-1.5 overflow-hidden rounded-[10px] border-none px-2 py-1.5 text-left font-sans transition-[transform,box-shadow] duration-200 hover:z-[3] motion-safe:hover:-translate-y-px hover:shadow-[0_12px_22px_-14px_rgba(14,47,56,.55)] ${
        seleccionada ? "z-[2] outline outline-[3px] outline-offset-1 outline-[#D9BC8C]" : ""
      }`}
      style={
        {
          top: top + 3,
          height: Math.max(alto - 6, 22),
          background: e.fondo,
          color: e.texto,
          borderLeft: `5px solid ${e.barra}`,
          "--retraso": `${retraso}ms`,
        } as CSSProperties
      }
    >
      <span className="flex items-center gap-1 text-[11px] font-bold tracking-[.3px]">
        {e.icono ? (
          <span
            aria-hidden="true"
            className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-[9px]"
            style={{ background: e.chipFondo, color: e.chipColor }}
          >
            {e.icono}
          </span>
        ) : null}
        <span className="truncate">
          {ini}
          <span className="@max-[110px]:hidden"> – {fin}</span>
        </span>
      </span>
      <span className="mt-0.5 block truncate text-sm font-bold leading-tight">{paciente}</span>
      {conChip ? (
        <span
          className="mt-1 inline-block max-w-full truncate rounded-full px-[7px] py-px text-[10px] font-bold"
          style={{ background: e.chipFondo, color: e.chipColor }}
        >
          {e.chip}
        </span>
      ) : null}
      {conServicio ? (
        <span className="mt-0.5 block truncate text-xs opacity-85">{cita.servicio.nombre}</span>
      ) : null}
    </button>
  );
}
