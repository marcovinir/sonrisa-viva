import { useCallback } from "react";
import { useSearchParams } from "react-router";

export type Paso = "servicio" | "dentista" | "hora" | "datos";
export const ORDEN_PASOS: Paso[] = ["servicio", "dentista", "hora", "datos"];
export type DentistaElegido = number | "cualquiera";

type Cambios = {
  servicio?: number | null;
  dentista?: DentistaElegido | null;
  fecha?: string | null;
  inicio?: string | null;
  aviso?: string | null;
};

const numero = (v: string | null) => {
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Estado del asistente guardado en la URL (?servicio, ?dentista, ?fecha, ?inicio, ?paso):
 * el botón atrás del navegador y los enlaces profundos funcionan sin estado extra.
 */
export function useAsistente() {
  const [params, setParams] = useSearchParams();
  const servicioId = numero(params.get("servicio"));
  const crudo = params.get("dentista");
  const dentista: DentistaElegido | null = crudo === "cualquiera" ? "cualquiera" : numero(crudo);
  const fecha = params.get("fecha");
  const inicio = params.get("inicio");

  const faltante: Paso = !servicioId
    ? "servicio"
    : !dentista
      ? "dentista"
      : !inicio
        ? "hora"
        : "datos";
  const pedido = params.get("paso") as Paso | null;
  const paso: Paso =
    pedido &&
    ORDEN_PASOS.includes(pedido) &&
    ORDEN_PASOS.indexOf(pedido) < ORDEN_PASOS.indexOf(faltante)
      ? pedido
      : faltante;

  const hrefPaso = useCallback(
    (p: Paso) => {
      const nuevos = new URLSearchParams(params);
      nuevos.set("paso", p);
      return `?${nuevos.toString()}`;
    },
    [params],
  );

  const elegir = useCallback(
    (cambios: Cambios) => {
      setParams((actuales) => {
        const nuevos = new URLSearchParams(actuales);
        nuevos.delete("paso");
        nuevos.delete("aviso");
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor === null || valor === undefined) nuevos.delete(clave);
          else nuevos.set(clave, String(valor));
        }
        return nuevos;
      });
    },
    [setParams],
  );

  const ir = useCallback(
    (p: Paso) =>
      setParams((actuales) => {
        const nuevos = new URLSearchParams(actuales);
        nuevos.set("paso", p);
        return nuevos;
      }),
    [setParams],
  );

  const aviso = params.get("aviso");
  return { paso, faltante, servicioId, dentista, fecha, inicio, aviso, elegir, ir, hrefPaso };
}
