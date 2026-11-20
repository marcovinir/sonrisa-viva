import { useState } from "react";

/** false si la persona pidió reducir el movimiento (las animaciones de los gráficos se apagan). */
export function useMovimiento() {
  const [animar] = useState(
    () =>
      !(
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ),
  );
  return animar;
}

/** Lo que los tooltips propios usan de las props que pasa Recharts. */
export type PropsTooltip = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> };
