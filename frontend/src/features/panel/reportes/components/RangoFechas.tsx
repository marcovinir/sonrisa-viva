import { useState, type FormEvent } from "react";
import { Boton } from "../../../../shared/ui/Boton";

const CONTROL =
  "min-h-11 rounded-xl border-[1.5px] bg-white px-2.5 text-sm font-medium text-tinta " +
  "focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none";

/** Desde y hasta del reporte; se aplican con el botón (los dos juntos). */
export function RangoFechas({
  desde,
  hasta,
  errorDesde,
  onAplicar,
}: {
  desde: string;
  hasta: string;
  errorDesde?: string;
  onAplicar: (desde: string, hasta: string) => void;
}) {
  const [valores, setValores] = useState({ desde, hasta });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (valores.desde && valores.hasta) onAplicar(valores.desde, valores.hasta);
  };
  return (
    <form
      aria-label="Rango de fechas"
      onSubmit={enviar}
      className="flex flex-wrap items-start gap-2.5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reporte-desde" className="text-[13px] font-bold">
          Desde
        </label>
        <input
          id="reporte-desde"
          type="date"
          value={valores.desde}
          onChange={(e) => setValores((v) => ({ ...v, desde: e.target.value }))}
          aria-invalid={errorDesde ? true : undefined}
          aria-describedby={errorDesde ? "reporte-desde-error" : undefined}
          className={`${CONTROL} ${errorDesde ? "border-error" : "border-[#CFC3AE]"}`}
        />
        {errorDesde ? (
          <p id="reporte-desde-error" className="m-0 max-w-44 text-[13px] font-semibold text-error">
            {errorDesde}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reporte-hasta" className="text-[13px] font-bold">
          Hasta
        </label>
        <input
          id="reporte-hasta"
          type="date"
          value={valores.hasta}
          onChange={(e) => setValores((v) => ({ ...v, hasta: e.target.value }))}
          className={`${CONTROL} border-[#CFC3AE]`}
        />
      </div>
      <Boton type="submit" className="mt-[26px]">
        Aplicar
      </Boton>
    </form>
  );
}
