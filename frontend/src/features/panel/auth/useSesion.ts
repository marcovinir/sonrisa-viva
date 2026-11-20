import { useCallback } from "react";
import { useYo } from "./api";

export function useSesion() {
  const { data, isPending } = useYo();
  const yo = data ?? null;
  const puede = useCallback((codigo: string) => Boolean(yo?.permisos.includes(codigo)), [yo]);
  const puedeAlguno = useCallback(
    (codigos: string[]) => codigos.length === 0 || codigos.some((c) => yo?.permisos.includes(c)),
    [yo],
  );
  return { yo, cargando: isPending, puede, puedeAlguno };
}
