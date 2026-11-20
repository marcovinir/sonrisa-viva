import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FilaServicio } from "../api";
import { COLORES } from "../formato";
import { useMovimiento, type PropsTooltip } from "./useMovimiento";

const ALTO_FILA = 40;

function TooltipServicio({ active, payload }: PropsTooltip) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload as FilaServicio;
  return (
    <div className="rounded-xl border border-borde bg-white px-3.5 py-2.5 text-[13px] shadow-[0_12px_24px_-14px_rgba(14,47,56,.5)]">
      <p className="m-0 mb-1 font-bold text-tinta">{s.nombre}</p>
      <p className="m-0 text-texto-2">
        <span className="font-bold tabular-nums text-tinta">{s.total}</span> citas ·{" "}
        <span className="font-bold tabular-nums text-tinta">{s.completadas}</span> atendidas
      </p>
    </div>
  );
}

/** Barras horizontales con los 6 servicios con más citas (una sola serie: sin leyenda). */
export function GraficoServicios({ datos }: { datos: FilaServicio[] }) {
  const animar = useMovimiento();
  const top = [...datos].sort((a, b) => b.total - a.total).slice(0, 6);

  return (
    <figure className="m-0 flex flex-col gap-3.5 rounded-[18px] border border-borde bg-white p-[22px]">
      <figcaption className="text-[17px] font-bold">
        Citas por servicio
        {datos.length > 6 ? (
          <span className="ml-2 text-[13px] font-normal text-texto-3">los 6 con más citas</span>
        ) : null}
      </figcaption>
      {top.length === 0 ? (
        <p className="m-0 text-sm text-texto-2">No hay citas en este rango.</p>
      ) : (
        <>
          <div aria-hidden="true" style={{ height: top.length * ALTO_FILA + 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={top}
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                accessibilityLayer={false}
              >
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={150}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#0E2F38", fontSize: 13, fontWeight: 600 }}
                />
                <Tooltip
                  content={TooltipServicio}
                  cursor={{ fill: "#F4F1EA" }}
                  isAnimationActive={animar}
                />
                <Bar
                  dataKey="total"
                  fill={COLORES.completadas}
                  barSize={14}
                  radius={[0, 4, 4, 0]}
                  background={{ fill: "#F1EEE8", radius: 4 }}
                  isAnimationActive={animar}
                >
                  <LabelList
                    dataKey="total"
                    position="right"
                    fill="#0E2F38"
                    fontSize={13}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="sr-only">
            <caption>Citas por servicio</caption>
            <thead>
              <tr>
                <th scope="col">Servicio</th>
                <th scope="col">Citas</th>
                <th scope="col">Atendidas</th>
              </tr>
            </thead>
            <tbody>
              {top.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.nombre}</th>
                  <td>{s.total}</td>
                  <td>{s.completadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
