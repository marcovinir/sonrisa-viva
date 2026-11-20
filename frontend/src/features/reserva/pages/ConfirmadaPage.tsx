import { useLocation } from "react-router";
import type { CitaResumen } from "../api";

export function ConfirmadaPage() {
  const cita = (useLocation().state as { cita?: CitaResumen } | null)?.cita;
  return (
    <main className="mx-auto max-w-[760px] px-5 py-16 text-center">
      <h1 className="font-serif text-5xl font-medium">
        {cita ? `¡Listo, ${cita.paciente.nombre}! Te esperamos.` : "Tu reserva ya fue registrada."}
      </h1>
    </main>
  );
}
