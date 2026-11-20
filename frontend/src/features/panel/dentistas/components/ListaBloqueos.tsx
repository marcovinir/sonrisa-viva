import { useState } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { isoDia } from "../../../../shared/lib/formato";
import { Boton } from "../../../../shared/ui/Boton";
import { EstadoError } from "../../../../shared/ui/Estado";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import { useBloqueos, type Bloqueo } from "../../agenda/api";
import { DialogoBloqueo } from "../../agenda/components/DialogoBloqueo";
import { fechaCorta, horaCorta } from "../../agenda/semana";
import { useBorrarBloqueo } from "../api";

const rango = (b: Bloqueo) =>
  isoDia(new Date(b.inicio)) === isoDia(new Date(b.fin))
    ? `${fechaCorta(b.inicio)} · ${horaCorta(b.inicio)} – ${horaCorta(b.fin)}`
    : `${fechaCorta(b.inicio)} ${horaCorta(b.inicio)} – ${fechaCorta(b.fin)} ${horaCorta(b.fin)}`;

/** Pestaña «Bloqueos»: los próximos bloqueos del dentista. */
export function ListaBloqueos({ dentistaId }: { dentistaId: number }) {
  const [hoy] = useState(() => isoDia(new Date()));
  const bloqueos = useBloqueos(hoy, "", dentistaId);
  const borrar = useBorrarBloqueo();
  const { mostrar } = useAviso();
  const [nuevo, setNuevo] = useState(false);
  const [aQuitar, setAQuitar] = useState<Bloqueo | null>(null);
  const lista = [...(bloqueos.data?.results ?? [])].sort((a, b) =>
    a.inicio.localeCompare(b.inicio),
  );

  const quitar = () => {
    if (!aQuitar) return;
    borrar.mutate(aQuitar.id, {
      onSuccess: () => mostrar("Bloqueo quitado"),
      onError: (e) =>
        mostrar(e instanceof ApiError ? e.detalle : "No pudimos quitar el bloqueo.", "error"),
      onSettled: () => setAQuitar(null),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-texto-2">
          En estos rangos no se pueden reservar citas con este dentista.
        </p>
        <Boton onClick={() => setNuevo(true)}>+ Bloquear</Boton>
      </div>
      {bloqueos.isError ? (
        <EstadoError error={bloqueos.error} onReintentar={() => void bloqueos.refetch()} />
      ) : bloqueos.isPending ? (
        <p className="m-0 text-sm text-texto-2">Cargando bloqueos…</p>
      ) : lista.length === 0 ? (
        <p className="m-0 rounded-xl bg-marfil px-4 py-3 text-sm text-texto-2">
          No tiene bloqueos próximos.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {lista.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-l-[5px] border-arena px-4 py-3"
              style={{
                background:
                  "repeating-linear-gradient(45deg,#EFE8DB 0,#EFE8DB 6px,#F8F5EF 6px,#F8F5EF 12px)",
              }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#4A3A22]">{rango(b)}</div>
                <div className="truncate text-sm font-semibold">
                  {b.motivo || "Horario bloqueado"}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Quitar bloqueo ${b.motivo || rango(b)}`}
                onClick={() => setAQuitar(b)}
                className="min-h-11 rounded-full bg-white px-4 text-[13px] font-bold text-peligro"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <DialogoBloqueo
        abierto={nuevo}
        onCerrar={() => setNuevo(false)}
        diaInicial={hoy}
        dentistaId={dentistaId}
      />
      <Dialogo
        abierto={aQuitar !== null}
        titulo="¿Quitar este bloqueo?"
        onCerrar={() => setAQuitar(null)}
        acciones={
          <>
            <Boton variante="claro" onClick={() => setAQuitar(null)}>
              No, volver
            </Boton>
            <Boton
              variante="peligro"
              onClick={quitar}
              cargando={borrar.isPending}
              textoCargando="Quitando…"
            >
              Sí, quitar
            </Boton>
          </>
        }
      >
        <p className="m-0">
          {aQuitar ? `${rango(aQuitar)}. ` : ""}Ese horario vuelve a quedar disponible para
          reservar.
        </p>
      </Dialogo>
    </div>
  );
}
