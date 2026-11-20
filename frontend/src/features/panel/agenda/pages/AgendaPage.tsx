import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { isoDia } from "../../../../shared/lib/formato";
import { Boton } from "../../../../shared/ui/Boton";
import { EstadoError } from "../../../../shared/ui/Estado";
import { useSesion } from "../../auth/useSesion";
import { nombreSeccion, SECCIONES } from "../../estructura/secciones";
import { EncabezadoPagina } from "../../ui/EncabezadoPagina";
import { useBloqueos, useCitasSemana, useDentistasPanel, useMiPerfil } from "../api";
import { DetalleCita } from "../components/DetalleCita";
import { DialogoBloqueo } from "../components/DialogoBloqueo";
import { GrillaSemana } from "../components/GrillaSemana";
import { Leyenda } from "../components/Leyenda";
import { Resumenes } from "../components/Resumenes";
import { diasSemana, lunesDe, sumarDias, textoSemana } from "../semana";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const BOTON_ICONO =
  "flex size-11 items-center justify-center rounded-xl border border-[#CFC3AE] bg-white text-lg transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-14px_rgba(14,47,56,.6)]";

/** Hora actual que avanza cada minuto (para la línea «Ahora» y lo que ya terminó). */
function useAhora() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return ahora;
}

export function AgendaPage() {
  const { yo, puede } = useSesion();
  const ahora = useAhora();
  const [params, setParams] = useSearchParams();
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [bloqueando, setBloqueando] = useState(false);

  const lunesActual = lunesDe(isoDia(ahora));
  const semanaParam = params.get("semana");
  const lunes = semanaParam && FECHA.test(semanaParam) ? lunesDe(semanaParam) : lunesActual;
  const dias = diasSemana(lunes);
  const veTodas = puede("citas.ver_todas");

  const perfil = useMiPerfil();
  const dentistas = useDentistasPanel(veTodas);
  const listaDentistas = dentistas.data?.results ?? [];
  const dentistaParam = Number(params.get("dentista")) || undefined;
  const elegido = veTodas
    ? (listaDentistas.find((d) => d.id === dentistaParam) ?? listaDentistas[0])
    : (perfil.data ?? undefined);
  const dentistaId = veTodas ? elegido?.id : undefined;
  const listo = !veTodas || dentistaId !== undefined;

  const citasSemana = useCitasSemana(lunes, dentistaId, listo);
  const citasActual = useCitasSemana(lunesActual, dentistaId, listo);
  const bloqueos = useBloqueos(dias[0], dias[5], dentistaId, listo);

  const vigentes = (citasSemana.data?.results ?? []).filter((c) => c.estado !== "cancelada");
  const deEstaSemana = (citasActual.data?.results ?? []).filter((c) => c.estado !== "cancelada");
  const cita = vigentes.find((c) => c.id === seleccionada) ?? null;

  const titulo = nombreSeccion(SECCIONES[0], yo);

  const irA = (nuevo: { semana?: string; dentista?: number }) => {
    const siguiente = new URLSearchParams(params);
    if (nuevo.semana) siguiente.set("semana", nuevo.semana);
    if (nuevo.dentista) siguiente.set("dentista", String(nuevo.dentista));
    setParams(siguiente);
    setSeleccionada(null);
  };

  const diaBloqueo = dias.includes(isoDia(ahora)) ? isoDia(ahora) : lunes;

  return (
    <>
      <EncabezadoPagina
        titulo={titulo}
        descripcion={textoSemana(lunes)}
        acciones={
          <>
            {veTodas ? (
              <div className="flex items-center gap-2">
                <label htmlFor="agenda-dentista" className="text-sm font-bold">
                  Dentista
                </label>
                <select
                  id="agenda-dentista"
                  value={elegido?.id ?? ""}
                  onChange={(e) => irA({ dentista: Number(e.target.value) })}
                  className="min-h-11 rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3 font-semibold text-tinta"
                >
                  {listaDentistas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.usuario.nombre} {d.usuario.apellidos}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <button
              type="button"
              aria-label="Semana anterior"
              className={BOTON_ICONO}
              onClick={() => irA({ semana: sumarDias(lunes, -7) })}
            >
              ‹
            </button>
            <button
              type="button"
              aria-current={lunes === lunesActual ? "date" : undefined}
              className="min-h-11 rounded-xl border border-[#CFC3AE] bg-white px-4 text-sm font-semibold transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5"
              onClick={() => irA({ semana: lunesActual })}
            >
              Hoy
            </button>
            <button
              type="button"
              aria-label="Semana siguiente"
              className={BOTON_ICONO}
              onClick={() => irA({ semana: sumarDias(lunes, 7) })}
            >
              ›
            </button>
            {puede("dentistas.bloqueos_propios") || puede("dentistas.gestionar") ? (
              <Boton onClick={() => setBloqueando(true)} disabled={!listo}>
                + Bloquear horario
              </Boton>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <Resumenes citas={deEstaSemana} ahora={ahora} />

        {veTodas && dentistas.isSuccess && listaDentistas.length === 0 ? (
          <p className="m-0 rounded-2xl border border-borde bg-white p-6 text-texto-2">
            Todavía no hay dentistas registrados.
          </p>
        ) : citasSemana.isError ? (
          <EstadoError error={citasSemana.error} onReintentar={() => void citasSemana.refetch()} />
        ) : (
          <div className="flex flex-wrap items-start gap-[22px]">
            <GrillaSemana
              dias={dias}
              citas={vigentes}
              bloqueos={bloqueos.data?.results ?? []}
              horarios={elegido?.horarios ?? null}
              ahora={ahora}
              seleccionada={seleccionada}
              onElegir={setSeleccionada}
            />
            <aside
              aria-label="Cita seleccionada"
              className="animar-entrada flex flex-[1_1_280px] flex-col gap-4 rounded-[20px] border border-borde bg-white p-6 lg:sticky lg:top-6"
            >
              <span className="text-xs font-bold tracking-[2px] text-dorado-texto">
                CITA SELECCIONADA
              </span>
              {cita ? (
                <DetalleCita key={cita.id} cita={cita} ahora={ahora} />
              ) : (
                <p className="m-0 text-sm text-texto-2">
                  {citasSemana.isPending
                    ? "Cargando la agenda…"
                    : "Elige una cita de la semana para ver sus datos, sus notas y marcar asistencia."}
                </p>
              )}
            </aside>
          </div>
        )}

        <Leyenda />
      </div>

      <DialogoBloqueo
        abierto={bloqueando}
        onCerrar={() => setBloqueando(false)}
        diaInicial={diaBloqueo}
        dentistaId={dentistaId}
      />
    </>
  );
}
