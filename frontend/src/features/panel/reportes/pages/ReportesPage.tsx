import { useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "../../../../shared/api/cliente";
import { isoDia } from "../../../../shared/lib/formato";
import { EstadoError } from "../../../../shared/ui/Estado";
import { EncabezadoPagina } from "../../ui/EncabezadoPagina";
import { useReporte, type FilaDentista, type FilaMes, type FilaServicio, type Tasa } from "../api";
import { GraficoMeses } from "../components/GraficoMeses";
import { GraficoServicios } from "../components/GraficoServicios";
import { Indicadores } from "../components/Indicadores";
import { RangoFechas } from "../components/RangoFechas";
import { TablaDentistas } from "../components/TablaDentistas";
import { desdePorDefecto } from "../formato";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function ReportesPage() {
  const [params, setParams] = useSearchParams();
  const [hoy] = useState(() => isoDia(new Date()));
  const desdeParam = params.get("desde") ?? "";
  const hastaParam = params.get("hasta") ?? "";
  const desde = FECHA.test(desdeParam) ? desdeParam : desdePorDefecto(hoy);
  const hasta = FECHA.test(hastaParam) ? hastaParam : hoy;
  const porDefecto = !params.has("desde") && !params.has("hasta");

  const tasa = useReporte<Tasa>("tasa-asistencia", desde, hasta);
  const meses = useReporte<FilaMes[]>("citas-por-mes", desde, hasta);
  const servicios = useReporte<FilaServicio[]>("citas-por-servicio", desde, hasta);
  const dentistas = useReporte<FilaDentista[]>("citas-por-dentista", desde, hasta);

  // Un rango inválido hace fallar las cuatro consultas por igual: el error va al campo.
  const errorRango =
    tasa.error instanceof ApiError ? tasa.error.campos.desde?.join(" ") : undefined;
  const otroError = [tasa, meses, servicios, dentistas].find((q) => q.isError && !errorRango);
  const ingresos = servicios.data?.reduce((s, f) => s + f.ingresos_colones, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes"
        descripcion={porDefecto ? "Últimos 6 meses" : `Del ${desde} al ${hasta}`}
        acciones={
          <RangoFechas
            key={`${desde}|${hasta}`}
            desde={desde}
            hasta={hasta}
            errorDesde={errorRango}
            onAplicar={(d, h) => setParams({ desde: d, hasta: h }, { replace: true })}
          />
        }
      />
      {errorRango ? (
        <p className="m-0 rounded-2xl border border-borde bg-white p-6 text-texto-2">
          Corrige el rango de fechas para ver los reportes.
        </p>
      ) : otroError ? (
        <EstadoError error={otroError.error} onReintentar={() => void otroError.refetch()} />
      ) : (
        <div className="flex flex-col gap-[22px]">
          <Indicadores tasa={tasa.data} ingresos={ingresos} />
          {meses.data ? <GraficoMeses datos={meses.data} /> : <Cargando />}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-[22px]">
            {servicios.data ? <GraficoServicios datos={servicios.data} /> : <Cargando />}
            {dentistas.data ? <TablaDentistas datos={dentistas.data} /> : <Cargando />}
          </div>
        </div>
      )}
    </>
  );
}

const Cargando = () => (
  <p className="m-0 rounded-[18px] border border-borde bg-white p-6 text-sm text-texto-2">
    Cargando…
  </p>
);
