import { useState } from "react";
import { Link } from "react-router";
import { Esqueleto, EstadoError } from "../../../shared/ui/Estado";
import { Revelar } from "../../../shared/ui/Revelar";
import { useDentistas, type Dentista } from "../../../shared/api/catalogo";
import { Rotulo, Titulo } from "./Secciones";

const iniciales = (d: Dentista) => `${d.nombre[0] ?? ""}${d.apellidos[0] ?? ""}`.toUpperCase();

function Retrato({ dentista }: { dentista: Dentista }) {
  const [fallo, setFallo] = useState(!dentista.foto_url);
  const nombre = `Retrato de ${dentista.nombre} ${dentista.apellidos}`;
  const forma =
    "h-[300px] w-full rounded-[140px_140px_16px_16px] transition-transform duration-500 ease-(--ease-sv) group-hover:-translate-y-1";
  if (fallo) {
    return (
      <div
        role="img"
        aria-label={nombre}
        className={`${forma} flex items-center justify-center bg-[linear-gradient(160deg,#EFE4D0_0%,#E2D1B3_100%)] font-serif text-6xl font-semibold text-[#6B5330]`}
      >
        {iniciales(dentista)}
      </div>
    );
  }
  return (
    <img
      src={dentista.foto_url}
      alt={nombre}
      onError={() => setFallo(true)}
      className={`${forma} object-cover`}
    />
  );
}

export function Equipo() {
  const dentistas = useDentistas();
  return (
    <section id="equipo" aria-labelledby="equipo-t" className="border-y border-borde bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-[104px] md:px-8">
        <div className="mb-11 flex flex-col gap-4">
          <Rotulo>EQUIPO</Rotulo>
          <Titulo id="equipo-t">Cuatro especialistas, un mismo cuidado</Titulo>
        </div>
        {dentistas.isPending ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-7">
            {Array.from({ length: 4 }, (_, i) => (
              <Esqueleto key={i} className="h-[420px]" />
            ))}
          </div>
        ) : dentistas.isError ? (
          <EstadoError error={dentistas.error} onReintentar={() => dentistas.refetch()} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-7">
            {dentistas.data.map((d, i) => (
              <Revelar
                as="article"
                key={d.id}
                retraso={i * 70}
                className="group flex flex-col gap-3.5"
              >
                <Retrato dentista={d} />
                <div>
                  <h3 className="m-0 font-serif text-[26px] font-semibold">
                    {d.nombre} {d.apellidos}
                  </h3>
                  <p className="m-0 mt-1 text-[13px] font-bold uppercase tracking-[1.5px] text-dorado-texto">
                    {d.especialidad}
                  </p>
                </div>
                <p className="m-0 text-sm leading-relaxed text-texto-2">{d.biografia}</p>
                <Link
                  to={`/reservar?dentista=${d.id}`}
                  className="py-1.5 text-sm font-bold text-petroleo no-underline"
                >
                  Agendar con {d.nombre}{" "}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </Revelar>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
