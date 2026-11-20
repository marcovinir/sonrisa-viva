import type { CitaPanel, Bloqueo } from "../api";
import { RAYADO_BLOQUEO, RAYADO_FRANJA } from "../estilos";
import {
  diaSemanaDe,
  franjasDelDia,
  HORA_FIN,
  HORA_INICIO,
  horaCorta,
  minutosCR,
  posicion,
  PX_POR_HORA,
  estadoVisual,
  type BloqueHorario,
} from "../semana";
import { isoDia } from "../../../../shared/lib/formato";
import { TarjetaCita } from "./TarjetaCita";

const CORTOS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => `${HORA_INICIO + i}:00`);
const ALTO = (HORA_FIN - HORA_INICIO) * PX_POR_HORA;
const aTop = (min: number) => ((min - HORA_INICIO * 60) / 60) * PX_POR_HORA;

export function GrillaSemana({
  dias,
  citas,
  bloqueos,
  horarios,
  ahora,
  seleccionada,
  onElegir,
}: {
  dias: string[];
  citas: CitaPanel[];
  bloqueos: Bloqueo[];
  horarios: BloqueHorario[] | null;
  ahora: Date;
  seleccionada: number | null;
  onElegir: (id: number) => void;
}) {
  const hoy = isoDia(ahora);
  const minAhora = minutosCR(ahora);
  const ahoraVisible = minAhora >= HORA_INICIO * 60 && minAhora <= HORA_FIN * 60;

  const delDia = (dia: string) => citas.filter((c) => isoDia(new Date(c.inicio)) === dia);

  return (
    <section
      aria-label="Semana"
      className="min-w-0 flex-[999_1_640px] overflow-x-auto rounded-[20px] border border-borde bg-white"
    >
      <div className="min-w-[700px]">
        <div className="sticky top-0 z-[4] grid grid-cols-[70px_repeat(6,minmax(0,1fr))] border-b border-borde bg-white">
          <span />
          {dias.map((dia, i) => {
            const n = delDia(dia).length;
            const esHoy = dia === hoy;
            return (
              <div
                key={dia}
                className={`border-l border-[#F1EEE8] px-2 py-3 text-center ${
                  esHoy
                    ? "bg-[#F3F8F9] text-petroleo shadow-[inset_0_-3px_0_#13505F]"
                    : "text-texto-2"
                }`}
              >
                <div className="text-xs font-bold tracking-[1.5px]">{CORTOS[i]}</div>
                <div className="font-serif text-[28px] font-semibold leading-[1.1]">
                  {Number(dia.slice(8))}
                </div>
                <div
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    esHoy ? "bg-petroleo text-white" : "bg-[#F1EEE8] text-texto-2"
                  }`}
                >
                  {n === 0 ? "Sin citas" : `${n} ${n === 1 ? "cita" : "citas"}`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative grid grid-cols-[70px_repeat(6,minmax(0,1fr))]">
          <div className="flex flex-col" aria-hidden="true">
            {HORAS.map((h) => (
              <div
                key={h}
                className="-translate-y-2 pr-2.5 text-right text-xs font-semibold text-texto-3"
                style={{ height: PX_POR_HORA }}
              >
                {h}
              </div>
            ))}
          </div>

          {dias.map((dia, i) => {
            const esHoy = dia === hoy;
            const franjas = horarios
              ? franjasDelDia(horarios.filter((h) => h.dia_semana === diaSemanaDe(dia)))
              : [];
            const bloqueosDia = bloqueos.filter(
              (b) => isoDia(new Date(b.inicio)) <= dia && isoDia(new Date(b.fin)) >= dia,
            );
            return (
              <div
                key={dia}
                className={`relative border-l border-[#EEE9DF] ${esHoy ? "bg-[#FBFDFD]" : ""}`}
                style={{
                  height: ALTO,
                  backgroundImage:
                    "linear-gradient(to bottom,#EEE9DF 1px,transparent 1px),linear-gradient(to bottom,transparent 47px,#F5F2EC 47px,#F5F2EC 48px,transparent 48px)",
                  backgroundSize: `100% ${PX_POR_HORA}px,100% ${PX_POR_HORA}px`,
                }}
              >
                {franjas.map((f) => (
                  <div
                    key={f.desde}
                    aria-hidden="true"
                    className="absolute inset-x-0 flex items-center justify-center"
                    style={{
                      top: aTop(f.desde),
                      height: aTop(f.hasta) - aTop(f.desde),
                      background: RAYADO_FRANJA,
                    }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[1px] text-texto-3">
                      {f.texto}
                    </span>
                  </div>
                ))}

                {bloqueosDia.map((b) => {
                  const inicio =
                    isoDia(new Date(b.inicio)) < dia ? `${dia}T08:00:00-06:00` : b.inicio;
                  const fin = isoDia(new Date(b.fin)) > dia ? `${dia}T17:00:00-06:00` : b.fin;
                  const { top, alto } = posicion(inicio, fin);
                  return (
                    <div
                      key={b.id}
                      className="absolute inset-x-1.5 z-[1] overflow-hidden rounded-[10px] px-2 py-1.5 text-[#4A3A22]"
                      style={{
                        top: Math.max(top, 0) + 3,
                        height: Math.min(alto, ALTO - Math.max(top, 0)) - 6,
                        background: RAYADO_BLOQUEO,
                        borderLeft: "5px solid #B8935A",
                      }}
                    >
                      <span className="block text-[11px] font-bold">
                        {horaCorta(inicio)} – {horaCorta(fin)} · Bloqueo
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-bold">
                        {b.motivo || "Horario bloqueado"}
                      </span>
                    </div>
                  );
                })}

                {esHoy && ahoraVisible ? (
                  <div
                    role="img"
                    aria-label={`Hora actual: ${horaCorta(ahora)}`}
                    className="absolute inset-x-0 z-[3] h-0.5 bg-[#B8935A]"
                    style={{ top: aTop(minAhora) }}
                  >
                    <span className="animar-pulso absolute -left-[5px] -top-1 size-2.5 rounded-full bg-[#B8935A]" />
                    <span className="absolute -top-5 right-1 rounded-md bg-white px-1.5 py-px text-[11px] font-bold text-[#8A6A3B]">
                      Ahora {horaCorta(ahora)}
                    </span>
                  </div>
                ) : null}

                {delDia(dia).map((c) => (
                  <TarjetaCita
                    key={c.id}
                    cita={c}
                    estado={estadoVisual(c, ahora)}
                    seleccionada={c.id === seleccionada}
                    retraso={i * 80}
                    onElegir={() => onElegir(c.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
