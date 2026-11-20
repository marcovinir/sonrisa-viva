import type { CSSProperties, ElementType, ReactNode } from "react";
import { useRevelar } from "../hooks/useRevelar";

/** Envuelve contenido que aparece al entrar en pantalla (con retraso opcional para escalonar). */
export function Revelar({
  as: Etiqueta = "div",
  retraso = 0,
  className = "",
  children,
  ...resto
}: {
  as?: ElementType;
  retraso?: number;
  className?: string;
  children: ReactNode;
  [prop: string]: unknown;
}) {
  const ref = useRevelar<HTMLElement>();
  const estilo = { "--retraso": `${retraso}ms` } as CSSProperties;
  return (
    <Etiqueta ref={ref} className={`revelar ${className}`} style={estilo} {...resto}>
      {children}
    </Etiqueta>
  );
}
