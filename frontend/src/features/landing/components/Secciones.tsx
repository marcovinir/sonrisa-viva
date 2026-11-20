import type { ReactNode } from "react";
import { Diente } from "../../../shared/ui/Diente";
import { Revelar } from "../../../shared/ui/Revelar";

export function Rotulo({ children, claro = false }: { children: ReactNode; claro?: boolean }) {
  return (
    <Revelar
      as="span"
      className={`text-[13px] font-bold tracking-[3px] ${claro ? "text-arena-claro" : "text-dorado-texto"}`}
    >
      {children}
    </Revelar>
  );
}

export function Titulo({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <Revelar
      as="h2"
      id={id}
      className="m-0 font-serif text-[36px] font-medium leading-[1.08] md:text-[52px]"
    >
      {children}
    </Revelar>
  );
}

const ESPECIALIDADES = [
  "Odontología general",
  "Ortodoncia",
  "Estética dental",
  "Endodoncia",
  "Cirugía oral",
];

export function Especialidades() {
  return (
    <section className="border-y border-borde bg-white">
      <ul
        aria-label="Especialidades"
        className="mx-auto m-0 flex max-w-[1200px] list-none flex-wrap justify-between gap-x-7 gap-y-4 px-5 py-[22px] text-[15px] font-semibold md:px-8"
      >
        {ESPECIALIDADES.map((e, i) => (
          <Revelar
            as="li"
            key={e}
            retraso={i * 60}
            className="flex items-center gap-2.5 transition-colors hover:text-petroleo"
          >
            <Diente tamano={18} trazo="#B8935A" grosor={1.8} />
            {e}
          </Revelar>
        ))}
      </ul>
    </section>
  );
}

const PASOS = [
  {
    n: "01",
    titulo: "Valoración",
    texto: "Revisamos dientes y encías con calma, y te explicamos lo que vemos con imágenes.",
    icono: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L21 21" />
        <path d="M8 9.2c.8.6 1.6.9 2.5.9s1.7-.3 2.5-.9" />
      </>
    ),
  },
  {
    n: "02",
    titulo: "Plan y precio claros",
    texto:
      "Recibes las opciones de tratamiento con su duración y su precio aproximado antes de decidir.",
    icono: (
      <>
        <rect x="5" y="3.5" width="14" height="18" rx="2.5" />
        <path d="M9 3.5h6v2.5H9zM8.5 11h7M8.5 14.5h7M8.5 18h4" />
      </>
    ),
  },
  {
    n: "03",
    titulo: "Tratamiento y controles",
    texto:
      "El mismo dentista te acompaña de principio a fin, con recordatorio de tus próximos controles.",
    icono: (
      <>
        <path d="M7 2.5C4.5 2.5 3 4.6 3 7.2c0 2 .7 3.4 1.2 5 .6 2 .8 4.3 1.3 6.3.4 1.6 1 2.9 2 2.9 1.3 0 1.6-1.8 1.9-3.6.3-1.7.8-3.3 2.6-3.3s2.3 1.6 2.6 3.3c.3 1.8.6 3.6 1.9 3.6 1 0 1.6-1.3 2-2.9.5-2 .7-4.3 1.3-6.3.5-1.6 1.2-3 1.2-5 0-2.6-1.5-4.7-4-4.7-1.7 0-2.8.9-5 .9s-3.3-.9-5-.9z" />
        <path d="M19.5 1.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" strokeWidth="1.2" />
      </>
    ),
  },
];

export function Pasos() {
  return (
    <section
      aria-labelledby="pasos-t"
      className="mx-auto max-w-[1200px] px-5 pb-6 pt-[104px] md:px-8"
    >
      <div className="mb-10 flex max-w-[640px] flex-col gap-4">
        <Rotulo>CÓMO TRABAJAMOS</Rotulo>
        <Titulo id="pasos-t">Tu sonrisa en tres pasos</Titulo>
      </div>
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[22px] p-0">
        {PASOS.map((p, i) => (
          <Revelar
            as="li"
            key={p.n}
            retraso={i * 80}
            className="group flex flex-col gap-4 rounded-[22px] border border-borde bg-white p-[30px] transition-[transform,box-shadow] duration-400 ease-(--ease-sv) motion-safe:hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-28px_rgba(14,47,56,.5)]"
          >
            <div className="flex items-start justify-between">
              <span
                aria-hidden="true"
                className="flex size-[60px] items-center justify-center rounded-[18px] bg-[#E3EEF0] transition-colors duration-300 group-hover:bg-petroleo"
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-petroleo transition-[stroke] duration-300 group-hover:stroke-white"
                >
                  {p.icono}
                </svg>
              </span>
              <span
                aria-hidden="true"
                className="font-serif text-[56px] font-semibold leading-none text-[#E2D1B3]"
              >
                {p.n}
              </span>
            </div>
            <h3 className="m-0 text-xl font-bold">{p.titulo}</h3>
            <p className="m-0 text-[15px] leading-relaxed text-texto-2">{p.texto}</p>
          </Revelar>
        ))}
      </ol>
    </section>
  );
}

const VALORES = [
  { titulo: "Precisión", texto: "Diagnóstico con calma y tecnología actual." },
  { titulo: "Calidez", texto: "Explicamos cada paso antes de hacerlo." },
  { titulo: "Transparencia", texto: "Precio aproximado desde el inicio." },
];

export function QuienesSomos() {
  return (
    <section id="nosotros" className="mt-20 border-y border-borde bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-[72px] px-5 py-[104px] md:grid-cols-2 md:px-8">
        <div className="flex flex-col gap-[22px]">
          <Rotulo>QUIÉNES SOMOS</Rotulo>
          <Titulo>Una clínica pequeña a propósito.</Titulo>
          <p className="m-0 text-[17px] leading-[1.7] text-texto-2">
            Atendemos con agenda, sin salas de espera llenas. Cada dentista conoce a sus pacientes
            por nombre y lleva su historia de principio a fin: valoración, tratamiento y controles.
          </p>
          <p className="m-0 text-[17px] leading-[1.7] text-texto-2">
            Trabajamos con materiales certificados y te damos el precio aproximado antes de empezar,
            para que no haya sorpresas.
          </p>
        </div>
        <div className="flex flex-col gap-[22px]">
          <Rotulo>NUESTRA MISIÓN</Rotulo>
          <p className="m-0 font-serif text-[30px] italic leading-[1.35] text-petroleo">
            «Que cada persona salga de la consulta entendiendo su boca y sintiéndose bien tratada.»
          </p>
          <div className="mt-2 grid gap-5 sm:grid-cols-3">
            {VALORES.map((v) => (
              <div key={v.titulo} className="border-t-2 border-arena pt-4">
                <h3 className="m-0 mb-2 text-base font-bold">{v.titulo}</h3>
                <p className="m-0 text-sm leading-relaxed text-texto-2">{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
