import type { ReactNode } from "react";
import { ApiError } from "../api/cliente";
import { Boton } from "./Boton";
import { Diente } from "./Diente";

export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`esqueleto rounded-2xl bg-[#EFE8DB] ${className}`} />;
}

export function EstadoVacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string;
  texto: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#CFC3AE] px-6 py-8 text-center">
      <Diente tamano={30} trazo="#B8935A" />
      <p className="m-0 font-bold">{titulo}</p>
      <p className="m-0 text-sm text-texto-2">{texto}</p>
      {accion}
    </div>
  );
}

export function EstadoError({
  error,
  onReintentar,
}: {
  error: unknown;
  onReintentar?: () => void;
}) {
  const detalle = error instanceof ApiError ? error.detalle : "Algo salió mal. Intenta de nuevo.";
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] p-4 text-[#8C1D18]"
    >
      <p className="m-0 text-sm font-semibold">{detalle}</p>
      {onReintentar ? (
        <Boton variante="claro" onClick={onReintentar}>
          Reintentar
        </Boton>
      ) : null}
    </div>
  );
}
