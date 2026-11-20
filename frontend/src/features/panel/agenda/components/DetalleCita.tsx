import { useState } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { useSesion } from "../../auth/useSesion";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import { useCambiarEstado, useGuardarNotas, type CitaPanel } from "../api";
import { ESTADO_LARGO, ESTADOS } from "../estilos";
import { diaCorto, estadoVisual, horaCorta } from "../semana";

const Dato = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <div className="rounded-xl bg-marfil px-3 py-2.5">
    <div className="text-[11px] font-bold tracking-[1.5px] text-dorado-texto">{rotulo}</div>
    <div className="text-sm font-bold">{valor}</div>
  </div>
);

const mensajeDe = (e: unknown) =>
  e instanceof ApiError ? e.detalle : "No pudimos guardar el cambio. Intenta de nuevo.";

/** Panel lateral con la cita elegida: datos, notas, asistencia y cancelar. */
export function DetalleCita({ cita, ahora }: { cita: CitaPanel; ahora: Date }) {
  const { puede } = useSesion();
  const { mostrar } = useAviso();
  const cambiar = useCambiarEstado();
  const guardarNotas = useGuardarNotas();
  const [notas, setNotas] = useState(cita.notas_internas);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);

  const estado = estadoVisual(cita, ahora);
  const e = ESTADOS[estado];
  const nombre = `${cita.paciente.nombre} ${cita.paciente.apellidos}`;
  const iniciales = `${cita.paciente.nombre[0] ?? ""}${cita.paciente.apellidos[0] ?? ""}`;
  const marca = puede("citas.marcar_asistencia");
  const gestiona = puede("citas.gestionar_todas");

  const marcar = (nuevo: "completada" | "no_asistio") =>
    cambiar.mutate(
      { id: cita.id, estado: nuevo },
      {
        onSuccess: () =>
          mostrar(nuevo === "completada" ? "Asistencia marcada" : "Marcada como no asistió"),
        onError: (err) => mostrar(mensajeDe(err), "error"),
      },
    );

  const alSalirNotas = () => {
    if (notas === cita.notas_internas) return;
    guardarNotas.mutate(
      { id: cita.id, notas_internas: notas },
      {
        onSuccess: () => mostrar("Notas guardadas"),
        onError: (err) => mostrar(mensajeDe(err), "error"),
      },
    );
  };

  const cancelar = () =>
    cambiar.mutate(
      { id: cita.id, estado: "cancelada" },
      {
        onSuccess: () => {
          setConfirmarCancelar(false);
          mostrar("Cita cancelada. Le avisamos al paciente por correo.");
        },
        onError: (err) => {
          setConfirmarCancelar(false);
          mostrar(mensajeDe(err), "error");
        },
      },
    );

  return (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E3EEF0] font-bold text-petroleo"
        >
          {iniciales}
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-[19px] font-bold">{nombre}</h2>
          <p className="m-0 mt-0.5 text-sm text-texto-2">
            {cita.servicio.nombre} · {cita.servicio.duracion_min} min
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Dato rotulo="DÍA" valor={diaCorto(cita.inicio)} />
        <Dato rotulo="HORA" valor={`${horaCorta(cita.inicio)} – ${horaCorta(cita.fin)}`} />
      </div>
      <span
        className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-[13px] font-bold"
        style={{
          background: estado === "por_marcar" ? "#F6EDE0" : e.fondo,
          color: estado === "por_marcar" ? "#6B5330" : e.texto,
        }}
      >
        {ESTADO_LARGO[estado]}
      </span>
      <dl className="m-0 grid grid-cols-[80px_1fr] gap-2 text-sm">
        <dt className="font-bold">Teléfono</dt>
        <dd className="m-0 text-texto-2">
          <a href={`tel:${cita.paciente.telefono.replace(/[^\d+]/g, "")}`}>
            {cita.paciente.telefono}
          </a>
        </dd>
        <dt className="font-bold">Correo</dt>
        <dd className="m-0 break-all text-texto-2">
          <a href={`mailto:${cita.paciente.email}`}>{cita.paciente.email}</a>
        </dd>
      </dl>
      <div className="flex flex-col gap-2">
        <label htmlFor="notas-internas" className="text-sm font-bold">
          Notas internas
        </label>
        <textarea
          id="notas-internas"
          rows={3}
          value={notas}
          onChange={(ev) => setNotas(ev.target.value)}
          onBlur={alSalirNotas}
          aria-describedby="notas-ayuda"
          className="resize-y rounded-xl border-[1.5px] border-[#CFC3AE] px-3 py-2.5 text-sm font-medium text-tinta transition-[border-color,box-shadow] hover:border-[#8FA4AA] focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none"
        />
        <p id="notas-ayuda" className="m-0 text-xs text-texto-3">
          Solo las ve el equipo de la clínica. Se guardan al salir del campo.
        </p>
      </div>

      {estado === "por_marcar" && marca ? (
        <div className="grid grid-cols-2 gap-2">
          <Boton
            className="bg-exito!"
            onClick={() => marcar("completada")}
            disabled={cambiar.isPending}
          >
            Asistió
          </Boton>
          <Boton
            variante="contorno"
            className="border-dorado-texto! text-[#6B5330]!"
            onClick={() => marcar("no_asistio")}
            disabled={cambiar.isPending}
          >
            No asistió
          </Boton>
        </div>
      ) : null}
      {estado === "confirmada" && marca ? (
        <p className="m-0 text-[13px] text-texto-3">
          Podrás marcar asistencia cuando la cita termine.
        </p>
      ) : null}

      {cita.estado === "confirmada" && gestiona ? (
        <Boton
          variante="contorno"
          className="border-peligro! text-peligro!"
          onClick={() => setConfirmarCancelar(true)}
        >
          Cancelar cita
        </Boton>
      ) : null}
      {!gestiona ? (
        <p className="m-0 text-xs text-texto-3">
          Para cancelar o mover una cita, contacta a administración.
        </p>
      ) : null}

      <Dialogo
        abierto={confirmarCancelar}
        titulo="¿Cancelar esta cita?"
        onCerrar={() => setConfirmarCancelar(false)}
        acciones={
          <>
            <Boton variante="claro" onClick={() => setConfirmarCancelar(false)}>
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
        Se cancela la cita de <strong className="text-tinta">{nombre}</strong> del{" "}
        {diaCorto(cita.inicio).toLowerCase()} a las {horaCorta(cita.inicio)}. Le enviaremos un
        correo al paciente con el aviso. Esto no se puede deshacer.
      </Dialogo>
    </>
  );
}
