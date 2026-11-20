import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../../shared/api/cliente";
import type { CitaPanel, Pagina } from "../agenda/api";
import type { FiltrosCitas } from "./filtros";

/** Lista paginada del panel, más recientes primero. */
export function useCitas(filtros: FiltrosCitas) {
  return useQuery({
    queryKey: ["panel", "citas", "lista", filtros],
    queryFn: () =>
      api<Pagina<CitaPanel>>("/panel/citas/", {
        query: { ...filtros, page: filtros.page > 1 ? filtros.page : undefined, orden: "-inicio" },
      }),
    placeholderData: keepPreviousData,
  });
}
