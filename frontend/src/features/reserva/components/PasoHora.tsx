import type { DentistaElegido } from "../estado";
import { Calendario } from "./Calendario";
import { HorasLibres } from "./HorasLibres";
import { TituloPaso } from "./TituloPaso";

export function PasoHora({
  servicioId,
  dentista,
  fecha,
  inicio,
  aviso,
  onElegirFecha,
  onElegirHora,
}: {
  servicioId: number;
  dentista: DentistaElegido | null;
  fecha: string | null;
  inicio: string | null;
  aviso: string | null;
  onElegirFecha: (iso: string) => void;
  onElegirHora: (inicio: string) => void;
}) {
  return (
    <section>
      <TituloPaso descripcion="Solo te mostramos horas en las que la cita cabe completa. Puedes reservar desde 2 horas hasta 60 días antes.">
        Elige el día y la hora
      </TituloPaso>
      {aviso ? (
        <p
          role="alert"
          className="animar-temblor mb-5 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
        >
          {aviso}
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        <Calendario
          servicioId={servicioId}
          dentista={dentista}
          fecha={fecha}
          onElegir={onElegirFecha}
        />
        <HorasLibres
          servicioId={servicioId}
          dentista={dentista}
          fecha={fecha}
          elegida={inicio}
          onElegir={(h) => onElegirHora(h.inicio)}
        />
      </div>
    </section>
  );
}
