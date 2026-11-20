import { ESTADO_LARGO, ESTADOS } from "../agenda/estilos";
import type { EstadoVisual } from "../agenda/semana";

const CORTO: Record<EstadoVisual, string> = {
  confirmada: "Confirmada",
  completada: "Asistió",
  no_asistio: "No asistió",
  por_marcar: "Por marcar",
  cancelada: "Cancelada",
};

/** Estado de una cita con texto e ícono (nunca solo color). */
export function InsigniaEstado({
  estado,
  largo = false,
}: {
  estado: EstadoVisual;
  largo?: boolean;
}) {
  const e = ESTADOS[estado];
  // «Por marcar» va en arena claro sobre blanco; en la grilla es petróleo.
  const fondo = estado === "por_marcar" ? "#F6EDE0" : e.fondo;
  const color = estado === "por_marcar" ? "#6B5330" : e.texto;
  return (
    <span
      className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold"
      style={{ background: fondo, color }}
    >
      {e.icono ? <span aria-hidden="true">{e.icono}</span> : null}
      {largo ? ESTADO_LARGO[estado] : CORTO[estado]}
    </span>
  );
}
