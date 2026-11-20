import { useQuery } from "@tanstack/react-query";
import { api } from "../../../shared/api/cliente";

export type NombreReporte =
  | "citas-por-servicio"
  | "citas-por-categoria"
  | "citas-por-dentista"
  | "citas-por-mes"
  | "tasa-asistencia";

export type FilaServicio = {
  id: number;
  nombre: string;
  total: number;
  completadas: number;
  ingresos_colones: number;
};
export type FilaDentista = FilaServicio & { apellidos: string; no_asistio: number };
export type FilaMes = {
  mes: string; // «2026-03»
  total: number;
  completadas: number;
  canceladas: number;
  no_asistio: number;
};
export type Tasa = { completadas: number; no_asistio: number; tasa: number | null };

export function useReporte<T>(nombre: NombreReporte, desde: string, hasta: string) {
  return useQuery({
    queryKey: ["panel", "reportes", nombre, desde, hasta],
    queryFn: () => api<T>(`/panel/reportes/${nombre}/`, { query: { desde, hasta } }),
  });
}
