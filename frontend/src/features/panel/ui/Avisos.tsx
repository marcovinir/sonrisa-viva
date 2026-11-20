import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { AvisosContexto, type TipoAviso } from "./avisosContexto";

type Aviso = { id: number; texto: string; tipo: TipoAviso };

const ESTILOS: Record<TipoAviso, string> = {
  exito: "border-[#BFD9C3] bg-[#EAF3EA] text-[#1F4A28]",
  error: "border-[#E2B9B5] bg-[#FBF1F0] text-peligro",
  info: "border-[#BFD6DA] bg-[#E3EEF0] text-tinta",
};

/** Avisos efímeros (toasts) con aria-live; se ocultan solos a los 5 s. */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(1);

  const mostrar = useCallback((texto: string, tipo: TipoAviso = "exito") => {
    const id = siguiente.current++;
    setAvisos((a) => [...a, { id, texto, tipo }]);
    window.setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 5000);
  }, []);
  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <AvisosContexto.Provider value={valor}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2"
      >
        {avisos.map((a) => (
          <p
            key={a.id}
            className={`animar-in pointer-events-auto m-0 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${ESTILOS[a.tipo]}`}
          >
            {a.texto}
          </p>
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}
