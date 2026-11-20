import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import { useCambiarEstado, type CitaPanel } from "../api";
import { diaCorto, horaCorta } from "../semana";

/** Confirmación para cancelar una cita (agenda y lista de citas). */
export function DialogoCancelar({
  cita,
  onCerrar,
}: {
  cita: CitaPanel | null;
  onCerrar: () => void;
}) {
  const cambiar = useCambiarEstado();
  const { mostrar } = useAviso();

  // mutateAsync: el aviso sale aunque la cita desaparezca de la agenda (y esto se desmonte).
  const cancelar = async () => {
    if (!cita) return;
    try {
      await cambiar.mutateAsync({ id: cita.id, estado: "cancelada" });
      mostrar("Cita cancelada. Le avisamos al paciente por correo.");
    } catch (err) {
      mostrar(
        err instanceof ApiError ? err.detalle : "No pudimos cancelar la cita. Intenta de nuevo.",
        "error",
      );
    } finally {
      onCerrar();
    }
  };

  return (
    <Dialogo
      abierto={cita !== null}
      titulo="¿Cancelar esta cita?"
      onCerrar={onCerrar}
      acciones={
        <>
          <Boton variante="claro" onClick={onCerrar}>
            No, volver
          </Boton>
          <Boton
            variante="peligro"
            onClick={cancelar}
            cargando={cambiar.isPending}
            textoCargando="Cancelando…"
          >
            Sí, cancelar
          </Boton>
        </>
      }
    >
      {cita ? (
        <p className="m-0">
          Se cancela la cita de{" "}
          <strong className="text-tinta">
            {cita.paciente.nombre} {cita.paciente.apellidos}
          </strong>{" "}
          del {diaCorto(cita.inicio).toLowerCase()} a las {horaCorta(cita.inicio)}. Se avisará al
          paciente por correo. Esto no se puede deshacer.
        </p>
      ) : null}
    </Dialogo>
  );
}
