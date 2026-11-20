import type { CitaPanel } from "../../agenda/api";
import { DetalleCita } from "../../agenda/components/DetalleCita";
import { Dialogo } from "../../ui/Dialogo";

/** El mismo detalle de la agenda, en un diálogo. */
export function DialogoCita({
  cita,
  ahora,
  onCerrar,
}: {
  cita: CitaPanel | null;
  ahora: Date;
  onCerrar: () => void;
}) {
  return (
    <Dialogo abierto={cita !== null} titulo="Detalle de la cita" onCerrar={onCerrar}>
      {cita ? (
        <div className="flex flex-col gap-4 text-tinta">
          <DetalleCita key={cita.id} cita={cita} ahora={ahora} />
        </div>
      ) : null}
    </Dialogo>
  );
}
