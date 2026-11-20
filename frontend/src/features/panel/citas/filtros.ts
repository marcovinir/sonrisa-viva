import { useSearchParams } from "react-router";
import { NOMBRES_MES } from "../../../shared/lib/formato";

export const CLAVES_FILTRO = ["q", "desde", "hasta", "dentista", "estado", "servicio"] as const;
export type ClaveFiltro = (typeof CLAVES_FILTRO)[number];
export type FiltrosCitas = Record<ClaveFiltro, string> & { page: number };

export const ESTADOS_FILTRO = [
  { valor: "confirmada", texto: "Confirmada" },
  { valor: "completada", texto: "Asistió" },
  { valor: "no_asistio", texto: "No asistió" },
  { valor: "cancelada", texto: "Cancelada" },
];

const mes = (iso: string) => NOMBRES_MES[Number(iso.slice(5, 7)) - 1].slice(0, 3);
const dia = (iso: string) => Number(iso.slice(8, 10));

/** «2–7 mar», «28 feb – 3 mar», «Desde 2 mar» o «Hasta 7 mar». */
export function textoFechas(desde: string, hasta: string): string {
  if (desde && hasta) {
    return desde.slice(0, 7) === hasta.slice(0, 7)
      ? `${dia(desde)}–${dia(hasta)} ${mes(hasta)}`
      : `${dia(desde)} ${mes(desde)} – ${dia(hasta)} ${mes(hasta)}`;
  }
  return desde ? `Desde ${dia(desde)} ${mes(desde)}` : `Hasta ${dia(hasta)} ${mes(hasta)}`;
}

/** Filtros de la lista de citas guardados en la URL (sobreviven a recargar y se comparten). */
export function useFiltrosCitas() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    ...(Object.fromEntries(CLAVES_FILTRO.map((k) => [k, params.get(k) ?? ""])) as Record<
      ClaveFiltro,
      string
    >),
    page: Math.max(1, Number(params.get("page")) || 1),
  } satisfies FiltrosCitas;

  const escribir = (cambios: Partial<Record<ClaveFiltro | "page", string>>) => {
    const siguiente = new URLSearchParams(params);
    for (const [k, v] of Object.entries(cambios)) {
      if (v) siguiente.set(k, v);
      else siguiente.delete(k);
    }
    // Cualquier cambio de filtro vuelve a la primera página.
    if (!("page" in cambios) || cambios.page === "1") siguiente.delete("page");
    setParams(siguiente, { replace: true });
  };

  return {
    filtros,
    activos: CLAVES_FILTRO.some((k) => filtros[k]),
    cambiar: (cambios: Partial<Record<ClaveFiltro, string>>) => escribir(cambios),
    quitar: (...claves: ClaveFiltro[]) => escribir(Object.fromEntries(claves.map((k) => [k, ""]))),
    limpiar: () => setParams(new URLSearchParams(), { replace: true }),
    irAPagina: (page: number) => escribir({ page: String(page) }),
  };
}
