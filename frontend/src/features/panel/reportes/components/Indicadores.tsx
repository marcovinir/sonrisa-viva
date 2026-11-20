import type { CSSProperties } from "react";
import type { Tasa } from "../api";
import { colonesCorto, porcentaje } from "../formato";

function Indicador({
  titulo,
  valor,
  nota,
  retraso,
}: {
  titulo: string;
  valor: string;
  nota: string;
  retraso: number;
}) {
  const id = `kpi-${titulo.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section
      aria-labelledby={id}
      className="animar-entrada rounded-[18px] border border-borde bg-white px-[22px] py-5"
      style={{ "--retraso": `${retraso}ms` } as CSSProperties}
    >
      <h2 id={id} className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-dorado-texto">
        {titulo}
      </h2>
      <p className="m-0 mb-0.5 mt-2 font-serif text-[42px] font-semibold leading-none">{valor}</p>
      <p className="m-0 text-[13px] text-texto-3">{nota}</p>
    </section>
  );
}

/** Los cuatro números del período: atendidas, asistencia, ausencias e ingresos. */
export function Indicadores({ tasa, ingresos }: { tasa?: Tasa; ingresos?: number }) {
  const cargando = "…";
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      <Indicador
        titulo="Citas atendidas"
        valor={tasa ? String(tasa.completadas) : cargando}
        nota="Pacientes que asistieron"
        retraso={0}
      />
      <Indicador
        titulo="Tasa de asistencia"
        valor={tasa ? porcentaje(tasa.tasa) : cargando}
        nota="Asistieron ÷ citas con asistencia marcada"
        retraso={60}
      />
      <Indicador
        titulo="No asistieron"
        valor={tasa ? String(tasa.no_asistio) : cargando}
        nota="Citas marcadas como «No asistió»"
        retraso={120}
      />
      <Indicador
        titulo="Ingresos"
        valor={ingresos !== undefined ? colonesCorto(ingresos) : cargando}
        nota="De las citas atendidas"
        retraso={180}
      />
    </div>
  );
}
