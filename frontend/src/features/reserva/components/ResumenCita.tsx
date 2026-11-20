import type { ReactNode } from "react";
import { colones, fechaLarga, hora } from "../../../shared/lib/formato";
import type { Servicio } from "../../../shared/api/catalogo";

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-[1.5px] text-[#A9BEC3]">{etiqueta}</dt>
      <dd className="m-0 mt-1 text-base font-semibold">{children}</dd>
    </div>
  );
}

/** Versión para pantallas pequeñas: va arriba del paso y se puede plegar. */
export function ResumenCitaMovil({
  servicio,
  nombreDentista,
  inicio,
}: {
  servicio?: Servicio;
  nombreDentista: string;
  inicio: string | null;
}) {
  const cuando = inicio
    ? `${fechaLarga(inicio).replace(/^./, (c) => c.toUpperCase())}, ${hora(inicio)}`
    : "Sin elegir";
  return (
    <details className="group mb-6 rounded-2xl bg-tinta text-marfil">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>{servicio ? `Tu cita: ${servicio.nombre}` : "Tu cita"}</span>
        <span className="flex items-center gap-2 text-arena-claro">
          {servicio ? colones(servicio.precio_colones) : null}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-open:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>
      <dl className="animar-in m-0 flex flex-col gap-3 border-t border-[#2B525C] px-5 pb-4 pt-3 text-sm">
        <Fila etiqueta="SERVICIO">
          {servicio ? `${servicio.nombre} · ${servicio.duracion_min} min` : "Sin elegir"}
        </Fila>
        <Fila etiqueta="DENTISTA">{nombreDentista}</Fila>
        <Fila etiqueta="DÍA Y HORA">{cuando}</Fila>
      </dl>
    </details>
  );
}

export function ResumenCita({
  servicio,
  nombreDentista,
  inicio,
  children,
}: {
  servicio?: Servicio;
  nombreDentista: string;
  inicio: string | null;
  children?: ReactNode;
}) {
  const cuando = inicio
    ? `${fechaLarga(inicio).replace(/^./, (c) => c.toUpperCase())}, ${hora(inicio)}`
    : "Sin elegir";
  return (
    <aside
      aria-label="Resumen de tu cita"
      className="animar-entrada flex flex-col gap-4 rounded-[22px] bg-tinta p-7 text-marfil lg:sticky lg:top-6"
      style={{ ["--retraso" as string]: "220ms" }}
    >
      <h2 className="m-0 font-serif text-[28px] font-medium">Tu cita</h2>
      <dl className="m-0 flex flex-col gap-3.5 text-sm">
        <Fila etiqueta="SERVICIO">
          {servicio ? `${servicio.nombre} · ${servicio.duracion_min} min` : "Sin elegir"}
        </Fila>
        <Fila etiqueta="DENTISTA">{nombreDentista}</Fila>
        <Fila etiqueta="DÍA Y HORA">{cuando}</Fila>
        <div className="border-t border-[#2B525C] pt-3.5">
          <dt className="text-xs font-bold tracking-[1.5px] text-[#A9BEC3]">PRECIO APROXIMADO</dt>
          <dd className="m-0 mt-1 font-serif text-[32px] font-semibold text-arena-claro">
            {servicio ? colones(servicio.precio_colones) : "—"}
          </dd>
        </div>
      </dl>
      {children}
      <p className="m-0 text-xs leading-normal text-[#A9BEC3]">
        Podrás cambiar o cancelar hasta 24 horas antes desde el enlace que te enviaremos por correo.
      </p>
    </aside>
  );
}
