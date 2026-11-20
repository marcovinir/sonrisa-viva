import { useEffect, type ReactNode } from "react";

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${titulo} · Panel Sonrisa Viva`;
  }, [titulo]);
  return (
    <div className="animar-entrada mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 font-serif text-[40px] font-medium leading-tight">{titulo}</h1>
        {descripcion ? <p className="m-0 mt-0.5 text-sm text-texto-2">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex flex-wrap items-center gap-2.5">{acciones}</div> : null}
    </div>
  );
}
