import type { DentistaPanel } from "../../agenda/api";
import { ESTADOS_FILTRO, textoFechas, type ClaveFiltro, type FiltrosCitas } from "../filtros";

type Chip = { clave: string; texto: string; quitar: ClaveFiltro[]; etiqueta: string };

export function ChipsFiltros({
  filtros,
  dentistas,
  onQuitar,
  onLimpiar,
}: {
  filtros: FiltrosCitas;
  dentistas: DentistaPanel[] | null;
  onQuitar: (...claves: ClaveFiltro[]) => void;
  onLimpiar: () => void;
}) {
  const chips: Chip[] = [];
  if (filtros.q)
    chips.push({ clave: "q", texto: `«${filtros.q}»`, quitar: ["q"], etiqueta: "paciente" });
  if (filtros.desde || filtros.hasta)
    chips.push({
      clave: "fechas",
      texto: textoFechas(filtros.desde, filtros.hasta),
      quitar: ["desde", "hasta"],
      etiqueta: "fechas",
    });
  if (filtros.dentista) {
    const d = dentistas?.find((x) => String(x.id) === filtros.dentista);
    chips.push({
      clave: "dentista",
      texto: d ? `${d.usuario.nombre} ${d.usuario.apellidos}` : "Un dentista",
      quitar: ["dentista"],
      etiqueta: "dentista",
    });
  }
  if (filtros.estado)
    chips.push({
      clave: "estado",
      texto: ESTADOS_FILTRO.find((e) => e.valor === filtros.estado)?.texto ?? filtros.estado,
      quitar: ["estado"],
      etiqueta: "estado",
    });
  if (filtros.servicio)
    chips.push({
      clave: "servicio",
      texto: "Un servicio",
      quitar: ["servicio"],
      etiqueta: "servicio",
    });

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px]">
      <span className="font-semibold text-texto-2">Filtros activos:</span>
      <ul aria-label="Filtros activos" className="m-0 flex list-none flex-wrap gap-2 p-0">
        {chips.map((c) => (
          <li
            key={c.clave}
            className="animar-pop inline-flex items-center gap-1.5 rounded-full bg-[#E3EEF0] py-1 pl-3 pr-1 font-semibold"
          >
            {c.texto}
            <button
              type="button"
              aria-label={`Quitar filtro de ${c.etiqueta}`}
              onClick={() => onQuitar(...c.quitar)}
              className="relative flex size-7 items-center justify-center rounded-full bg-white text-base leading-none before:absolute before:-inset-2 before:content-['']"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onLimpiar}
        className="min-h-11 px-2 text-[13px] font-bold text-petroleo hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  );
}
