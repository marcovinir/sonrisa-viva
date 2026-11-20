import { useState } from "react";
import { fechaLarga, hora } from "../../../shared/lib/formato";
import { Boton } from "../../../shared/ui/Boton";
import { EstadoError } from "../../../shared/ui/Estado";
import { Calendario } from "../../reserva/components/Calendario";
import { HorasLibres } from "../../reserva/components/HorasLibres";
import { useReprogramar, type CitaGestion } from "../api";

export function Reprogramar({ token, cita }: { token: string; cita: CitaGestion }) {
  const [fecha, setFecha] = useState<string | null>(null);
  const [inicio, setInicio] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const reprogramar = useReprogramar(token);

  const mover = () => {
    if (!inicio) return;
    setListo(null);
    reprogramar.mutate(inicio, {
      onSuccess: (nueva) => {
        setListo(
          // hora() ya termina en «a. m.» o «p. m.»: sin punto extra.
          `Listo: tu cita quedó para el ${fechaLarga(nueva.inicio)}, ${hora(nueva.inicio)}`,
        );
        setFecha(null);
        setInicio(null);
      },
    });
  };

  return (
    <section
      aria-labelledby="reprogramar-t"
      className="flex flex-col gap-4 rounded-[22px] border border-borde bg-white p-6"
    >
      <h2 id="reprogramar-t" className="m-0 font-serif text-[28px] font-semibold">
        Cambiar la hora
      </h2>
      <p className="m-0 text-sm text-texto-2">
        Mismo servicio y mismo dentista ({cita.dentista.nombre} {cita.dentista.apellidos}). Elige el
        nuevo día y la hora.
      </p>
      {listo ? (
        <p
          role="status"
          className="m-0 rounded-xl bg-[#EAF3EA] px-4 py-3 text-sm font-semibold text-[#1F4A28]"
        >
          {listo}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Calendario
          servicioId={cita.servicio.id}
          dentista={cita.dentista.id}
          fecha={fecha}
          onElegir={(f) => {
            setFecha(f);
            setInicio(null);
          }}
        />
        <HorasLibres
          servicioId={cita.servicio.id}
          dentista={cita.dentista.id}
          fecha={fecha}
          elegida={inicio}
          onElegir={(h) => setInicio(h.inicio)}
        />
      </div>
      {reprogramar.isError ? <EstadoError error={reprogramar.error} /> : null}
      {inicio ? (
        <Boton
          className="animar-in self-start"
          cargando={reprogramar.isPending}
          textoCargando="Moviendo…"
          onClick={mover}
        >
          Mover a las {hora(inicio)}
        </Boton>
      ) : null}
    </section>
  );
}
