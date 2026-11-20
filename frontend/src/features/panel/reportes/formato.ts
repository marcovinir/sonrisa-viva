import { colones, NOMBRES_MES } from "../../../shared/lib/formato";

/** Colores por resultado (paleta validada con dataviz; ver el PR #75). */
export const COLORES = {
  completadas: "#13505F",
  no_asistio: "#A9803F",
  canceladas: "#D5DCDE",
} as const;

/** 0.892 → «89,2 %»; null → «—». */
export const porcentaje = (tasa: number | null) =>
  tasa === null ? "—" : `${(tasa * 100).toFixed(1).replace(".", ",")} %`;

/** A partir de un millón: «₡6,1 M»; si no, el monto completo. */
export const colonesCorto = (monto: number) =>
  monto >= 1_000_000 ? `₡${(monto / 1_000_000).toFixed(1).replace(".", ",")} M` : colones(monto);

/** «2026-03» → «Mar». */
export const mesCorto = (mes: string) => {
  const nombre = NOMBRES_MES[Number(mes.slice(5, 7)) - 1];
  return nombre[0].toUpperCase() + nombre.slice(1, 3);
};

/** «2026-03» → «marzo 2026». */
export const mesLargo = (mes: string) =>
  `${NOMBRES_MES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`;

/** Primer día del mes de hace 5 meses: seis meses contando el actual (igual que el backend). */
export function desdePorDefecto(hoy: string): string {
  let anio = Number(hoy.slice(0, 4));
  let mes = Number(hoy.slice(5, 7)) - 5;
  if (mes < 1) {
    mes += 12;
    anio -= 1;
  }
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}
