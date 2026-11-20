import { useState } from "react";
import { useSearchParams } from "react-router";
import { colones } from "../../../../shared/lib/formato";
import { Boton } from "../../../../shared/ui/Boton";
import { Chip } from "../../../../shared/ui/Chip";
import { EstadoError } from "../../../../shared/ui/Estado";
import { IlustracionServicio } from "../../../../shared/ui/IlustracionServicio";
import { EncabezadoPagina } from "../../ui/EncabezadoPagina";
import { Tabla, type Columna } from "../../ui/Tabla";
import { useCategoriasPanel, useServiciosPanel, type ServicioPanel } from "../api";
import { DialogoCategorias } from "../components/DialogoCategorias";
import { FormularioServicio } from "../components/FormularioServicio";

export function ServiciosPage() {
  const [params, setParams] = useSearchParams();
  const verInactivos = params.get("ver") === "inactivos";
  const activos = useServiciosPanel(true);
  const inactivos = useServiciosPanel(false);
  const categorias = useCategoriasPanel();
  const [editando, setEditando] = useState<number | "nuevo" | null>(null);
  const [verCategorias, setVerCategorias] = useState(false);

  const lista = verInactivos ? inactivos : activos;
  const filas = lista.data?.results ?? [];
  const listaCategorias = categorias.data?.results ?? [];
  const nombreCategoria = (id: number) => listaCategorias.find((c) => c.id === id)?.nombre ?? "—";
  const total = (activos.data?.count ?? 0) + (inactivos.data?.count ?? 0);
  // El servicio puede pasar a la otra lista al guardarlo: se busca en las dos.
  const enEdicion =
    typeof editando === "number"
      ? ([...(activos.data?.results ?? []), ...(inactivos.data?.results ?? [])].find(
          (s) => s.id === editando,
        ) ?? null)
      : null;

  const mostrar = (inactivo: boolean) => {
    setParams(inactivo ? { ver: "inactivos" } : {}, { replace: true });
  };

  const columnas: Columna<ServicioPanel>[] = [
    {
      clave: "servicio",
      titulo: "Servicio",
      celda: (s) => (
        <span className="flex items-center gap-3">
          <IlustracionServicio
            slug={s.slug}
            categoria={nombreCategoria(s.categoria)}
            tamano="miniatura"
            className="shrink-0"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditando(s.id);
            }}
            className="min-h-11 text-left font-bold text-tinta hover:text-petroleo hover:underline"
          >
            {s.nombre}
          </button>
        </span>
      ),
    },
    {
      clave: "categoria",
      titulo: "Categoría",
      celda: (s) => <span className="text-texto-2">{nombreCategoria(s.categoria)}</span>,
    },
    {
      clave: "duracion",
      titulo: "Duración",
      celda: (s) => <span className="text-texto-2">{s.duracion_min} min</span>,
    },
    {
      clave: "precio",
      titulo: "Precio",
      alinear: "der",
      celda: (s) => <span className="font-semibold">{colones(s.precio_colones)}</span>,
    },
  ];

  const descripcion =
    activos.data && categorias.data
      ? `${total} ${total === 1 ? "servicio" : "servicios"} en ${listaCategorias.length} ${
          listaCategorias.length === 1 ? "categoría" : "categorías"
        }`
      : "Cargando…";

  return (
    <>
      <EncabezadoPagina
        titulo="Servicios"
        descripcion={descripcion}
        acciones={
          <>
            <Boton variante="contorno" onClick={() => setVerCategorias(true)}>
              Categorías
            </Boton>
            <Boton onClick={() => setEditando("nuevo")} disabled={listaCategorias.length === 0}>
              + Nuevo servicio
            </Boton>
          </>
        }
      />
      <div className="flex flex-wrap items-start gap-[22px]">
        <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <div role="group" aria-label="Mostrar" className="flex flex-wrap gap-2">
            <Chip activo={!verInactivos} onClick={() => mostrar(false)}>
              Activos ({activos.data?.count ?? "…"})
            </Chip>
            <Chip activo={verInactivos} onClick={() => mostrar(true)}>
              Inactivos ({inactivos.data?.count ?? "…"})
            </Chip>
          </div>
          {lista.isError ? (
            <EstadoError error={lista.error} onReintentar={() => void lista.refetch()} />
          ) : lista.isPending ? (
            <p className="m-0 rounded-[18px] border border-borde bg-white p-6 text-texto-2">
              Cargando servicios…
            </p>
          ) : (
            <Tabla
              etiqueta={verInactivos ? "Servicios inactivos" : "Servicios activos"}
              columnas={columnas}
              filas={filas}
              clave={(s) => s.id}
              onFila={(s) => setEditando(s.id)}
              filaActiva={typeof editando === "number" ? editando : null}
              vacio={
                <p className="m-0 text-texto-2">
                  {verInactivos
                    ? "No hay servicios inactivos. Los que ocultes de la web aparecerán aquí."
                    : "Todavía no hay servicios activos."}
                </p>
              }
            />
          )}
          <p className="m-0 text-[13px] text-texto-3">Haz clic en un servicio para editarlo.</p>
        </section>
        {editando !== null && (editando === "nuevo" || enEdicion) ? (
          <FormularioServicio
            key={editando}
            servicio={enEdicion}
            categorias={listaCategorias}
            onCerrar={() => setEditando(null)}
          />
        ) : null}
      </div>
      <DialogoCategorias
        abierto={verCategorias}
        categorias={listaCategorias}
        onCerrar={() => setVerCategorias(false)}
      />
    </>
  );
}
