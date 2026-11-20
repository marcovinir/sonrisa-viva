import { useEffect } from "react";
import { Link } from "react-router";
import { useDentistas, useServicios, type Dentista } from "../../../shared/api/catalogo";
import { Logo } from "../../../shared/ui/Logo";
import { PasoDatos } from "../components/PasoDatos";
import { PasoDentista } from "../components/PasoDentista";
import { PasoHora } from "../components/PasoHora";
import { PasoServicio } from "../components/PasoServicio";
import { Pasos } from "../components/Pasos";
import { ResumenCita, ResumenCitaMovil } from "../components/ResumenCita";
import { useAsistente } from "../estado";

export function ReservaPage() {
  const asistente = useAsistente();
  const { paso, servicioId, dentista, inicio, elegir } = asistente;
  const AVISOS: Record<string, string> = {
    servicio: "Ese servicio ya no está disponible.",
    ocupada: "Esa hora acaba de ocuparse, elige otra.",
    "no-disponible": "Esa hora ya no está disponible.",
  };
  const textoAviso = asistente.aviso ? (AVISOS[asistente.aviso] ?? null) : null;
  const aviso = asistente.aviso === "servicio" ? textoAviso : null;
  const avisoHora = asistente.aviso && asistente.aviso !== "servicio" ? textoAviso : null;
  const servicios = useServicios();
  const todos = useDentistas();

  const servicio = servicios.data?.find((s) => s.id === servicioId);

  useEffect(() => {
    document.title = "Agenda tu cita · Sonrisa Viva";
  }, []);

  // Un ?servicio= que no existe o ya no está activo vuelve al primer paso con un aviso.
  useEffect(() => {
    if (servicioId && servicios.isSuccess && !servicio) {
      elegir({ servicio: null, fecha: null, inicio: null, aviso: "servicio" });
    }
  }, [servicioId, servicios.isSuccess, servicio, elegir]);

  const dentistaObj: Dentista | undefined =
    typeof dentista === "number" ? todos.data?.find((d) => d.id === dentista) : undefined;
  const nombreDentista =
    dentista === "cualquiera"
      ? "Cualquiera disponible"
      : dentistaObj
        ? `${dentistaObj.nombre} ${dentistaObj.apellidos}`
        : "Sin elegir";

  return (
    <div className="min-h-screen bg-marfil font-sans text-tinta">
      <header className="border-b border-borde">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Link to="/" aria-label="Sonrisa Viva — volver al inicio" className="no-underline">
            <Logo compacto />
          </Link>
          <Link to="/" className="py-2.5 text-sm font-semibold text-petroleo">
            Salir de la reserva
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1160px] px-5 pb-14 pt-9 md:px-8">
        <Pasos actual={paso} faltante={asistente.faltante} hrefPaso={asistente.hrefPaso} />
        {aviso ? (
          <p
            role="alert"
            className="mb-6 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
          >
            {aviso}
          </p>
        ) : null}
        <div className="flex flex-wrap items-start gap-8">
          <div className="min-w-0 flex-[999_1_560px]">
            <div className="lg:hidden">
              <ResumenCitaMovil
                servicio={servicio}
                nombreDentista={nombreDentista}
                inicio={inicio}
              />
            </div>
            {paso === "servicio" ? (
              <PasoServicio
                elegido={servicioId}
                onElegir={(s) => {
                  const conservar =
                    typeof dentista === "number" &&
                    todos.data?.find((d) => d.id === dentista)?.servicios.includes(s.id);
                  const mantener = dentista === "cualquiera" || conservar;
                  elegir({
                    servicio: s.id,
                    dentista: mantener ? dentista : null,
                    fecha: null,
                    inicio: null,
                  });
                }}
              />
            ) : paso === "dentista" && servicioId ? (
              <PasoDentista
                servicioId={servicioId}
                elegido={dentista}
                onElegir={(d) => elegir({ dentista: d, inicio: null })}
              />
            ) : paso === "hora" && servicioId ? (
              <PasoHora
                servicioId={servicioId}
                dentista={dentista}
                fecha={asistente.fecha}
                inicio={inicio}
                aviso={avisoHora}
                onElegirFecha={(f) => elegir({ fecha: f, inicio: null })}
                onElegirHora={(i) => elegir({ inicio: i, fecha: i ? asistente.fecha : null })}
              />
            ) : paso === "datos" && servicioId && inicio ? (
              <PasoDatos
                servicioId={servicioId}
                dentista={dentista}
                inicio={inicio}
                onHoraPerdida={(motivo) => elegir({ inicio: null, aviso: motivo })}
              />
            ) : null}
          </div>
          <div className="hidden min-w-0 flex-[1_1_300px] lg:block">
            <ResumenCita servicio={servicio} nombreDentista={nombreDentista} inicio={inicio} />
          </div>
        </div>
      </main>
    </div>
  );
}
