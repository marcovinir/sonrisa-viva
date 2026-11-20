import { useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { EstadoError } from "../../../../shared/ui/Estado";
import { useSesion } from "../../auth/useSesion";
import { useDentistasPanel } from "../../agenda/api";
import { useAviso } from "../../ui/avisosContexto";
import { CampoBusqueda } from "../../ui/CampoBusqueda";
import { EncabezadoPagina } from "../../ui/EncabezadoPagina";
import { Paginacion } from "../../ui/Paginacion";
import { Tabla, type Columna } from "../../ui/Tabla";
import { useAccionUsuario, useEditarUsuario, useUsuarios, type UsuarioPanel } from "../api";
import { DialogoDesactivar } from "../components/DialogoDesactivar";
import { DialogoNuevoUsuario } from "../components/DialogoNuevoUsuario";

const CONTROL =
  "min-h-11 w-full rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3 text-sm font-medium text-tinta";
const ACCION =
  "min-h-10 rounded-full px-3 text-[13px] font-bold transition-colors duration-200 hover:bg-marfil";

const estadoDe = (u: UsuarioPanel) =>
  !u.is_active
    ? { texto: "Inactivo", clase: "bg-[#F1EEE8] text-texto-2" }
    : !u.activado
      ? { texto: "Pendiente de activar", clase: "bg-[#F6EDE0] text-[#6B5330]" }
      : { texto: "Activo", clase: "bg-[#EAF3EA] text-[#1F4A28]" };

/** Nombre y apellidos editables en la misma fila. */
function EditarNombre({ usuario, onListo }: { usuario: UsuarioPanel; onListo: () => void }) {
  const editar = useEditarUsuario();
  const { mostrar } = useAviso();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellidos, setApellidos] = useState(usuario.apellidos);
  const completo = `${usuario.nombre} ${usuario.apellidos}`;
  const guardar = () => {
    if (!nombre.trim() || !apellidos.trim()) return;
    editar.mutate(
      { id: usuario.id, datos: { nombre: nombre.trim(), apellidos: apellidos.trim() } },
      {
        onSuccess: () => {
          mostrar("Nombre actualizado");
          onListo();
        },
        onError: (e) =>
          mostrar(e instanceof ApiError ? e.detalle : "No pudimos guardar el nombre.", "error"),
      },
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        aria-label={`Nombre de ${completo}`}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className={`${CONTROL} w-32!`}
      />
      <input
        aria-label={`Apellidos de ${completo}`}
        value={apellidos}
        onChange={(e) => setApellidos(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && guardar()}
        className={`${CONTROL} w-40!`}
      />
      <button
        type="button"
        onClick={guardar}
        className={`${ACCION} bg-petroleo text-white hover:bg-tinta`}
      >
        Guardar
      </button>
      <button type="button" onClick={onListo} className={ACCION}>
        Cancelar
      </button>
    </div>
  );
}

export function UsuariosPage() {
  const { yo } = useSesion();
  const [params, setParams] = useSearchParams();
  const filtros = {
    q: params.get("q") ?? "",
    rol: params.get("rol") ?? "",
    activo: params.get("activo") ?? "",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
  const usuarios = useUsuarios(filtros);
  const dentistas = useDentistasPanel();
  const accion = useAccionUsuario();
  const { mostrar } = useAviso();
  const [nuevo, setNuevo] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [aDesactivar, setADesactivar] = useState<UsuarioPanel | null>(null);

  const cambiar = (cambios: Record<string, string>) => {
    const siguiente = new URLSearchParams(params);
    for (const [k, v] of Object.entries(cambios)) {
      if (v) siguiente.set(k, v);
      else siguiente.delete(k);
    }
    if (!("page" in cambios)) siguiente.delete("page");
    setParams(siguiente, { replace: true });
  };
  const perfilDe = (u: UsuarioPanel) =>
    dentistas.data?.results.find((d) => d.usuario.id === u.id)?.id;
  const nombre = (u: UsuarioPanel) => `${u.nombre} ${u.apellidos}`;

  const ejecutar = (u: UsuarioPanel, tipo: "reactivar" | "reenviar-activacion") =>
    accion.mutate(
      { id: u.id, accion: tipo },
      {
        onSuccess: () =>
          mostrar(
            tipo === "reactivar"
              ? `${u.nombre} puede volver a entrar al panel`
              : `Le reenviamos el correo de activación a ${u.email}.`,
          ),
        onError: (e) => mostrar(e instanceof ApiError ? e.detalle : "No pudimos hacerlo.", "error"),
      },
    );

  const columnas: Columna<UsuarioPanel>[] = [
    {
      clave: "usuario",
      titulo: "Usuario",
      celda: (u) =>
        editando === u.id ? (
          <EditarNombre usuario={u} onListo={() => setEditando(null)} />
        ) : (
          <>
            <strong>{nombre(u)}</strong>
            <div className="text-[13px] text-texto-3">{u.email}</div>
          </>
        ),
    },
    {
      clave: "rol",
      titulo: "Rol",
      celda: (u) => (u.rol === "admin" ? "Admin" : "Dentista"),
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (u) => {
        const e = estadoDe(u);
        return (
          <span
            className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold ${e.clase}`}
          >
            {e.texto}
          </span>
        );
      },
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      alinear: "der",
      celda: (u) => (
        <div className="flex flex-wrap justify-end gap-1">
          {editando !== u.id ? (
            <button
              type="button"
              aria-label={`Editar nombre de ${nombre(u)}`}
              onClick={() => setEditando(u.id)}
              className={ACCION}
            >
              Editar nombre
            </button>
          ) : null}
          {u.is_active && u.activado === false ? (
            <button
              type="button"
              aria-label={`Reenviar activación a ${nombre(u)}`}
              onClick={() => ejecutar(u, "reenviar-activacion")}
              className={`${ACCION} text-petroleo`}
            >
              Reenviar activación
            </button>
          ) : null}
          {u.id === yo?.id ? (
            <span className="inline-flex min-h-10 items-center px-3 text-[13px] text-texto-3">
              Es tu cuenta
            </span>
          ) : u.is_active ? (
            <button
              type="button"
              aria-label={`Desactivar a ${nombre(u)}`}
              onClick={() => setADesactivar(u)}
              className={`${ACCION} text-peligro hover:bg-[#FBF1F0]`}
            >
              Desactivar
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Reactivar a ${nombre(u)}`}
              onClick={() => ejecutar(u, "reactivar")}
              className={`${ACCION} text-exito`}
            >
              Reactivar
            </button>
          )}
        </div>
      ),
    },
  ];

  const total = usuarios.data?.count ?? 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion={
          usuarios.data ? `${total} ${total === 1 ? "usuario" : "usuarios"}` : "Cargando…"
        }
        acciones={<Boton onClick={() => setNuevo(true)}>+ Nuevo usuario</Boton>}
      />
      <div className="flex flex-col gap-4">
        <form
          role="search"
          aria-label="Filtrar usuarios"
          onSubmit={(e) => e.preventDefault()}
          className="animar-entrada grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] items-end gap-3.5 rounded-[18px] border border-borde bg-white p-[18px]"
        >
          <CampoBusqueda
            id="usuarios-q"
            etiqueta="Buscar"
            placeholder="Nombre o correo"
            valor={filtros.q}
            onCambiar={(q) => cambiar({ q })}
            className="sm:col-span-2"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usuarios-rol" className="text-[13px] font-bold">
              Rol
            </label>
            <select
              id="usuarios-rol"
              value={filtros.rol}
              onChange={(e) => cambiar({ rol: e.target.value })}
              className={CONTROL}
            >
              <option value="">Todos</option>
              <option value="admin">Admin</option>
              <option value="dentista">Dentista</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usuarios-activo" className="text-[13px] font-bold">
              Estado
            </label>
            <select
              id="usuarios-activo"
              value={filtros.activo}
              onChange={(e) => cambiar({ activo: e.target.value })}
              className={CONTROL}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </form>
        {usuarios.isError ? (
          <EstadoError error={usuarios.error} onReintentar={() => void usuarios.refetch()} />
        ) : usuarios.isPending ? (
          <p className="m-0 rounded-[18px] border border-borde bg-white p-6 text-texto-2">
            Cargando usuarios…
          </p>
        ) : (
          <Tabla
            etiqueta="Lista de usuarios"
            columnas={columnas}
            filas={usuarios.data.results}
            clave={(u) => u.id}
            vacio={<p className="m-0 text-texto-2">No hay usuarios con estos filtros.</p>}
            pie={
              total > 0 ? (
                <Paginacion
                  pagina={filtros.page}
                  total={total}
                  onCambiar={(p) => cambiar({ page: p > 1 ? String(p) : "" })}
                />
              ) : null
            }
          />
        )}
      </div>
      <DialogoNuevoUsuario abierto={nuevo} onCerrar={() => setNuevo(false)} />
      <DialogoDesactivar
        usuario={aDesactivar}
        perfilId={aDesactivar ? perfilDe(aDesactivar) : undefined}
        onCerrar={() => setADesactivar(null)}
      />
    </>
  );
}
