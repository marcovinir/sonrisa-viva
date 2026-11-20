import { useState } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { useAviso } from "../../ui/avisosContexto";
import type { DentistaPanel } from "../../agenda/api";
import { useGuardarHorario } from "../api";
import { aHorarios, agruparPorDia, NOMBRES_DIAS, validarBloques, type Bloque } from "../horario";

const DIAS_VISIBLES = [0, 1, 2, 3, 4, 5]; // de lunes a sábado; el domingo se conserva tal cual
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);
const CONTROL =
  "min-h-11 rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-2.5 text-sm font-medium text-tinta " +
  "focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none";

/** Suma horas a «HH:MM» sin pasar de las 17:00. */
const mas = (hhmm: string, horas: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = Math.min(h * 60 + m + horas * 60, 17 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** Pestaña «Horario»: bloques de atención por día, validados antes de enviar. */
export function EditorHorario({ dentista }: { dentista: DentistaPanel }) {
  const guardar = useGuardarHorario();
  const { mostrar } = useAviso();
  const [dias, setDias] = useState(() => agruparPorDia(dentista.horarios));
  const [errores, setErrores] = useState<string[]>([]);

  const actualizar = (dia: number, bloques: Bloque[]) => setDias((d) => ({ ...d, [dia]: bloques }));
  const editar = (dia: number, i: number, campo: keyof Bloque, valor: string) =>
    actualizar(
      dia,
      dias[dia].map((b, j) => (j === i ? { ...b, [campo]: valor } : b)),
    );
  const agregar = (dia: number) => {
    const ultimo = dias[dia][dias[dia].length - 1];
    const inicio = ultimo?.fin || "08:00";
    actualizar(dia, [...dias[dia], { inicio, fin: mas(inicio, 4) }]);
  };

  const enviar = () => {
    const encontrados = validarBloques(dias);
    setErrores(encontrados);
    if (encontrados.length) return;
    guardar.mutate(
      { id: dentista.id, horarios: aHorarios(dias) },
      {
        onSuccess: () => mostrar("Horario guardado"),
        onError: (error) =>
          setErrores(
            error instanceof ApiError
              ? (error.campos.horarios ?? [error.detalle])
              : ["No pudimos guardar el horario. Intenta de nuevo."],
          ),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-texto-2">
        Los pacientes solo pueden reservar dentro de estos bloques. Deja un hueco para el almuerzo.
      </p>
      {errores.length ? (
        <div
          role="alert"
          className="animar-temblor rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
        >
          {errores.length === 1 ? (
            errores[0]
          ) : (
            <ul className="m-0 pl-5">
              {errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <div className="flex flex-col">
        {DIAS_VISIBLES.map((dia) => {
          const nombre = NOMBRES_DIAS[dia];
          const Nombre = capital(nombre);
          return (
            <fieldset
              key={dia}
              className="m-0 grid grid-cols-[100px_1fr] items-start gap-3 border-0 border-t border-[#F1EEE8] px-0 py-3 first:border-t-0"
            >
              <legend className="float-left pt-2.5 text-sm font-bold">{Nombre}</legend>
              <div className="col-start-2 flex flex-col gap-2">
                {dias[dia].length === 0 ? (
                  <p className="m-0 pt-2.5 text-sm text-texto-3">Sin atención</p>
                ) : (
                  dias[dia].map((b, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        step={900}
                        min="06:00"
                        max="20:00"
                        aria-label={`${Nombre}, inicio del bloque ${i + 1}`}
                        value={b.inicio}
                        onChange={(e) => editar(dia, i, "inicio", e.target.value)}
                        className={CONTROL}
                      />
                      <span aria-hidden="true" className="text-texto-3">
                        –
                      </span>
                      <input
                        type="time"
                        step={900}
                        min="06:00"
                        max="20:00"
                        aria-label={`${Nombre}, fin del bloque ${i + 1}`}
                        value={b.fin}
                        onChange={(e) => editar(dia, i, "fin", e.target.value)}
                        className={CONTROL}
                      />
                      <button
                        type="button"
                        aria-label={`Quitar bloque ${i + 1} del ${nombre}`}
                        onClick={() =>
                          actualizar(
                            dia,
                            dias[dia].filter((_, j) => j !== i),
                          )
                        }
                        className="min-h-11 rounded-full px-3 text-[13px] font-bold text-peligro hover:bg-[#FBF1F0]"
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  aria-label={`Agregar bloque el ${nombre}`}
                  onClick={() => agregar(dia)}
                  className="min-h-11 self-start rounded-full px-1 text-[13px] font-bold text-petroleo hover:underline"
                >
                  + Agregar bloque
                </button>
              </div>
            </fieldset>
          );
        })}
      </div>
      <div className="border-t border-[#F1EEE8] pt-4">
        <Boton onClick={enviar} cargando={guardar.isPending} textoCargando="Guardando…">
          Guardar horario
        </Boton>
      </div>
    </div>
  );
}
