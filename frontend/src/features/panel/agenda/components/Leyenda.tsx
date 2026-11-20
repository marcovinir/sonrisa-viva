import { ESTADOS, RAYADO_BLOQUEO } from "../estilos";

const ITEMS = [
  { etiqueta: "Confirmada", ...ESTADOS.confirmada },
  { etiqueta: "Asistió", ...ESTADOS.completada },
  { etiqueta: "No asistió", ...ESTADOS.no_asistio },
  { etiqueta: "Terminó, falta marcar", ...ESTADOS.por_marcar, chipColor: "#FFFFFF" },
  {
    etiqueta: "Bloqueo / fuera de horario",
    fondo: RAYADO_BLOQUEO,
    barra: "#B8935A",
    chipColor: "#6B5330",
    icono: "",
  },
];

export function Leyenda() {
  return (
    <ul
      aria-label="Leyenda"
      className="m-0 flex list-none flex-wrap gap-5 p-0 text-[13px] text-texto-2"
    >
      {ITEMS.map((i) => (
        <li key={i.etiqueta} className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-[18px] w-[22px] items-center justify-center rounded-[5px] text-[10px] font-bold"
            style={{ background: i.fondo, borderLeft: `4px solid ${i.barra}`, color: i.chipColor }}
          >
            {i.icono}
          </span>
          {i.etiqueta}
        </li>
      ))}
    </ul>
  );
}
