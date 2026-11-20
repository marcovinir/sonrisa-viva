import { fechaLarga, hora, partesCR } from "../../../shared/lib/formato";
import { Esqueleto, EstadoError, EstadoVacio } from "../../../shared/ui/Estado";
import type { DentistaElegido } from "../estado";
import { useHorasLibres, type HoraLibre } from "../api";

function Grupo({
  nombre,
  horas,
  elegida,
  onElegir,
}: {
  nombre: string;
  horas: HoraLibre[];
  elegida: string | null;
  onElegir: (h: HoraLibre) => void;
}) {
  if (!horas.length) return null;
  return (
    <div role="group" aria-label={nombre}>
      <h3 className="m-0 mb-2.5 text-xs font-bold tracking-[2px] text-dorado-texto">
        {nombre.toUpperCase()}
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {horas.map((h, i) => {
          const activa = h.inicio === elegida;
          return (
            <button
              key={h.inicio}
              type="button"
              aria-pressed={activa}
              onClick={() => onElegir(h)}
              className={`animar-in min-h-11 rounded-xl border-[1.5px] text-sm font-semibold transition-[transform,box-shadow,background-color] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-14px_rgba(14,47,56,.6)] ${
                activa
                  ? "animar-pop border-petroleo bg-petroleo text-white"
                  : "border-[#CFC3AE] bg-white text-tinta"
              }`}
              style={{ ["--retraso" as string]: `${i * 25}ms` }}
            >
              {hora(h.inicio)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HorasLibres({
  servicioId,
  dentista,
  fecha,
  elegida,
  onElegir,
}: {
  servicioId: number;
  dentista: DentistaElegido | null;
  fecha: string | null;
  elegida: string | null;
  onElegir: (h: HoraLibre) => void;
}) {
  const horas = useHorasLibres(servicioId, dentista, fecha);
  const titulo = fecha
    ? `Horas libres · ${fechaLarga(`${fecha}T18:00:00Z`).replace(/^./, (c) => c.toUpperCase())}`
    : "Horas libres";

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-borde bg-white p-[22px]">
      <h2 className="m-0 text-[17px] font-bold">{titulo}</h2>
      {!fecha ? (
        <p className="m-0 text-sm text-texto-2">
          Elige un día resaltado en el calendario para ver sus horas.
        </p>
      ) : horas.isPending ? (
        <div className="grid grid-cols-4 gap-2" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Esqueleto key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      ) : horas.isError ? (
        <EstadoError error={horas.error} onReintentar={() => horas.refetch()} />
      ) : horas.data.length === 0 ? (
        <EstadoVacio titulo="Día lleno" texto="No quedan horas este día. Prueba otro día." />
      ) : (
        <>
          <Grupo
            nombre="Mañana"
            horas={horas.data.filter((h) => partesCR(h.inicio).hora < 12)}
            elegida={elegida}
            onElegir={onElegir}
          />
          <Grupo
            nombre="Tarde"
            horas={horas.data.filter((h) => partesCR(h.inicio).hora >= 12)}
            elegida={elegida}
            onElegir={onElegir}
          />
        </>
      )}
    </div>
  );
}
