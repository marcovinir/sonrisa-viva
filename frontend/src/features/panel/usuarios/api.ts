import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api/cliente";
import type { CitaPanel, Pagina } from "../agenda/api";

export type UsuarioPanel = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  rol: "admin" | "dentista";
  is_active: boolean;
  activado: boolean;
  creado_en: string;
};
export type NuevoUsuario = Pick<UsuarioPanel, "email" | "nombre" | "apellidos" | "rol">;
export type FiltrosUsuarios = { q: string; rol: string; activo: string; page: number };
export type AccionUsuario = "desactivar" | "reactivar" | "reenviar-activacion";

export function useUsuarios(filtros: FiltrosUsuarios) {
  return useQuery({
    queryKey: ["panel", "usuarios", filtros],
    queryFn: () =>
      api<Pagina<UsuarioPanel>>("/panel/usuarios/", {
        query: { ...filtros, page: filtros.page > 1 ? filtros.page : undefined },
      }),
    placeholderData: keepPreviousData,
  });
}

/** Un cambio de usuario puede afectar a los dentistas (nuevo perfil, cuenta inactiva). */
function useRefrescarUsuarios() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [
        ["panel", "usuarios"],
        ["panel", "dentistas"],
      ].map((queryKey) => qc.invalidateQueries({ queryKey })),
    );
}

export function useCrearUsuario() {
  const refrescar = useRefrescarUsuarios();
  return useMutation({
    mutationFn: (datos: NuevoUsuario) =>
      api<UsuarioPanel>("/panel/usuarios/", { metodo: "POST", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useEditarUsuario() {
  const refrescar = useRefrescarUsuarios();
  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number;
      datos: Pick<UsuarioPanel, "nombre" | "apellidos">;
    }) => api<UsuarioPanel>(`/panel/usuarios/${id}/`, { metodo: "PATCH", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useAccionUsuario() {
  const refrescar = useRefrescarUsuarios();
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: AccionUsuario }) =>
      api<UsuarioPanel>(`/panel/usuarios/${id}/${accion}/`, { metodo: "POST" }),
    onSuccess: refrescar,
  });
}

/** Cuántas citas confirmadas tiene un dentista desde hoy (solo interesa el total). */
export function useCitasFuturas(dentistaId: number | undefined, desde: string) {
  return useQuery({
    queryKey: ["panel", "citas", "futuras", dentistaId, desde],
    queryFn: () =>
      api<Pagina<CitaPanel>>("/panel/citas/", {
        query: { dentista: dentistaId, estado: "confirmada", desde, tamano: 1 },
      }),
    enabled: dentistaId !== undefined,
  });
}
