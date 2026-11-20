import { useEffect, useRef, useState } from "react";
import type { DentistaPanel } from "../../agenda/api";
import { ESTADOS_FILTRO, type ClaveFiltro, type FiltrosCitas } from "../filtros";

const CONTROL =
  "min-h-11 w-full rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3 text-sm font-medium text-tinta " +
  "transition-[border-color,box-shadow] hover:border-[#8FA4AA] focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none";
const ETIQUETA = "text-[13px] font-bold";

/** Campo de búsqueda que aplica el filtro 350 ms después de dejar de escribir. */
function BuscarPaciente({ valor, onCambiar }: { valor: string; onCambiar: (v: string) => void }) {
  const [texto, setTexto] = useState(valor);
  const [previo, setPrevio] = useState(valor);
  // Si la URL cambia desde fuera (un chip, «Limpiar todo»), el campo la sigue.
  if (valor !== previo) {
    setPrevio(valor);
    setTexto(valor);
  }
  // La función cambia en cada render; la ref evita reiniciar la pausa por eso.
  const alCambiar = useRef(onCambiar);
  useEffect(() => {
    alCambiar.current = onCambiar;
  }, [onCambiar]);
  useEffect(() => {
    if (texto.trim() === valor) return;
    const id = window.setTimeout(() => alCambiar.current(texto.trim()), 350);
    return () => window.clearTimeout(id);
  }, [texto, valor]);

  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <label htmlFor="filtro-q" className={ETIQUETA}>
        Paciente
      </label>
      <input
        id="filtro-q"
        type="search"
        placeholder="Nombre o correo"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className={CONTROL}
      />
    </div>
  );
}

export function Filtros({
  filtros,
  dentistas,
  onCambiar,
}: {
  filtros: FiltrosCitas;
  dentistas: DentistaPanel[] | null;
  onCambiar: (cambios: Partial<Record<ClaveFiltro, string>>) => void;
}) {
  return (
    <form
      role="search"
      aria-label="Filtrar citas"
      onSubmit={(e) => e.preventDefault()}
      className="animar-entrada grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] items-end gap-3.5 rounded-[18px] border border-borde bg-white p-[18px]"
    >
      <BuscarPaciente valor={filtros.q} onCambiar={(q) => onCambiar({ q })} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-desde" className={ETIQUETA}>
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={filtros.desde}
          max={filtros.hasta || undefined}
          onChange={(e) => onCambiar({ desde: e.target.value })}
          className={CONTROL}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-hasta" className={ETIQUETA}>
          Hasta
        </label>
        <input
          id="filtro-hasta"
          type="date"
          value={filtros.hasta}
          min={filtros.desde || undefined}
          onChange={(e) => onCambiar({ hasta: e.target.value })}
          className={CONTROL}
        />
      </div>
      {dentistas ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-dentista" className={ETIQUETA}>
            Dentista
          </label>
          <select
            id="filtro-dentista"
            value={filtros.dentista}
            onChange={(e) => onCambiar({ dentista: e.target.value })}
            className={CONTROL}
          >
            <option value="">Todos</option>
            {dentistas.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.usuario.nombre} {d.usuario.apellidos}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-estado" className={ETIQUETA}>
          Estado
        </label>
        <select
          id="filtro-estado"
          value={filtros.estado}
          onChange={(e) => onCambiar({ estado: e.target.value })}
          className={CONTROL}
        >
          <option value="">Todos</option>
          {ESTADOS_FILTRO.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.texto}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
