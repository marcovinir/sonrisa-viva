import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api/cliente";
import type { DentistaPanel, Pagina } from "../agenda/api";
import type { BloqueHorario } from "../agenda/semana";
import type { ServicioPanel } from "../servicios/api";

export type DatosPerfil = Pick<
  DentistaPanel,
  "especialidad" | "biografia" | "foto_url" | "visible_en_web" | "servicios"
>;

/** Todos los servicios (activos e inactivos) para elegir los que hace cada dentista. */
export function useServiciosTodos() {
  return useQuery({
    queryKey: ["panel", "servicios", "todos"],
    queryFn: () => api<Pagina<ServicioPanel>>("/panel/servicios/", { query: { tamano: 100 } }),
  });
}

/** Tras cambiar un dentista se refrescan el panel, la agenda y la web pública. */
function useRefrescarDentistas() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [["panel", "dentistas"], ["panel", "mi-perfil"], ["dentistas"]].map((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      ),
    );
}

export function useGuardarPerfil() {
  const refrescar = useRefrescarDentistas();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: DatosPerfil }) =>
      api<DentistaPanel>(`/panel/dentistas/${id}/`, { metodo: "PATCH", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useGuardarHorario() {
  const refrescar = useRefrescarDentistas();
  return useMutation({
    mutationFn: ({ id, horarios }: { id: number; horarios: BloqueHorario[] }) =>
      api<BloqueHorario[]>(`/panel/dentistas/${id}/horarios/`, { metodo: "PUT", cuerpo: horarios }),
    onSuccess: refrescar,
  });
}

export function useBorrarBloqueo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/panel/bloqueos/${id}/`, { metodo: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel", "bloqueos"] }),
  });
}
