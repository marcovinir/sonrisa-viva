import { useState } from "react";
import { EstadoError } from "../../../../shared/ui/Estado";
import { useSesion } from "../../auth/useSesion";
import { useDentistasPanel, type CitaPanel } from "../../agenda/api";
import { DialogoCancelar } from "../../agenda/components/DialogoCancelar";
import { estadoVisual, fechaCorta, horaCorta } from "../../agenda/semana";
import { nombreSeccion, SECCIONES } from "../../estructura/secciones";
import { EncabezadoPagina } from "../../ui/EncabezadoPagina";
import { InsigniaEstado } from "../../ui/InsigniaEstado";
import { Paginacion } from "../../ui/Paginacion";
import { Tabla, type Columna } from "../../ui/Tabla";
import { useCitas } from "../api";
import { ChipsFiltros } from "../components/ChipsFiltros";
import { DialogoCita } from "../components/DialogoCita";
import { Filtros } from "../components/Filtros";
import { useFiltrosCitas } from "../filtros";

const BOTON_FILA =
  "min-h-10 rounded-full px-3.5 text-[13px] transition-[transform,background-color] duration-200 motion-safe:hover:-translate-y-px";

export function CitasPage() {
  const { yo, puede } = useSesion();
  const veTodas = puede("citas.ver_todas");
  const gestiona = puede("citas.gestionar_todas");
  const { filtros, activos, cambiar, quitar, limpiar, irAPagina } = useFiltrosCitas();
  const citas = useCitas(filtros);
  const dentistas = useDentistasPanel(veTodas);
  const listaDentistas = veTodas ? (dentistas.data?.results ?? []) : null;
  const [ahora] = useState(() => new Date());
  const [verId, setVerId] = useState<number | null>(null);
  const [cancelarId, setCancelarId] = useState<number | null>(null);

  const filas = citas.data?.results ?? [];
  const total = citas.data?.count ?? 0;
  // Se buscan en la página actual para que el diálogo muestre el estado al día.
  const vista = filas.find((c) => c.id === verId) ?? null;
  const aCancelar = filas.find((c) => c.id === cancelarId) ?? null;
  const nombre = (c: CitaPanel) => `${c.paciente.nombre} ${c.paciente.apellidos}`;

  const columnas: Columna<CitaPanel>[] = [
    {
      clave: "fecha",
      titulo: "Fecha y hora",
      celda: (c) => (
        <>
          <strong>{fechaCorta(c.inicio)}</strong>
          <div className="text-[13px] text-texto-3">
            {horaCorta(c.inicio)} – {horaCorta(c.fin)}
          </div>
        </>
      ),
    },
    {
      clave: "paciente",
      titulo: "Paciente",
      celda: (c) => (
        <>
          <strong>{nombre(c)}</strong>
          <div className="text-[13px] text-texto-3">{c.paciente.email}</div>
        </>
      ),
    },
    { clave: "servicio", titulo: "Servicio", celda: (c) => c.servicio.nombre },
    ...(veTodas
      ? [
          {
            clave: "dentista",
            titulo: "Dentista",
            celda: (c: CitaPanel) => `${c.dentista.nombre} ${c.dentista.apellidos}`,
          },
        ]
      : []),
    {
      clave: "estado",
      titulo: "Estado",
      celda: (c) => <InsigniaEstado estado={estadoVisual(c, ahora)} />,
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      alinear: "der",
      celda: (c) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label={`Ver cita de ${nombre(c)}`}
            onClick={() => setVerId(c.id)}
            className={`${BOTON_FILA} border-[1.5px] border-[#CFC3AE] bg-white font-semibold hover:border-tinta`}
          >
            Ver
          </button>
          {gestiona && c.estado === "confirmada" ? (
            <button
              type="button"
              aria-label={`Cancelar cita de ${nombre(c)}`}
              onClick={() => setCancelarId(c.id)}
              className={`${BOTON_FILA} font-bold text-peligro hover:bg-[#FBF1F0]`}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const titulo = nombreSeccion(SECCIONES[1], yo);
  const descripcion = citas.data
    ? `${total} ${total === 1 ? "cita" : "citas"}${activos ? " con estos filtros" : ""}`
    : "Cargando…";

  return (
    <>
      <EncabezadoPagina titulo={titulo} descripcion={descripcion} />
      <div className="flex flex-col gap-4">
        <Filtros filtros={filtros} dentistas={listaDentistas} onCambiar={cambiar} />
        <ChipsFiltros
          filtros={filtros}
          dentistas={listaDentistas}
          onQuitar={quitar}
          onLimpiar={limpiar}
        />
        {citas.isError ? (
          <EstadoError error={citas.error} onReintentar={() => void citas.refetch()} />
        ) : citas.isPending ? (
          <p className="m-0 rounded-[18px] border border-borde bg-white p-6 text-texto-2">
            Cargando citas…
          </p>
        ) : (
          <Tabla
            etiqueta="Lista de citas"
            columnas={columnas}
            filas={filas}
            clave={(c) => c.id}
            filaActiva={verId}
            vacio={
              activos ? (
                <div className="flex flex-col items-start gap-2">
                  <strong className="text-base">No hay citas con estos filtros</strong>
                  <p className="m-0 text-sm text-texto-2">
                    Prueba con otras fechas o quita algún filtro.
                  </p>
                  <button
                    type="button"
                    onClick={limpiar}
                    className="min-h-11 rounded-full border-[1.5px] border-tinta px-5 text-sm font-semibold"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <p className="m-0 text-texto-2">Todavía no hay citas.</p>
              )
            }
            pie={
              total > 0 ? (
                <Paginacion pagina={filtros.page} total={total} onCambiar={irAPagina} />
              ) : null
            }
          />
        )}
      </div>
      <DialogoCita cita={vista} ahora={ahora} onCerrar={() => setVerId(null)} />
      <DialogoCancelar cita={aCancelar} onCerrar={() => setCancelarId(null)} />
    </>
  );
}
