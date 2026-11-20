import { useState } from "react";
import { Diente } from "../../../shared/ui/Diente";
import { Revelar } from "../../../shared/ui/Revelar";
import { Rotulo } from "./Secciones";

const TESTIMONIOS = [
  {
    texto: "Me explicaron todo antes de empezar y el precio fue el que me dijeron.",
    servicio: "Resina",
  },
  {
    texto: "Reservé desde el celular en un minuto y me atendieron a la hora exacta.",
    servicio: "Limpieza dental",
  },
  { texto: "Por fin perdí el miedo al dentista. El trato es otra cosa.", servicio: "Endodoncia" },
];

function Cita({ texto, servicio }: { texto: string; servicio: string }) {
  return (
    <figure className="m-0 flex flex-col gap-5 border-t border-[#3D6670] pt-7">
      <blockquote className="m-0 font-serif text-[25px] italic leading-snug">«{texto}»</blockquote>
      <figcaption className="text-sm text-[#C9D6D9]">
        <strong className="text-marfil">Paciente de ejemplo</strong> · {servicio}
      </figcaption>
    </figure>
  );
}

export function Testimonios() {
  const [i, setI] = useState(0);
  const n = TESTIMONIOS.length;
  return (
    <section
      aria-labelledby="testimonios-t"
      className="relative overflow-hidden bg-tinta text-marfil"
    >
      <Diente
        tamano={420}
        trazo="#D9BC8C"
        grosor={0.25}
        className="pointer-events-none absolute -right-24 -top-16 opacity-25"
      />
      <Diente
        tamano={220}
        trazo="#D9BC8C"
        grosor={0.35}
        className="pointer-events-none absolute -bottom-16 -left-16 -rotate-[18deg] opacity-20"
      />
      <div className="relative mx-auto max-w-[1200px] px-5 py-[104px] md:px-8">
        <Rotulo claro>TESTIMONIOS</Rotulo>
        <h2
          id="testimonios-t"
          className="m-0 mb-12 mt-4 font-serif text-[36px] font-medium leading-[1.08] md:text-[52px]"
        >
          Lo que dicen nuestros pacientes
        </h2>

        <div className="hidden gap-10 md:grid md:grid-cols-3">
          {TESTIMONIOS.map((t, k) => (
            <Revelar key={k} retraso={k * 90}>
              <Cita {...t} />
            </Revelar>
          ))}
        </div>

        <div
          role="region"
          aria-roledescription="carrusel"
          aria-label="Testimonios"
          className="flex flex-col gap-5 md:hidden"
        >
          <div aria-live="polite" className="min-h-[190px]">
            <div key={i} className="animar-in">
              <Cita {...TESTIMONIOS[i]} />
              <p className="mt-3 text-[13px] text-[#A9BEC3]">
                {i + 1} de {n}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div aria-hidden="true" className="flex gap-2">
              {TESTIMONIOS.map((_, k) => (
                <span
                  key={k}
                  className={`block h-1 rounded-sm transition-[width,background-color] duration-300 ${k === i ? "w-6 bg-arena-claro" : "w-2 bg-[#3D6670]"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Testimonio anterior"
                onClick={() => setI((i + n - 1) % n)}
                className="size-11 rounded-full border-[1.5px] border-[#3D6670] bg-transparent text-lg text-marfil"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Testimonio siguiente"
                onClick={() => setI((i + 1) % n)}
                className="size-11 rounded-full border-[1.5px] border-arena-claro bg-transparent text-lg text-marfil"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
