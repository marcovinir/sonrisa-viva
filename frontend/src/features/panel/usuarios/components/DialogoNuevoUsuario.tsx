import { useState, type FormEvent } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton, BotonEnlace } from "../../../../shared/ui/Boton";
import { Campo } from "../../../../shared/ui/Campo";
import { useDentistasPanel } from "../../agenda/api";
import { Dialogo } from "../../ui/Dialogo";
import { useCrearUsuario, type NuevoUsuario, type UsuarioPanel } from "../api";

const VACIO: NuevoUsuario = { email: "", nombre: "", apellidos: "", rol: "dentista" };
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(d: NuevoUsuario): Record<string, string> {
  const e: Record<string, string> = {};
  if (!CORREO.test(d.email.trim())) e.email = "Escribe un correo válido.";
  if (!d.nombre.trim()) e.nombre = "Escribe el nombre.";
  if (!d.apellidos.trim()) e.apellidos = "Escribe los apellidos.";
  return e;
}

function Formulario({ onCerrar }: { onCerrar: () => void }) {
  const crear = useCrearUsuario();
  const dentistas = useDentistasPanel();
  const [datos, setDatos] = useState<NuevoUsuario>(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [creado, setCreado] = useState<UsuarioPanel | null>(null);

  const cambiar = (clave: keyof NuevoUsuario, valor: string) =>
    setDatos((d) => ({ ...d, [clave]: valor }));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validar(datos);
    setErrores(encontrados);
    setErrorGeneral(null);
    if (Object.keys(encontrados).length) return;
    const limpio = {
      email: datos.email.trim(),
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      rol: datos.rol,
    };
    crear.mutate(limpio, {
      onSuccess: setCreado,
      onError: (error) => {
        const campos = error instanceof ApiError ? error.campos : {};
        if (Object.keys(campos).length)
          setErrores(Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, v.join(" ")])));
        else
          setErrorGeneral(
            error instanceof ApiError ? error.detalle : "No pudimos crear el usuario.",
          );
      },
    });
  };

  if (creado) {
    const perfil = dentistas.data?.results.find((d) => d.usuario.id === creado.id);
    return (
      <div className="flex flex-col gap-4 text-tinta">
        <p
          role="status"
          className="m-0 rounded-xl bg-[#EAF3EA] px-4 py-3 font-semibold text-[#1F4A28]"
        >
          Le enviamos un correo a {creado.email} para que active su cuenta.
        </p>
        {creado.rol === "dentista" ? (
          <p className="m-0 text-texto-2">
            Mientras tanto puedes completar su perfil y su horario para que aparezca en la web.
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2.5 pt-2">
          <Boton variante="claro" onClick={onCerrar}>
            Cerrar
          </Boton>
          {creado.rol === "dentista" ? (
            <BotonEnlace to={perfil ? `/panel/dentistas?id=${perfil.id}` : "/panel/dentistas"}>
              Completar su perfil
            </BotonEnlace>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 text-tinta">
      <p className="m-0 text-texto-2">
        Le llegará un correo para elegir su contraseña. No hace falta que se la inventes tú.
      </p>
      {errorGeneral ? (
        <p
          role="alert"
          className="m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
        >
          {errorGeneral}
        </p>
      ) : null}
      <Campo
        id="nuevo-email"
        etiqueta="Correo"
        type="email"
        autoComplete="off"
        value={datos.email}
        error={errores.email}
        onChange={(e) => cambiar("email", e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="nuevo-nombre"
          etiqueta="Nombre"
          value={datos.nombre}
          error={errores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
        />
        <Campo
          id="nuevo-apellidos"
          etiqueta="Apellidos"
          value={datos.apellidos}
          error={errores.apellidos}
          onChange={(e) => cambiar("apellidos", e.target.value)}
        />
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-bold">Rol</legend>
        {(
          [
            ["admin", "Admin", "Gestiona usuarios, catálogo, dentistas, citas y reportes."],
            [
              "dentista",
              "Dentista",
              "Ve su agenda y sus citas, marca asistencia y bloquea horarios.",
            ],
          ] as const
        ).map(([valor, titulo, texto]) => (
          <label
            key={valor}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-3 ${
              datos.rol === valor ? "border-petroleo bg-[#F3F8F9]" : "border-borde"
            }`}
          >
            <input
              type="radio"
              name="nuevo-rol"
              value={valor}
              checked={datos.rol === valor}
              onChange={() => cambiar("rol", valor)}
              className="mt-0.5 size-5 accent-petroleo"
            />
            <span>
              <span className="block font-bold">{titulo}</span>
              <span className="block text-[13px] text-texto-3">{texto}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2.5 pt-2">
        <Boton variante="claro" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={crear.isPending} textoCargando="Creando…">
          Crear usuario
        </Boton>
      </div>
    </form>
  );
}

export function DialogoNuevoUsuario({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  return (
    <Dialogo abierto={abierto} titulo="Nuevo usuario" onCerrar={onCerrar}>
      <Formulario onCerrar={onCerrar} />
    </Dialogo>
  );
}
