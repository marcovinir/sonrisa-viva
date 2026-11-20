import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { EstadoError } from "../../../../shared/ui/Estado";
import { useDentistasPanel, type DentistaPanel } from "../../agenda/api";
import { EncabezadoPagina } from "../../ui/EncabezadoPagina";
import { useServiciosTodos } from "../api";
import { EditorHorario } from "../components/EditorHorario";
import { FormularioPerfil } from "../components/FormularioPerfil";
import { ListaBloqueos } from "../components/ListaBloqueos";
import { Retrato } from "../components/Retrato";

const PESTANAS = ["Perfil", "Horario", "Bloqueos"] as const;
type Pestana = (typeof PESTANAS)[number];

const Insignia = ({ texto, tono }: { texto: string; tono: "ok" | "aviso" | "peligro" }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
      tono === "ok"
        ? "bg-[#EAF3EA] text-[#1F4A28]"
        : tono === "aviso"
          ? "bg-[#F1EEE8] text-texto-2"
          : "bg-[#FBF1F0] text-peligro"
    }`}
  >
    {texto}
  </span>
);

/** Pestañas con flechas, Inicio y Fin (patrón WAI-ARIA con activación automática). */
function Detalle({ dentista }: { dentista: DentistaPanel }) {
  const servicios = useServiciosTodos();
  const [pestana, setPestana] = useState<Pestana>("Perfil");
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const nombre = `${dentista.usuario.nombre} ${dentista.usuario.apellidos}`;

  const alTeclear = (e: KeyboardEvent, i: number) => {
    const destino =
      e.key === "ArrowRight"
        ? (i + 1) % PESTANAS.length
        : e.key === "ArrowLeft"
          ? (i - 1 + PESTANAS.length) % PESTANAS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? PESTANAS.length - 1
              : null;
    if (destino === null) return;
    e.preventDefault();
    setPestana(PESTANAS[destino]);
    refs.current[destino]?.focus();
  };

  return (
    <section
      aria-labelledby={`${base}-nombre`}
      className="animar-derecha flex min-w-0 flex-[999_1_480px] flex-col gap-5 rounded-[20px] border border-borde bg-white p-6"
    >
      <div className="flex items-center gap-4">
        <Retrato
          key={dentista.foto_url}
          nombre={dentista.usuario.nombre}
          apellidos={dentista.usuario.apellidos}
          foto={dentista.foto_url}
          tamano={64}
        />
        <div className="min-w-0">
          <h2
            id={`${base}-nombre`}
            className="m-0 font-serif text-[30px] font-semibold leading-tight"
          >
            {nombre}
          </h2>
          <p className="m-0 text-sm text-texto-2">
            {dentista.especialidad || "Sin especialidad"} · {dentista.usuario.email}
          </p>
        </div>
      </div>
      {!dentista.visible_en_web ? (
        <p className="m-0 rounded-xl bg-[#F1EADD] px-4 py-3 text-sm text-[#4A3A22]">
          Completa el perfil y el horario, y marca Visible en la web para que aparezca en el sitio.
        </p>
      ) : null}

      <div
        role="tablist"
        aria-label="Datos del dentista"
        className="flex gap-1 border-b border-borde"
      >
        {PESTANAS.map((p, i) => {
          const activa = p === pestana;
          return (
            <button
              key={p}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={activa}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(p)}
              onKeyDown={(e) => alTeclear(e, i)}
              className={`-mb-px min-h-11 border-b-[3px] px-4 text-sm font-bold transition-colors ${
                activa
                  ? "border-petroleo text-petroleo"
                  : "border-transparent text-texto-2 hover:text-tinta"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
      {PESTANAS.map((p, i) =>
        p === pestana ? (
          <div
            key={p}
            role="tabpanel"
            id={`${base}-panel-${i}`}
            aria-labelledby={`${base}-tab-${i}`}
            tabIndex={0}
            className="animar-in focus-visible:outline-offset-4"
          >
            {p === "Perfil" ? (
              <FormularioPerfil dentista={dentista} servicios={servicios.data?.results ?? []} />
            ) : p === "Horario" ? (
              <EditorHorario dentista={dentista} />
            ) : (
              <ListaBloqueos dentistaId={dentista.id} />
            )}
          </div>
        ) : null,
      )}
    </section>
  );
}

export function DentistasPage() {
  const dentistas = useDentistasPanel();
  const [params, setParams] = useSearchParams();
  const lista = dentistas.data?.results ?? [];
  const elegido = lista.find((d) => String(d.id) === params.get("id")) ?? lista[0];
  const visibles = lista.filter((d) => d.visible_en_web).length;

  return (
    <>
      <EncabezadoPagina
        titulo="Dentistas"
        descripcion={
          dentistas.data
            ? `${lista.length} ${lista.length === 1 ? "dentista" : "dentistas"} · ${visibles} visibles en la web`
            : "Cargando…"
        }
      />
      {dentistas.isError ? (
        <EstadoError error={dentistas.error} onReintentar={() => void dentistas.refetch()} />
      ) : dentistas.isPending ? (
        <p className="m-0 text-texto-2">Cargando dentistas…</p>
      ) : lista.length === 0 ? (
        <p className="m-0 rounded-2xl border border-borde bg-white p-6 text-texto-2">
          Todavía no hay dentistas. Se crean desde Usuarios, con el rol Dentista.
        </p>
      ) : (
        <div className="flex flex-wrap items-start gap-[22px]">
          <ul
            aria-label="Dentistas"
            className="m-0 flex flex-[1_1_260px] list-none flex-col gap-2 p-0 lg:max-w-[320px]"
          >
            {lista.map((d) => {
              const activo = d.id === elegido?.id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    aria-current={activo ? "true" : undefined}
                    onClick={() => setParams({ id: String(d.id) }, { replace: true })}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[transform,box-shadow,background-color] duration-200 motion-safe:hover:-translate-y-px ${
                      activo
                        ? "border-petroleo bg-[#F3F8F9] shadow-[inset_4px_0_0_#13505F]"
                        : "border-borde bg-white hover:shadow-[0_10px_20px_-14px_rgba(14,47,56,.5)]"
                    }`}
                  >
                    <Retrato
                      nombre={d.usuario.nombre}
                      apellidos={d.usuario.apellidos}
                      foto={d.foto_url}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">
                        {d.usuario.nombre} {d.usuario.apellidos}
                      </span>
                      <span className="block truncate text-[13px] text-texto-3">
                        {d.especialidad || "Sin especialidad"}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {d.visible_en_web ? (
                          <Insignia texto="Visible" tono="ok" />
                        ) : (
                          <Insignia texto="Oculto en la web" tono="aviso" />
                        )}
                        {!d.usuario.activado ? (
                          <Insignia texto="Pendiente de activar" tono="aviso" />
                        ) : !d.usuario.is_active ? (
                          <Insignia texto="Cuenta inactiva" tono="peligro" />
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {elegido ? <Detalle key={elegido.id} dentista={elegido} /> : null}
        </div>
      )}
    </>
  );
}
