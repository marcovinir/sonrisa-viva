import { useEffect, useRef, useState } from "react";
import { fechaLarga, hora } from "../../../shared/lib/formato";
import { Boton } from "../../../shared/ui/Boton";
import { EstadoError } from "../../../shared/ui/Estado";
import { useCancelar, type CitaGestion } from "../api";

export function Cancelar({ token, cita }: { token: string; cita: CitaGestion }) {
  const [confirmando, setConfirmando] = useState(false);
  const mantener = useRef<HTMLButtonElement>(null);
  const cancelar = useCancelar(token);

  useEffect(() => {
    if (confirmando) mantener.current?.focus();
  }, [confirmando]);

  return (
    <section
      aria-labelledby="cancelar-t"
      className="flex flex-col gap-3.5 rounded-[22px] border border-borde bg-white p-6"
    >
      <h2 id="cancelar-t" className="m-0 font-serif text-[28px] font-semibold">
        Cancelar la cita
      </h2>
      <p className="m-0 text-sm leading-relaxed text-texto-2">
        La hora quedará libre para otra persona. Puedes agendar de nuevo cuando quieras.
      </p>
      {confirmando ? (
        <div
          role="alertdialog"
          aria-labelledby="confirmar-t"
          className="animar-in flex flex-col gap-3 rounded-2xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] p-4"
        >
          <p id="confirmar-t" className="m-0 text-[15px] font-bold text-peligro">
            ¿Seguro que quieres cancelar la cita del {fechaLarga(cita.inicio)} a las{" "}
            {hora(cita.inicio)}?
          </p>
          {cancelar.isError ? <EstadoError error={cancelar.error} /> : null}
          <div className="flex flex-wrap gap-2.5">
            <Boton
              variante="peligro"
              cargando={cancelar.isPending}
              textoCargando="Cancelando…"
              onClick={() => cancelar.mutate()}
            >
              Sí, cancelar
            </Boton>
            <button
              ref={mantener}
              type="button"
              onClick={() => setConfirmando(false)}
              className="min-h-11 rounded-full border-[1.5px] border-tinta px-5 text-sm font-bold text-tinta"
            >
              No, mantenerla
            </button>
          </div>
        </div>
      ) : (
        <Boton
          variante="claro"
          className="self-start text-peligro"
          onClick={() => setConfirmando(true)}
        >
          Cancelar la cita
        </Boton>
      )}
    </section>
  );
}
