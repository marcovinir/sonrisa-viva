import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../../shared/api/cliente";
import { colones, hora, partesCR } from "../../../shared/lib/formato";
import { BotonEnlace } from "../../../shared/ui/Boton";
import { Esqueleto, EstadoError } from "../../../shared/ui/Estado";
import { Logo } from "../../../shared/ui/Logo";
import { useCita, type CitaGestion } from "../api";
import { Cancelar } from "../components/Cancelar";
import { Reprogramar } from "../components/Reprogramar";

const MESES_CORTOS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const ESTADOS: Record<CitaGestion["estado"], { texto: string; clase: string; punto: string }> = {
  confirmada: { texto: "Confirmada", clase: "bg-[#E3EEF0] text-[#0E4250]", punto: "bg-petroleo" },
  cancelada: { texto: "Cancelada", clase: "bg-[#FBF1F0] text-peligro", punto: "bg-peligro" },
  completada: { texto: "Completada", clase: "bg-[#EAF3EA] text-[#1F4A28]", punto: "bg-exito" },
  no_asistio: {
    texto: "No asistió",
    clase: "bg-[#F6EDE0] text-[#6B5330]",
    punto: "bg-dorado-texto",
  },
};

function Encabezado() {
  return (
    <header className="border-b border-borde">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link to="/" aria-label="Sonrisa Viva — volver al inicio" className="no-underline">
          <Logo compacto />
        </Link>
        <span className="text-[13px] text-texto-3">
          Abriste esta página desde el enlace de tu correo
        </span>
      </div>
    </header>
  );
}

function TarjetaCita({ cita }: { cita: CitaGestion }) {
  const p = partesCR(cita.inicio);
  const estado = ESTADOS[cita.estado];
  return (
    <section
      aria-label="Tu cita"
      className="animar-entrada flex flex-wrap items-center justify-between gap-7 rounded-[22px] border border-borde bg-white px-8 py-7"
    >
      <div className="flex items-center gap-5">
        <div
          aria-hidden="true"
          className="w-[82px] rounded-2xl bg-tinta py-3 text-center text-marfil"
        >
          <div className="text-xs font-bold tracking-[2px] text-arena-claro">
            {MESES_CORTOS[p.mes - 1]}
          </div>
          <div className="font-serif text-[40px] font-semibold leading-none">{p.dia}</div>
          <div className="text-xs">{DIAS[p.diaSemana]}</div>
        </div>
        <div>
          <h2 className="m-0 text-[21px] font-bold">{cita.servicio.nombre}</h2>
          <p className="m-0 mt-1.5 text-[15px] text-texto-2">
            {hora(cita.inicio)} – {hora(cita.fin)} · {cita.dentista.nombre}{" "}
            {cita.dentista.apellidos}
          </p>
          <p className="m-0 mt-1 text-[15px] text-texto-2">
            Precio aproximado <strong className="text-tinta">{colones(cita.precio_colones)}</strong>
          </p>
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${estado.clase}`}
      >
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${estado.punto} ${cita.estado === "confirmada" ? "motion-safe:animate-pulse" : ""}`}
        />
        {estado.texto}
      </span>
    </section>
  );
}

export function GestionPage() {
  const { token = "" } = useParams();
  const cita = useCita(token);

  useEffect(() => {
    document.title = "Tu cita · Sonrisa Viva";
  }, []);

  const noExiste = cita.error instanceof ApiError && cita.error.status === 404;

  return (
    <div className="min-h-screen bg-marfil font-sans text-tinta">
      <Encabezado />
      <main className="mx-auto flex max-w-[1000px] flex-col gap-7 px-5 pb-16 pt-12 md:px-8">
        {cita.isPending ? (
          <>
            <Esqueleto className="h-12 w-64" />
            <Esqueleto className="h-36" />
          </>
        ) : noExiste ? (
          <div className="flex flex-col items-start gap-4">
            <h1 className="m-0 font-serif text-5xl font-medium">No encontramos esa cita</h1>
            <p className="m-0 text-texto-2">
              El enlace puede estar incompleto o la cita ya no existe.
            </p>
            <BotonEnlace to="/reservar">Agendar una cita</BotonEnlace>
          </div>
        ) : cita.isError ? (
          <EstadoError error={cita.error} onReintentar={() => cita.refetch()} />
        ) : (
          <>
            <div>
              <span className="text-[13px] font-bold tracking-[3px] text-dorado-texto">
                TU CITA
              </span>
              <h1 className="m-0 mt-2.5 font-serif text-5xl font-medium leading-[1.08]">
                Hola, {cita.data.paciente.nombre}
              </h1>
            </div>
            <TarjetaCita cita={cita.data} />
            {cita.data.puede_cambiar ? (
              <>
                <Reprogramar token={token} cita={cita.data} />
                <Cancelar token={token} cita={cita.data} />
              </>
            ) : cita.data.estado === "cancelada" ? (
              <div className="flex flex-col items-start gap-3 rounded-[14px] bg-[#F1EADD] px-5 py-4 text-sm text-[#4A3A22]">
                <p className="m-0">Esta cita ya no se puede modificar.</p>
                <Link to="/reservar" className="font-bold text-petroleo">
                  Agendar otra cita
                </Link>
              </div>
            ) : (
              <p className="m-0 rounded-[14px] bg-[#F1EADD] px-5 py-4 text-sm text-[#4A3A22]">
                {cita.data.estado === "confirmada"
                  ? "Faltan menos de 24 horas: para cambios escríbenos por WhatsApp."
                  : "Esta cita ya no se puede modificar."}
              </p>
            )}
            {cita.data.puede_cambiar ? (
              <p className="m-0 rounded-[14px] bg-[#F1EADD] px-5 py-4 text-sm text-[#4A3A22]">
                <strong>Recuerda:</strong> los cambios y cancelaciones se pueden hacer hasta 24
                horas antes de la cita.
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
