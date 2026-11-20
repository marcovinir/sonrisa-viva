import { colones } from "../../../shared/lib/formato";
import { useServicios, type Servicio } from "../../../shared/api/catalogo";
import { Esqueleto, EstadoError } from "../../../shared/ui/Estado";
import { IlustracionServicio } from "../../../shared/ui/IlustracionServicio";
import { TituloPaso } from "./TituloPaso";

export function PasoServicio({
  onElegir,
  elegido,
}: {
  onElegir: (s: Servicio) => void;
  elegido: number | null;
}) {
  const servicios = useServicios();
  return (
    <section>
      <TituloPaso descripcion="Elige el tratamiento; en el siguiente paso escoges dentista y hora.">
        ¿Qué servicio necesitas?
      </TituloPaso>
      {servicios.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} className="h-[108px]" />
          ))}
        </div>
      ) : servicios.isError ? (
        <EstadoError error={servicios.error} onReintentar={() => servicios.refetch()} />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {servicios.data.map((s, i) => (
            <li key={s.id} className="animar-in" style={{ ["--retraso" as string]: `${i * 35}ms` }}>
              <button
                type="button"
                aria-label={`Elegir ${s.nombre}`}
                aria-pressed={elegido === s.id}
                onClick={() => onElegir(s)}
                className={`group flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-[transform,box-shadow,border-color] duration-300 motion-safe:hover:-translate-y-0.5 hover:border-arena-claro hover:shadow-[0_14px_26px_-18px_rgba(14,47,56,.6)] ${
                  elegido === s.id ? "border-petroleo ring-2 ring-petroleo/20" : "border-borde"
                }`}
              >
                <IlustracionServicio
                  slug={s.slug}
                  categoria={s.categoria.nombre}
                  tamano="miniatura"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-[2px] text-dorado-texto">
                    {s.categoria.nombre.toUpperCase()}
                  </span>
                  <span className="font-serif text-[22px] font-semibold leading-tight">
                    {s.nombre}
                  </span>
                  <span className="text-[13px] text-texto-2">
                    {s.duracion_min} min ·{" "}
                    <strong className="text-tinta">{colones(s.precio_colones)}</strong>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
