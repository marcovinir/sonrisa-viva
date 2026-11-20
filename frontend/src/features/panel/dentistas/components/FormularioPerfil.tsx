import { useState, type FormEvent } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Campo } from "../../../../shared/ui/Campo";
import { Chip } from "../../../../shared/ui/Chip";
import { useAviso } from "../../ui/avisosContexto";
import type { DentistaPanel } from "../../agenda/api";
import type { ServicioPanel } from "../../servicios/api";
import { useGuardarPerfil, type DatosPerfil } from "../api";
import { Retrato } from "./Retrato";

/** Pestaña «Perfil»: lo que se muestra en la web y los servicios que hace. */
export function FormularioPerfil({
  dentista,
  servicios,
}: {
  dentista: DentistaPanel;
  servicios: ServicioPanel[];
}) {
  const guardar = useGuardarPerfil();
  const { mostrar } = useAviso();
  const [datos, setDatos] = useState<DatosPerfil>({
    especialidad: dentista.especialidad,
    biografia: dentista.biografia,
    foto_url: dentista.foto_url,
    visible_en_web: dentista.visible_en_web,
    servicios: dentista.servicios,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const cambiar = <K extends keyof DatosPerfil>(clave: K, valor: DatosPerfil[K]) =>
    setDatos((d) => ({ ...d, [clave]: valor }));
  const alternarServicio = (id: number) =>
    cambiar(
      "servicios",
      datos.servicios.includes(id)
        ? datos.servicios.filter((s) => s !== id)
        : [...datos.servicios, id].sort((a, b) => a - b),
    );

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);
    guardar.mutate(
      { id: dentista.id, datos: { ...datos, foto_url: datos.foto_url.trim() } },
      {
        onSuccess: () => mostrar("Perfil guardado"),
        onError: (error) => {
          const campos = error instanceof ApiError ? error.campos : {};
          if (Object.keys(campos).length)
            setErrores(
              Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, v.join(" ")])),
            );
          else
            setErrorGeneral(
              error instanceof ApiError ? error.detalle : "No pudimos guardar el perfil.",
            );
        },
      },
    );
  };

  // Los inactivos solo se listan si el dentista ya los tenía asignados.
  const elegibles = servicios.filter((s) => s.activo || datos.servicios.includes(s.id));

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral ? (
        <p
          role="alert"
          className="m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
        >
          {errorGeneral}
        </p>
      ) : null}
      <Campo
        id="perfil-especialidad"
        etiqueta="Especialidad"
        value={datos.especialidad}
        maxLength={120}
        error={errores.especialidad}
        onChange={(e) => cambiar("especialidad", e.target.value)}
      />
      <Campo
        as="textarea"
        id="perfil-biografia"
        etiqueta="Biografía"
        rows={4}
        value={datos.biografia}
        ayuda="Dos o tres frases para la sección «Equipo» de la web."
        error={errores.biografia}
        onChange={(e) => cambiar("biografia", e.target.value)}
      />
      <div className="flex items-end gap-3">
        <Retrato
          key={datos.foto_url}
          nombre={dentista.usuario.nombre}
          apellidos={dentista.usuario.apellidos}
          foto={datos.foto_url.trim()}
          tamano={56}
        />
        <Campo
          id="perfil-foto"
          etiqueta="Foto (enlace)"
          type="url"
          inputMode="url"
          placeholder="https://…"
          className="flex-1"
          value={datos.foto_url}
          ayuda="Si el enlace no carga, se muestran las iniciales."
          error={errores.foto_url}
          onChange={(e) => cambiar("foto_url", e.target.value)}
        />
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-bold">Servicios que hace</legend>
        <div className="flex flex-wrap gap-2">
          {elegibles.map((s) => (
            <Chip
              key={s.id}
              activo={datos.servicios.includes(s.id)}
              onClick={() => alternarServicio(s.id)}
            >
              {s.nombre}
            </Chip>
          ))}
        </div>
        {errores.servicios ? (
          <p className="m-0 text-[13px] font-semibold text-error">{errores.servicios}</p>
        ) : null}
        <p className="m-0 text-[13px] text-texto-3">
          Solo se le asignan citas de los servicios marcados.
        </p>
      </fieldset>
      <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-5 accent-petroleo"
          checked={datos.visible_en_web}
          onChange={(e) => cambiar("visible_en_web", e.target.checked)}
        />
        Visible en la web
      </label>
      <div className="border-t border-[#F1EEE8] pt-4">
        <Boton type="submit" cargando={guardar.isPending} textoCargando="Guardando…">
          Guardar perfil
        </Boton>
      </div>
    </form>
  );
}
