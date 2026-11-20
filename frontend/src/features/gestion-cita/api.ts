import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../shared/api/cliente";
import type { CitaResumen } from "../reserva/api";

export type CitaGestion = CitaResumen & { puede_cambiar: boolean };

const clave = (token: string) => ["cita", token];

export function useCita(token: string) {
  return useQuery({
    queryKey: clave(token),
    queryFn: () => api<CitaGestion>(`/citas/gestion/${encodeURIComponent(token)}/`),
    retry: (intentos, error) =>
      !(error instanceof ApiError && error.status === 404) && intentos < 1,
  });
}

export function useReprogramar(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inicio: string) =>
      api<CitaGestion>(`/citas/gestion/${encodeURIComponent(token)}/`, {
        metodo: "PATCH",
        cuerpo: { inicio },
      }),
    onSuccess: (cita) => {
      qc.setQueryData(clave(token), cita);
      qc.invalidateQueries({ queryKey: ["horas"] });
      qc.invalidateQueries({ queryKey: ["dias"] });
    },
  });
}

export function useCancelar(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/citas/gestion/${encodeURIComponent(token)}/`, { metodo: "DELETE" }),
    onSuccess: () =>
      qc.setQueryData<CitaGestion>(clave(token), (c) =>
        c ? { ...c, estado: "cancelada", puede_cambiar: false } : c,
      ),
  });
}
