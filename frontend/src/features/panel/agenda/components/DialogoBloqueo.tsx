import { useState, type FormEvent } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import { useCrearBloqueo } from "../api";
import { HORA_FIN, HORA_INICIO, isoCR } from "../semana";

/** Horas en la rejilla de 15 min entre la apertura y el cierre. */
const HORAS = Array.from({ length: (HORA_FIN - HORA_INICIO) * 4 + 1 }, (_, i) => {
  const min = HORA_INICIO * 60 + i * 15;
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
});
const etiquetaHora = (hhmm: string) => hhmm.replace(/^0/, "");

const CONTROL =
  "min-h-12 w-full rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3.5 font-medium text-tinta " +
  "transition-[border-color,box-shadow] hover:border-[#8FA4AA] focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none";

function Formulario({
  diaInicial,
  dentistaId,
  onListo,
  onCancelar,
}: {
  diaInicial: string;
  dentistaId?: number;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const crear = useCrearBloqueo();
  const { mostrar } = useAviso();
  const [dia, setDia] = useState(diaInicial);
  const [desde, setDesde] = useState("08:00");
  const [hasta, setHasta] = useState("09:00");
  const [motivo, setMotivo] = useState("");
  const [errorHoras, setErrorHoras] = useState<string | null>(null);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (hasta <= desde) {
      setErrorHoras("La hora final debe ser después de la inicial.");
      return;
    }
    setErrorHoras(null);
    crear.mutate(
      {
        inicio: isoCR(dia, desde),
        fin: isoCR(dia, hasta),
        motivo: motivo.trim(),
        ...(dentistaId ? { dentista: dentistaId } : {}),
      },
      {
        onSuccess: () => {
          mostrar("Horario bloqueado");
          onListo();
        },
      },
    );
  };

  const error = crear.error
    ? crear.error instanceof ApiError
      ? crear.error.detalle
      : "No pudimos guardar el bloqueo. Intenta de nuevo."
    : null;

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 text-tinta">
      <p className="m-0 text-texto-2">
        En ese rango no se podrán reservar citas. Si ya hay citas confirmadas, primero hay que
        cancelarlas o moverlas.
      </p>
      {error ? (
        <p
          role="alert"
          className="animar-temblor m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
        >
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="bloqueo-dia" className="text-sm font-bold">
          Día
        </label>
        <input
          id="bloqueo-dia"
          type="date"
          required
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className={CONTROL}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["bloqueo-desde", "Desde", desde, setDesde, HORAS.slice(0, -1)],
            ["bloqueo-hasta", "Hasta", hasta, setHasta, HORAS.slice(1)],
          ] as const
        ).map(([id, etiqueta, valor, cambiar, opciones]) => (
          <div key={id} className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-bold">
              {etiqueta}
            </label>
            <select
              id={id}
              value={valor}
              onChange={(e) => cambiar(e.target.value)}
              aria-invalid={errorHoras ? true : undefined}
              aria-describedby={errorHoras ? "bloqueo-error-horas" : undefined}
              className={CONTROL}
            >
              {opciones.map((h) => (
                <option key={h} value={h}>
                  {etiquetaHora(h)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {errorHoras ? (
        <p id="bloqueo-error-horas" className="m-0 -mt-2 text-[13px] font-semibold text-error">
          {errorHoras}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="bloqueo-motivo" className="text-sm font-bold">
          Motivo
        </label>
        <input
          id="bloqueo-motivo"
          type="text"
          maxLength={200}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          aria-describedby="bloqueo-motivo-ayuda"
          className={CONTROL}
        />
        <p id="bloqueo-motivo-ayuda" className="m-0 text-[13px] text-texto-3">
          Opcional. Por ejemplo: congreso, cita médica, vacaciones.
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5 pt-2">
        <Boton variante="claro" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={crear.isPending} textoCargando="Guardando…">
          Guardar bloqueo
        </Boton>
      </div>
    </form>
  );
}

export function DialogoBloqueo({
  abierto,
  onCerrar,
  diaInicial,
  dentistaId,
}: {
  abierto: boolean;
  onCerrar: () => void;
  diaInicial: string;
  dentistaId?: number;
}) {
  return (
    <Dialogo abierto={abierto} titulo="Bloquear horario" onCerrar={onCerrar}>
      <Formulario
        diaInicial={diaInicial}
        dentistaId={dentistaId}
        onListo={onCerrar}
        onCancelar={onCerrar}
      />
    </Dialogo>
  );
}
