import { colones } from "../../../../shared/lib/formato";
import type { FilaDentista } from "../api";
import { porcentaje } from "../formato";

const tasaDe = (d: FilaDentista) =>
  d.completadas + d.no_asistio ? d.completadas / (d.completadas + d.no_asistio) : null;

export function TablaDentistas({ datos }: { datos: FilaDentista[] }) {
  const filas = [...datos].sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
  return (
    <section
      aria-labelledby="reporte-dentistas"
      className="flex flex-col gap-1.5 rounded-[18px] border border-borde bg-white p-[22px]"
    >
      <h2 id="reporte-dentistas" className="m-0 mb-2 text-[17px] font-bold">
        Por dentista
      </h2>
      {filas.length === 0 ? (
        <p className="m-0 text-sm text-texto-2">No hay citas en este rango.</p>
      ) : (
        <div className="overflow-x-auto">
          <table aria-labelledby="reporte-dentistas" className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs tracking-[1px] text-texto-2">
                <th scope="col" className="py-2 font-bold">
                  DENTISTA
                </th>
                <th scope="col" className="py-2 text-right font-bold">
                  CITAS
                </th>
                <th scope="col" className="py-2 text-right font-bold">
                  ASISTENCIA
                </th>
                <th scope="col" className="py-2 text-right font-bold">
                  INGRESOS
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((d) => (
                <tr key={d.id} className="border-t border-[#F1EEE8]">
                  <th scope="row" className="py-3 pr-3 text-left font-semibold">
                    {d.nombre} {d.apellidos}
                  </th>
                  <td className="py-3 text-right tabular-nums">{d.total}</td>
                  <td className="py-3 text-right tabular-nums">{porcentaje(tasaDe(d))}</td>
                  <td className="py-3 text-right font-bold tabular-nums">
                    {colones(d.ingresos_colones)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
