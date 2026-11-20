import { BotonEnlace } from "../../../shared/ui/Boton";
import { Rotulo, Titulo } from "./Secciones";

const PREGUNTAS = [
  {
    p: "¿Necesito crear una cuenta para agendar?",
    r: "No. Solo dejas tu nombre, correo y teléfono, y te enviamos un enlace para cambiar o cancelar la cita.",
  },
  {
    p: "¿Hasta cuándo puedo cancelar?",
    r: "Hasta 24 horas antes de la cita, desde el enlace del correo.",
  },
  {
    p: "¿Los precios son finales?",
    r: "Son aproximados; el dentista los confirma en la valoración antes de empezar.",
  },
];

export function Contacto() {
  return (
    <section
      id="contacto"
      aria-labelledby="contacto-t"
      className="mx-auto grid max-w-[1200px] gap-14 px-5 py-[104px] md:grid-cols-2 md:px-8"
    >
      <div className="flex flex-col gap-6">
        <Rotulo>CONTACTO</Rotulo>
        <Titulo id="contacto-t">Estamos para ayudarte</Titulo>
        <dl className="m-0 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3.5 text-[15px]">
          <dt className="font-bold">Dirección</dt>
          <dd className="m-0 text-texto-2">[Dirección de la clínica], San José</dd>
          <dt className="font-bold">Teléfono</dt>
          <dd className="m-0 text-texto-2">[Teléfono]</dd>
          <dt className="font-bold">Correo</dt>
          <dd className="m-0 text-texto-2">[correo@clinica]</dd>
          <dt className="font-bold">Horario</dt>
          <dd className="m-0 text-texto-2">
            Lun a vie 8:00–12:00 y 13:00–17:00
            <br />
            Sábado 8:00–12:00
          </dd>
        </dl>
        <div className="flex flex-wrap gap-3">
          <a
            href="#contacto"
            className="inline-flex min-h-11 items-center rounded-full bg-petroleo px-6 font-semibold text-white no-underline transition-transform duration-300 motion-safe:hover:-translate-y-0.5"
          >
            Escríbenos por WhatsApp
          </a>
          <BotonEnlace to="/reservar" variante="contorno">
            Agenda tu cita
          </BotonEnlace>
        </div>
        <div className="mt-3">
          <h3 className="m-0 mb-3 text-[17px]">Preguntas frecuentes</h3>
          {PREGUNTAS.map((q, k) => (
            <details
              key={q.p}
              className={`group border-t border-borde py-3.5 ${k === PREGUNTAS.length - 1 ? "border-b" : ""}`}
            >
              <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                {q.p}
                <span
                  aria-hidden="true"
                  className="text-[22px] text-dorado-texto transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="animar-in m-0 mt-2.5 text-sm leading-relaxed text-texto-2">{q.r}</p>
            </details>
          ))}
        </div>
      </div>
      <div
        role="img"
        aria-label="Espacio para el mapa de ubicación"
        className="flex min-h-[420px] items-center justify-center rounded-3xl border border-[#D9C8A8] bg-[#E9DCC6] md:min-h-[520px]"
      >
        <span className="text-[13px] font-bold tracking-[2px] text-[#6B5330]">
          [MAPA DE UBICACIÓN]
        </span>
      </div>
    </section>
  );
}
