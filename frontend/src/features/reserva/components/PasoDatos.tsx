import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { ApiError } from "../../../shared/api/cliente";
import { Boton } from "../../../shared/ui/Boton";
import { Campo } from "../../../shared/ui/Campo";
import { EstadoError } from "../../../shared/ui/Estado";
import { useReservar } from "../api";
import type { DentistaElegido } from "../estado";
import { pacienteEsquema, type PacienteFormulario } from "../esquema";
import { TituloPaso } from "./TituloPaso";

const CLAVE = "sv-reserva-paciente";
const HORA_NO_DISPONIBLE = "Esa hora ya no está disponible.";
const VACIO: PacienteFormulario = { nombre: "", apellidos: "", email: "", telefono: "" };

function leerGuardado(): PacienteFormulario {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    return crudo ? { ...VACIO, ...JSON.parse(crudo) } : VACIO;
  } catch {
    return VACIO;
  }
}
function guardar(datos: Partial<PacienteFormulario>) {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}
function borrarGuardado() {
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento */
  }
}

export function PasoDatos({
  servicioId,
  dentista,
  inicio,
  onHoraPerdida,
}: {
  servicioId: number;
  dentista: DentistaElegido | null;
  inicio: string;
  onHoraPerdida: (motivo: "ocupada" | "no-disponible") => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reservar = useReservar();
  const enviando = useRef(false);
  const [errorGeneral, setErrorGeneral] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<PacienteFormulario>({
    resolver: zodResolver(pacienteEsquema),
    mode: "onTouched",
    defaultValues: leerGuardado(),
  });

  const valores = useWatch({ control });
  useEffect(() => {
    guardar(valores);
  }, [valores]);

  const enviar = (paciente: PacienteFormulario) => {
    if (enviando.current) return;
    enviando.current = true;
    setErrorGeneral(null);
    reservar.mutate(
      { servicio: servicioId, inicio, dentista, paciente },
      {
        onSuccess: (cita) => {
          borrarGuardado();
          navigate("/reservar/confirmada", { state: { cita } });
        },
        onError: (error) => {
          enviando.current = false;
          if (
            error instanceof ApiError &&
            (error.status === 409 || error.detalle === HORA_NO_DISPONIBLE)
          ) {
            qc.invalidateQueries({ queryKey: ["horas"] });
            qc.invalidateQueries({ queryKey: ["dias"] });
            onHoraPerdida(error.status === 409 ? "ocupada" : "no-disponible");
            return;
          }
          const campos = error instanceof ApiError ? error.campos : {};
          const propios = (Object.keys(campos) as (keyof PacienteFormulario)[]).filter(
            (c) => c in VACIO,
          );
          if (propios.length) {
            propios.forEach((c) => setError(c, { message: campos[c][0] }));
          } else {
            setErrorGeneral(error);
          }
        },
      },
    );
  };

  return (
    <section>
      <TituloPaso descripcion="No necesitas crear una cuenta. Te enviaremos la confirmación y un enlace para gestionar la cita.">
        ¿A nombre de quién?
      </TituloPaso>
      <form
        noValidate
        onSubmit={(e) => handleSubmit(enviar)(e)}
        className="grid gap-5 rounded-[20px] border border-borde bg-white p-7 sm:grid-cols-2"
      >
        <Campo
          id="nombre"
          etiqueta="Nombre"
          autoComplete="given-name"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Campo
          id="apellidos"
          etiqueta="Apellidos"
          autoComplete="family-name"
          error={errors.apellidos?.message}
          {...register("apellidos")}
        />
        <Campo
          id="email"
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          className="sm:col-span-2"
          error={errors.email?.message}
          {...register("email")}
        />
        <Campo
          id="telefono"
          etiqueta="Teléfono"
          type="tel"
          autoComplete="tel"
          className="sm:col-span-2"
          ayuda="Solo lo usamos si hay que avisarte de un cambio."
          error={errors.telefono?.message}
          {...register("telefono")}
        />
        {errorGeneral ? (
          <div className="sm:col-span-2">
            <EstadoError error={errorGeneral} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EFE8DB] pt-2 sm:col-span-2">
          <span className="text-[13px] text-texto-3">Último paso</span>
          <Boton
            type="submit"
            tamano="lg"
            cargando={reservar.isPending}
            textoCargando="Confirmando…"
          >
            Confirmar la cita
          </Boton>
        </div>
      </form>
    </section>
  );
}
