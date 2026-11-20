import { Link } from "react-router";
import { ORDEN_PASOS, type Paso } from "../estado";

const NOMBRES: Record<Paso, string> = {
  servicio: "Servicio",
  dentista: "Dentista",
  hora: "Día y hora",
  datos: "Tus datos",
};

export function Pasos({
  actual,
  faltante,
  hrefPaso,
}: {
  actual: Paso;
  faltante: Paso;
  hrefPaso: (p: Paso) => string;
}) {
  const iActual = ORDEN_PASOS.indexOf(actual);
  const iFaltante = ORDEN_PASOS.indexOf(faltante);
  return (
    <ol
      aria-label="Pasos de la reserva"
      className="m-0 mb-9 flex list-none flex-wrap gap-2 p-0 text-sm font-semibold"
    >
      {ORDEN_PASOS.map((p, i) => {
        const esActual = i === iActual;
        const hecho = !esActual && i < Math.max(iFaltante, iActual + 1) && i < iFaltante;
        const numero = (
          <span
            aria-hidden="true"
            className={`inline-flex size-[26px] items-center justify-center rounded-full text-xs ${
              esActual
                ? "animar-pulso bg-arena-claro text-tinta"
                : hecho
                  ? "bg-petroleo text-white"
                  : "bg-[#F1EEE8] text-texto-3"
            }`}
          >
            {hecho ? "✓" : i + 1}
          </span>
        );
        const clase = `animar-entrada flex items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-4 ${
          esActual
            ? "bg-tinta text-white"
            : hecho
              ? "bg-[#E3EEF0] text-tinta"
              : "border border-borde bg-white text-texto-3"
        }`;
        return (
          <li
            key={p}
            aria-current={esActual ? "step" : undefined}
            className={clase}
            style={{ ["--retraso" as string]: `${i * 50}ms` }}
          >
            {hecho ? (
              <Link
                to={hrefPaso(p)}
                className="-my-2.5 -ml-2.5 -mr-4 flex items-center gap-2.5 py-2.5 pl-2.5 pr-4 text-inherit no-underline"
              >
                {numero}
                {NOMBRES[p]}
                <span className="sr-only"> (cambiar)</span>
              </Link>
            ) : (
              <>
                {numero}
                {NOMBRES[p]}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
