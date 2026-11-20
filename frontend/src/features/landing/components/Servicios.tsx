import { useState } from "react";
import { Link } from "react-router";
import { colones } from "../../../shared/lib/formato";
import { Chip } from "../../../shared/ui/Chip";
import { Esqueleto, EstadoError } from "../../../shared/ui/Estado";
import { IlustracionServicio } from "../../../shared/ui/IlustracionServicio";
import { Revelar } from "../../../shared/ui/Revelar";
import { useCategorias, useServicios, type Servicio } from "../../../shared/api/catalogo";
import { Rotulo, Titulo } from "./Secciones";

export function TarjetaServicio({ servicio, indice }: { servicio: Servicio; indice: number }) {
  return (
    <Revelar
      as="article"
      retraso={(indice % 4) * 60}
      className="group flex flex-col gap-3 overflow-hidden rounded-[18px] border border-borde bg-white transition-[transform,box-shadow,border-color] duration-400 ease-(--ease-sv) motion-safe:hover:-translate-y-1.5 hover:border-arena-claro hover:shadow-[0_24px_44px_-26px_rgba(14,47,56,.5)]"
    >
      <IlustracionServicio slug={servicio.slug} categoria={servicio.categoria.nombre} />
      <div className="flex flex-1 flex-col gap-3 px-[26px] pb-[22px] pt-2">
        <span className="text-[11px] font-bold tracking-[2px] text-dorado-texto">
          {servicio.categoria.nombre.toUpperCase()}
        </span>
        <h3 className="m-0 font-serif text-[28px] font-semibold leading-[1.1]">
          {servicio.nombre}
        </h3>
        <p className="m-0 flex-1 text-sm leading-relaxed text-texto-2">{servicio.descripcion}</p>
        <div className="flex items-center justify-between border-t border-[#EFE8DB] pt-3.5 text-sm">
          <span className="text-texto-2">
            {servicio.duracion_min} min ·{" "}
            <strong className="text-tinta">{colones(servicio.precio_colones)}</strong>
          </span>
          <Link
            to={`/reservar?servicio=${servicio.id}`}
            aria-label={`Agendar ${servicio.nombre}`}
            className="py-2.5 font-bold text-petroleo no-underline"
          >
            Agendar{" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </Revelar>
  );
}

export function Servicios() {
  const servicios = useServicios();
  const categorias = useCategorias();
  const [filtro, setFiltro] = useState<number | null>(null);
  const visibles = (servicios.data ?? []).filter(
    (s) => filtro === null || s.categoria.id === filtro,
  );

  return (
    <section
      id="servicios"
      aria-labelledby="servicios-t"
      className="mx-auto max-w-[1200px] px-5 py-[104px] md:px-8"
    >
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Rotulo>SERVICIOS</Rotulo>
          <Titulo id="servicios-t">Lo que hacemos por tu sonrisa</Titulo>
        </div>
        <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
          <Chip activo={filtro === null} onClick={() => setFiltro(null)}>
            Todos
          </Chip>
          {(categorias.data ?? []).map((c) => (
            <Chip key={c.id} activo={filtro === c.id} onClick={() => setFiltro(c.id)}>
              {c.nombre}
            </Chip>
          ))}
        </div>
      </div>

      {servicios.isPending ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5"
          aria-busy="true"
        >
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} className="h-[340px]" />
          ))}
        </div>
      ) : servicios.isError ? (
        <EstadoError error={servicios.error} onReintentar={() => servicios.refetch()} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {visibles.map((s, i) => (
            <TarjetaServicio key={s.id} servicio={s} indice={i} />
          ))}
        </div>
      )}
      <p className="mt-5 text-[13px] text-texto-3">
        Los precios son aproximados y se confirman en la valoración.
      </p>
    </section>
  );
}
