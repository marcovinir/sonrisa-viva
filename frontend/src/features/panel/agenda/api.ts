import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../../shared/api/cliente";
import { sumarDias, type BloqueHorario, type EstadoCita } from "./semana";

export type Pagina<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CitaPanel = {
  id: number;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  precio_colones: number;
  notas_internas: string;
  paciente: { id: number; nombre: string; apellidos: string; email: string; telefono: string };
  dentista: { id: number; nombre: string; apellidos: string };
  servicio: { id: number; nombre: string; duracion_min: number };
  creado_en: string;
};

export type Bloqueo = { id: number; dentista: number; inicio: string; fin: string; motivo: string };

export type DentistaPanel = {
  id: number;
  usuario: { id: number; email: string; nombre: string; apellidos: string; is_active: boolean };
  especialidad: string;
  biografia: string;
  foto_url: string;
  visible_en_web: boolean;
  servicios: number[];
  horarios: BloqueHorario[];
};

/** Citas de lunes a sábado; el admin pasa el dentista, el dentista ve las suyas. */
export function useCitasSemana(lunes: string, dentistaId?: number, activo = true) {
  return useQuery({
    queryKey: ["panel", "citas", "semana", lunes, dentistaId ?? null],
    queryFn: () =>
      api<Pagina<CitaPanel>>("/panel/citas/", {
        query: { desde: lunes, hasta: sumarDias(lunes, 5), dentista: dentistaId, tamano: 100 },
      }),
    enabled: activo,
  });
}

export function useBloqueos(desde: string, hasta: string, dentistaId?: number, activo = true) {
  return useQuery({
    queryKey: ["panel", "bloqueos", desde, hasta, dentistaId ?? null],
    queryFn: () =>
      api<Pagina<Bloqueo>>("/panel/bloqueos/", {
        query: { desde, hasta, dentista: dentistaId, tamano: 100 },
      }),
    enabled: activo,
  });
}

/** El perfil de dentista de la sesión, o null si la cuenta no tiene (un admin). */
export function useMiPerfil() {
  return useQuery({
    queryKey: ["panel", "mi-perfil"],
    queryFn: async () => {
      try {
        return await api<DentistaPanel>("/panel/mi-perfil/");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useDentistasPanel(activo = true) {
  return useQuery({
    queryKey: ["panel", "dentistas"],
    queryFn: () => api<Pagina<DentistaPanel>>("/panel/dentistas/", { query: { tamano: 100 } }),
    enabled: activo,
  });
}

/** Reemplaza la cita en todas las listas guardadas y luego vuelve a pedirlas. */
function useActualizarCita() {
  const qc = useQueryClient();
  return (cita: CitaPanel) => {
    qc.setQueriesData<Pagina<CitaPanel>>({ queryKey: ["panel", "citas"] }, (datos) =>
      datos?.results
        ? { ...datos, results: datos.results.map((c) => (c.id === cita.id ? cita : c)) }
        : datos,
    );
    void qc.invalidateQueries({ queryKey: ["panel", "citas"] });
  };
}

export function useCambiarEstado() {
  const actualizar = useActualizarCita();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoCita }) =>
      api<CitaPanel>(`/panel/citas/${id}/estado/`, { metodo: "POST", cuerpo: { estado } }),
    onSuccess: actualizar,
  });
}

export function useGuardarNotas() {
  const actualizar = useActualizarCita();
  return useMutation({
    mutationFn: ({ id, notas_internas }: { id: number; notas_internas: string }) =>
      api<CitaPanel>(`/panel/citas/${id}/`, { metodo: "PATCH", cuerpo: { notas_internas } }),
    onSuccess: actualizar,
  });
}

export function useCrearBloqueo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { inicio: string; fin: string; motivo: string; dentista?: number }) =>
      api<Bloqueo>("/panel/bloqueos/", { metodo: "POST", cuerpo: datos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel", "bloqueos"] }),
  });
}
