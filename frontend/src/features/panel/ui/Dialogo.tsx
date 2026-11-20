import { useEffect, useId, useRef, type ReactNode } from "react";

/** Diálogo modal sobre <dialog> nativo: atrapa el foco y cierra con Esc. */
export function Dialogo({
  abierto,
  titulo,
  onCerrar,
  children,
  acciones,
  ancho = "max-w-lg",
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  acciones?: ReactNode;
  ancho?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.hasAttribute("open")) d.showModal();
    if (!abierto && d.hasAttribute("open")) d.close();
  }, [abierto]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const alCancelar = (e: Event) => {
      e.preventDefault();
      onCerrar();
    };
    d.addEventListener("cancel", alCancelar);
    return () => d.removeEventListener("cancel", alCancelar);
  }, [onCerrar]);

  if (!abierto) return null;
  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      className={`animar-in m-auto w-[calc(100%-2rem)] ${ancho} rounded-[22px] border border-borde bg-white p-0 text-tinta shadow-[0_30px_60px_-30px_rgba(14,47,56,.6)] backdrop:bg-tinta/40`}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="m-0 font-serif text-[28px] font-semibold leading-tight">
            {titulo}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="size-11 shrink-0 rounded-xl border border-borde bg-white text-lg"
          >
            ×
          </button>
        </div>
        <div className="text-[15px] leading-relaxed text-texto-2">{children}</div>
        {acciones ? (
          <div className="flex flex-wrap justify-end gap-2.5 pt-2">{acciones}</div>
        ) : null}
      </div>
    </dialog>
  );
}
