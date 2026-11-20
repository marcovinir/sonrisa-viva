import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "../shared/api/cliente";

/**
 * Cliente de TanStack Query. Si una consulta del panel (clave que empieza por "panel")
 * responde 403, la sesión expiró: se invalida ["yo"] y las rutas protegidas mandan al login.
 */
export function crearQueryClient({ pruebas = false }: { pruebas?: boolean } = {}) {
  const cliente: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.queryKey[0] === "panel" && error instanceof ApiError && error.status === 403) {
          cliente.invalidateQueries({ queryKey: ["yo"] });
        }
      },
    }),
    defaultOptions: pruebas
      ? { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } }
      : {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
  });
  return cliente;
}
