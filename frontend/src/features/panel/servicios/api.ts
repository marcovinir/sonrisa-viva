import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api/cliente";
import type { Pagina } from "../agenda/api";

export type ServicioPanel = {
  id: number;
  categoria: number;
  nombre: string;
  slug: string;
  descripcion: string;
  duracion_min: number;
  precio_colones: number;
  activo: boolean;
};
export type DatosServicio = Omit<ServicioPanel, "id" | "slug">;
export type CategoriaPanel = { id: number; nombre: string; orden: number };

export function useServiciosPanel(activo: boolean) {
  return useQuery({
    queryKey: ["panel", "servicios", activo],
    queryFn: () =>
      api<Pagina<ServicioPanel>>("/panel/servicios/", {
        query: { activo: String(activo), tamano: 100 },
      }),
  });
}

export function useCategoriasPanel() {
  return useQuery({
    queryKey: ["panel", "categorias"],
    queryFn: () => api<Pagina<CategoriaPanel>>("/panel/categorias/", { query: { tamano: 100 } }),
  });
}

/** Tras cualquier cambio del catálogo se refrescan el panel y la web pública. */
function useRefrescarCatalogo() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [["panel", "servicios"], ["panel", "categorias"], ["servicios"], ["categorias"]].map(
        (queryKey) => qc.invalidateQueries({ queryKey }),
      ),
    );
}

export function useGuardarServicio() {
  const refrescar = useRefrescarCatalogo();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: Partial<DatosServicio> }) =>
      id
        ? api<ServicioPanel>(`/panel/servicios/${id}/`, { metodo: "PATCH", cuerpo: datos })
        : api<ServicioPanel>("/panel/servicios/", { metodo: "POST", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useBorrarServicio() {
  const refrescar = useRefrescarCatalogo();
  return useMutation({
    mutationFn: (id: number) => api(`/panel/servicios/${id}/`, { metodo: "DELETE" }),
    onSuccess: refrescar,
  });
}

export function useGuardarCategoria() {
  const refrescar = useRefrescarCatalogo();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: Partial<Omit<CategoriaPanel, "id">> }) =>
      id
        ? api<CategoriaPanel>(`/panel/categorias/${id}/`, { metodo: "PATCH", cuerpo: datos })
        : api<CategoriaPanel>("/panel/categorias/", { metodo: "POST", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useBorrarCategoria() {
  const refrescar = useRefrescarCatalogo();
  return useMutation({
    mutationFn: (id: number) => api(`/panel/categorias/${id}/`, { metodo: "DELETE" }),
    onSuccess: refrescar,
  });
}
