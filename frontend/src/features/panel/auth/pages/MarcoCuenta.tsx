import { useEffect, type ReactNode } from "react";
import { PanelDecorativo } from "./PanelDecorativo";

/** Dos columnas de las pantallas de cuenta (login, activar, recuperar): decorativa + contenido. */
export function MarcoCuenta({
  tituloPestana,
  decorativo,
  children,
}: {
  tituloPestana: string;
  decorativo: { titulo: string; destacado: string; texto: string };
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${tituloPestana} · Panel Sonrisa Viva`;
  }, [tituloPestana]);

  return (
    <div className="flex min-h-screen flex-wrap bg-marfil font-sans text-tinta">
      <PanelDecorativo {...decorativo} />
      <section className="flex flex-[1_1_480px] items-center justify-center px-8 py-14">
        <div className="flex w-full max-w-[400px] flex-col gap-5">{children}</div>
      </section>
    </div>
  );
}

/** Encabezado de una pantalla de cuenta. */
export function EncabezadoCuenta({ titulo, texto }: { titulo: string; texto: ReactNode }) {
  return (
    <div className="animar-entrada">
      <h1 className="m-0 font-serif text-[40px] font-medium leading-tight">{titulo}</h1>
      <p className="m-0 mt-1.5 text-[15px] leading-relaxed text-texto-2">{texto}</p>
    </div>
  );
}

export function AlertaCuenta({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="animar-temblor m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3.5 text-sm font-semibold text-peligro"
    >
      {children}
    </p>
  );
}
