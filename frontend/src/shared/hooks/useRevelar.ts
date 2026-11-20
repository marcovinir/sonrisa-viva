import { useEffect, useRef } from "react";

/** Marca el elemento con data-visible="true" cuando entra en pantalla (una sola vez). */
export function useRevelar<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducir =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof IntersectionObserver !== "function" || reducir) {
      el.dataset.visible = "true";
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.dataset.visible = "true";
          observador.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return ref;
}
