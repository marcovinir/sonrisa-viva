import { useDentistas } from "../../../shared/api/catalogo";
import { Diente } from "../../../shared/ui/Diente";
import { Esqueleto, EstadoError } from "../../../shared/ui/Estado";
import type { DentistaElegido } from "../estado";
import { TituloPaso } from "./TituloPaso";

const OPCION =
  "group flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-[transform,box-shadow,border-color] duration-300 motion-safe:hover:-translate-y-0.5 hover:border-arena-claro hover:shadow-[0_14px_26px_-18px_rgba(14,47,56,.6)]";

export function PasoDentista({
  servicioId,
  elegido,
  onElegir,
}: {
  servicioId: number;
  elegido: DentistaElegido | null;
  onElegir: (d: DentistaElegido) => void;
}) {
  const dentistas = useDentistas(servicioId);
  const borde = (activo: boolean) =>
    activo ? "border-petroleo ring-2 ring-petroleo/20" : "border-borde";
  return (
    <section>
      <TituloPaso descripcion="Si no tienes preferencia, te asignamos a quien tenga la agenda más libre.">
        ¿Con quién quieres atenderte?
      </TituloPaso>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        <li className="animar-in">
          <button
            type="button"
            aria-pressed={elegido === "cualquiera"}
            onClick={() => onElegir("cualquiera")}
            className={`${OPCION} ${borde(elegido === "cualquiera")}`}
          >
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-tinta"
            >
              <Diente tamano={28} trazo="#D9BC8C" sonrisa />
            </span>
            <span className="flex flex-col">
              <span className="font-bold">Cualquiera disponible</span>
              <span className="text-[13px] text-texto-2">Más horas para elegir</span>
            </span>
          </button>
        </li>
        {dentistas.isPending
          ? Array.from({ length: 2 }, (_, i) => (
              <li key={i}>
                <Esqueleto className="h-[88px]" />
              </li>
            ))
          : dentistas.isError
            ? null
            : dentistas.data.map((d, i) => (
                <li
                  key={d.id}
                  className="animar-in"
                  style={{ ["--retraso" as string]: `${(i + 1) * 40}ms` }}
                >
                  <button
                    type="button"
                    aria-pressed={elegido === d.id}
                    onClick={() => onElegir(d.id)}
                    className={`${OPCION} ${borde(elegido === d.id)}`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(160deg,#EFE4D0_0%,#E2D1B3_100%)] font-serif text-xl font-semibold text-[#6B5330]"
                    >
                      {d.nombre[0]}
                      {d.apellidos[0]}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold">
                        {d.nombre} {d.apellidos}
                      </span>
                      <span className="text-[13px] text-texto-2">{d.especialidad}</span>
                    </span>
                  </button>
                </li>
              ))}
      </ul>
      {dentistas.isError ? (
        <div className="mt-4">
          <EstadoError error={dentistas.error} onReintentar={() => dentistas.refetch()} />
        </div>
      ) : null}
    </section>
  );
}
