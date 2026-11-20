import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../../../shared/api/cliente";
import { isoDia } from "../../../../shared/lib/formato";
import { Boton } from "../../../../shared/ui/Boton";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import { useAccionUsuario, useCitasFuturas, type UsuarioPanel } from "../api";

function Contenido({
  usuario,
  perfilId,
  onCerrar,
}: {
  usuario: UsuarioPanel;
  perfilId?: number;
  onCerrar: () => void;
}) {
  const [hoy] = useState(() => isoDia(new Date()));
  const accion = useAccionUsuario();
  const { mostrar } = useAviso();
  const [error, setError] = useState<string | null>(null);
  const esDentista = usuario.rol === "dentista" && perfilId !== undefined;
  const citas = useCitasFuturas(esDentista ? perfilId : undefined, hoy);
  const n = citas.data?.count ?? 0;

  const desactivar = () => {
    setError(null);
    accion.mutate(
      { id: usuario.id, accion: "desactivar" },
      {
        onSuccess: () => {
          mostrar(`${usuario.nombre} ya no puede entrar al panel`);
          onCerrar();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.detalle : "No pudimos desactivar la cuenta."),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          className="animar-temblor m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
        >
          {error}
        </p>
      ) : null}
      {esDentista && citas.isPending ? (
        <p className="m-0">Revisando sus citas…</p>
      ) : esDentista && n > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl bg-[#F1EADD] px-4 py-3 text-[#4A3A22]">
          <p className="m-0">
            Tiene {n} {n === 1 ? "cita confirmada" : "citas confirmadas"} desde hoy. Al desactivar
            su cuenta dejará de aparecer en el sitio, pero esas citas siguen en pie: cancélalas o
            reasígnalas.
          </p>
          <Link
            to={`/panel/citas?dentista=${perfilId}&estado=confirmada&desde=${hoy}`}
            className="self-start py-1 font-bold text-petroleo"
          >
            Ver esas citas
          </Link>
        </div>
      ) : (
        <p className="m-0">
          {usuario.nombre} ya no podrá entrar al panel
          {esDentista ? " y dejará de aparecer en el sitio" : ""}. Puedes reactivar su cuenta cuando
          quieras.
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2.5 pt-2">
        <Boton variante="claro" onClick={onCerrar}>
          No, volver
        </Boton>
        <Boton
          variante="peligro"
          onClick={desactivar}
          cargando={accion.isPending}
          textoCargando="Desactivando…"
        >
          Sí, desactivar
        </Boton>
      </div>
    </div>
  );
}

/** Confirmación para desactivar una cuenta; avisa si el dentista tiene citas futuras. */
export function DialogoDesactivar({
  usuario,
  perfilId,
  onCerrar,
}: {
  usuario: UsuarioPanel | null;
  perfilId?: number;
  onCerrar: () => void;
}) {
  return (
    <Dialogo
      abierto={usuario !== null}
      titulo={usuario ? `¿Desactivar a ${usuario.nombre} ${usuario.apellidos}?` : ""}
      onCerrar={onCerrar}
    >
      {usuario ? (
        <Contenido key={usuario.id} usuario={usuario} perfilId={perfilId} onCerrar={onCerrar} />
      ) : null}
    </Dialogo>
  );
}
