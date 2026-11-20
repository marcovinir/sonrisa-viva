import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FilaMes } from "../api";
import { COLORES, mesCorto, mesLargo } from "../formato";
import { useMovimiento, type PropsTooltip } from "./useMovimiento";

const SERIES = [
  { clave: "completadas", nombre: "Completadas" },
  { clave: "no_asistio", nombre: "No asistió" },
  { clave: "canceladas", nombre: "Canceladas" },
] as const;

const TINTA_2 = "#45555C";
const TINTA_3 = "#5C6A70";

type Punto = FilaMes & { etiqueta: string; suma: number };

function TooltipMes({ active, payload }: PropsTooltip) {
  if (!active || !payload?.length) return null;
  const fila = payload[0].payload as Punto;
  return (
    <div className="rounded-xl border border-borde bg-white px-3.5 py-2.5 text-[13px] shadow-[0_12px_24px_-14px_rgba(14,47,56,.5)]">
      <p className="m-0 mb-1.5 font-bold capitalize text-tinta">{mesLargo(fila.mes)}</p>
      {SERIES.map((s) => (
        <p key={s.clave} className="m-0 flex items-center gap-2 text-texto-2">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[3px]"
            style={{ background: COLORES[s.clave] }}
          />
          {s.nombre}
          <span className="ml-auto pl-4 font-bold tabular-nums text-tinta">{fila[s.clave]}</span>
        </p>
      ))}
    </div>
  );
}

function Leyenda() {
  return (
    <ul
      aria-label="Leyenda"
      className="m-0 flex list-none flex-wrap gap-4 p-0 text-xs text-texto-2"
    >
      {SERIES.map((s) => (
        <li key={s.clave} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-[3px]"
            style={{ background: COLORES[s.clave] }}
          />
          {s.nombre}
        </li>
      ))}
    </ul>
  );
}

/** Columnas apiladas por mes: completadas, no asistió y canceladas. */
export function GraficoMeses({ datos }: { datos: FilaMes[] }) {
  const animar = useMovimiento();
  const puntos: Punto[] = datos.map((d) => ({
    ...d,
    etiqueta: mesCorto(d.mes),
    suma: d.completadas + d.no_asistio + d.canceladas,
  }));
  const vacio = puntos.every((p) => p.suma === 0);

  return (
    <figure className="m-0 rounded-[18px] border border-borde bg-white p-[22px]">
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[17px] font-bold">Citas por mes</span>
        {vacio ? null : <Leyenda />}
      </figcaption>
      {vacio ? (
        <p className="m-0 text-sm text-texto-2">No hay citas en este rango.</p>
      ) : (
        <>
          <div aria-hidden="true" className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={puntos}
                margin={{ top: 22, right: 8, bottom: 0, left: -12 }}
                barCategoryGap="28%"
                accessibilityLayer={false}
              >
                <CartesianGrid vertical={false} stroke="#EEE9DF" />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={{ stroke: "#E6DED0" }}
                  tick={{ fill: TINTA_3, fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TINTA_3, fontSize: 12 }}
                />
                <Tooltip
                  content={TooltipMes}
                  cursor={{ fill: "#F4F1EA" }}
                  isAnimationActive={animar}
                />
                {SERIES.map((s, i) => (
                  <Bar
                    key={s.clave}
                    dataKey={s.clave}
                    name={s.nombre}
                    stackId="mes"
                    fill={COLORES[s.clave]}
                    // El trazo del color de la superficie hace de separación de 2 px entre segmentos.
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    maxBarSize={24}
                    radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                    isAnimationActive={animar}
                  >
                    {i === SERIES.length - 1 ? (
                      <LabelList
                        dataKey="suma"
                        position="top"
                        fill={TINTA_2}
                        fontSize={12}
                        fontWeight={700}
                      />
                    ) : null}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Un <table> ignora width: 1px; el div sr-only sí lo recorta. */}
          <div className="sr-only">
            <table>
              <caption>Citas por mes</caption>
              <thead>
                <tr>
                  <th scope="col">Mes</th>
                  {SERIES.map((s) => (
                    <th key={s.clave} scope="col">
                      {s.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {puntos.map((p) => (
                  <tr key={p.mes}>
                    <th scope="row">{mesLargo(p.mes)}</th>
                    {SERIES.map((s) => (
                      <td key={s.clave}>{p[s.clave]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </figure>
  );
}
