import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api, ApiError } from "../../../shared/api/cliente";

export type Yo = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  rol: "admin" | "dentista";
  permisos: string[];
};

/** El usuario de la sesión, o null si no hay sesión (403). */
export function useYo() {
  return useQuery({
    queryKey: ["yo"],
    queryFn: async () => {
      try {
        return await api<Yo>("/auth/yo/");
      } catch (e) {
        if (e instanceof ApiError && (e.status === 403 || e.status === 401)) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { email: string; password: string }) =>
      api<Yo>("/auth/login/", { metodo: "POST", cuerpo: datos }),
    onSuccess: (yo) => qc.setQueryData(["yo"], yo),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api("/auth/logout/", { metodo: "POST" }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(["yo"], null);
      navigate("/panel/login", { replace: true });
    },
  });
}

export type ModoContrasena = "activar" | "restablecer";

/** Activa la cuenta o restablece la contraseña con el enlace del correo. */
export function useEstablecerContrasena(modo: ModoContrasena) {
  return useMutation({
    mutationFn: (datos: { uid: string; token: string; password: string }) =>
      api(`/auth/${modo}/`, { metodo: "POST", cuerpo: datos }),
  });
}

/** Pide el enlace para restablecer; el backend responde igual exista o no la cuenta. */
export function useRecuperar() {
  return useMutation({
    mutationFn: (datos: { email: string }) =>
      api("/auth/recuperar/", { metodo: "POST", cuerpo: datos }),
  });
}
