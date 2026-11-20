import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Campo } from "../../../../shared/ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import {
  useBorrarServicio,
  useGuardarServicio,
  type CategoriaPanel,
  type ServicioPanel,
} from "../api";
import { servicioEsquema, type ServicioFormulario } from "../esquema";

const CAMPOS: (keyof ServicioFormulario)[] = [
  "nombre",
  "categoria",
  "duracion_min",
  "precio_colones",
  "descripcion",
  "indicaciones",
  "activo",
];

/** Panel lateral para crear o editar un servicio. */
export function FormularioServicio({
  servicio,
  categorias,
  onCerrar,
}: {
  servicio: ServicioPanel | null;
  categorias: CategoriaPanel[];
  onCerrar: () => void;
}) {
  const idTitulo = useId();
  const guardar = useGuardarServicio();
  const borrar = useBorrarServicio();
  const { mostrar } = useAviso();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const titulo = servicio ? "Editar servicio" : "Nuevo servicio";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ServicioFormulario>({
    resolver: zodResolver(servicioEsquema),
    defaultValues: servicio
      ? {
          nombre: servicio.nombre,
          categoria: servicio.categoria,
          duracion_min: servicio.duracion_min,
          precio_colones: servicio.precio_colones,
          descripcion: servicio.descripcion,
          indicaciones: servicio.indicaciones ?? "",
          activo: servicio.activo,
        }
      : {
          nombre: "",
          categoria: categorias[0]?.id,
          duracion_min: 30,
          descripcion: "",
          indicaciones: "",
          activo: true,
        },
  });

  const enviar = handleSubmit((datos) => {
    setErrorGeneral(null);
    guardar.mutate(
      { id: servicio?.id, datos },
      {
        onSuccess: () => {
          mostrar(servicio ? "Cambios guardados" : "Servicio creado");
          if (!servicio) onCerrar();
        },
        onError: (error) => {
          const campos = error instanceof ApiError ? error.campos : {};
          const propios = CAMPOS.filter((c) => campos[c]?.length);
          propios.forEach((c) => setError(c, { message: campos[c].join(" ") }));
          if (propios.length === 0)
            setErrorGeneral(
              error instanceof ApiError
                ? error.detalle
                : "No pudimos guardar el servicio. Intenta de nuevo.",
            );
        },
      },
    );
  });

  const confirmarBorrado = () => {
    if (!servicio) return;
    borrar.mutate(servicio.id, {
      onSuccess: () => {
        mostrar("Servicio borrado");
        onCerrar();
      },
      onError: (error) =>
        setErrorGeneral(
          error instanceof ApiError ? error.detalle : "No pudimos borrar el servicio.",
        ),
      onSettled: () => setConfirmarBorrar(false),
    });
  };

  return (
    <aside
      aria-labelledby={idTitulo}
      className="animar-derecha flex-[1_1_340px] rounded-[20px] border border-borde bg-white p-6 lg:sticky lg:top-6"
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id={idTitulo} className="m-0 font-serif text-[28px] font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="size-11 shrink-0 rounded-xl border border-borde bg-white text-lg"
          >
            ×
          </button>
        </div>
        {errorGeneral ? (
          <p
            role="alert"
            className="animar-temblor m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
          >
            {errorGeneral}
          </p>
        ) : null}
        <Campo
          id="servicio-nombre"
          etiqueta="Nombre"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="servicio-categoria" className="text-sm font-bold">
            Categoría
          </label>
          <select
            id="servicio-categoria"
            aria-invalid={errors.categoria ? true : undefined}
            aria-describedby={errors.categoria ? "servicio-categoria-error" : undefined}
            className="min-h-12 rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3 font-medium text-tinta"
            {...register("categoria", { valueAsNumber: true })}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errors.categoria ? (
            <p id="servicio-categoria-error" className="m-0 text-[13px] font-semibold text-error">
              {errors.categoria.message}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo
            id="servicio-duracion"
            etiqueta="Duración (min)"
            type="number"
            inputMode="numeric"
            step={15}
            min={15}
            error={errors.duracion_min?.message}
            className="col-span-2 sm:col-span-1"
            {...register("duracion_min", { valueAsNumber: true })}
          />
          <Campo
            id="servicio-precio"
            etiqueta="Precio (₡)"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            error={errors.precio_colones?.message}
            className="col-span-2 sm:col-span-1"
            {...register("precio_colones", { valueAsNumber: true })}
          />
        </div>
        <Campo
          as="textarea"
          id="servicio-descripcion"
          etiqueta="Descripción"
          rows={3}
          ayuda="Se muestra en la web, en la tarjeta del servicio."
          error={errors.descripcion?.message}
          {...register("descripcion")}
        />
        <Campo
          as="textarea"
          id="servicio-indicaciones"
          etiqueta="Indicaciones para el paciente"
          rows={2}
          ayuda="Salen en el correo de confirmación como «Antes de tu cita». Si lo dejas vacío, va un texto general."
          error={errors.indicaciones?.message}
          {...register("indicaciones")}
        />
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" className="size-5 accent-petroleo" {...register("activo")} />
          Visible en la web
        </label>
        <div className="flex flex-wrap gap-2.5 border-t border-[#F1EEE8] pt-4">
          <Boton
            type="submit"
            className="flex-auto"
            cargando={guardar.isPending}
            textoCargando="Guardando…"
          >
            {servicio ? "Guardar cambios" : "Crear servicio"}
          </Boton>
          {servicio ? (
            <Boton
              variante="claro"
              className="text-peligro!"
              onClick={() => setConfirmarBorrar(true)}
            >
              Borrar
            </Boton>
          ) : null}
        </div>
        {servicio ? (
          <p className="m-0 rounded-xl bg-[#F1EADD] px-3.5 py-3 text-[13px] leading-normal text-[#4A3A22]">
            Un servicio con citas no se puede borrar. Para quitarlo de la web, desmarca «Visible en
            la web».
          </p>
        ) : null}
      </form>

      <Dialogo
        abierto={confirmarBorrar}
        titulo={`¿Borrar «${servicio?.nombre ?? ""}»?`}
        onCerrar={() => setConfirmarBorrar(false)}
        acciones={
          <>
            <Boton variante="claro" onClick={() => setConfirmarBorrar(false)}>
              No, volver
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarBorrado}
              cargando={borrar.isPending}
              textoCargando="Borrando…"
            >
              Sí, borrar
            </Boton>
          </>
        }
      >
        <p className="m-0">
          El servicio desaparece del panel y de la web. Esto no se puede deshacer.
        </p>
      </Dialogo>
    </aside>
  );
}
