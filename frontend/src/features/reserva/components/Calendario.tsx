import { useRef, useState, type KeyboardEvent } from "react";
import { isoDia, NOMBRES_DIA, NOMBRES_MES } from "../../../shared/lib/formato";
import type { DentistaElegido } from "../estado";
import { useDiasDisponibles } from "../api";

const MAX_DIAS = 60;
const SEMANA = ["L", "K", "M", "J", "V", "S", "D"];
const dos = (n: number) => String(n).padStart(2, "0");

type Mes = { anio: number; mes: number };
const mesDe = (iso: string): Mes => ({
  anio: Number(iso.slice(0, 4)),
  mes: Number(iso.slice(5, 7)),
});
const valor = (m: Mes) => m.anio * 12 + m.mes;
const sumarMes = (m: Mes, n: number): Mes => {
  const total = m.anio * 12 + (m.mes - 1) + n;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
};

export function Calendario({
  servicioId,
  dentista,
  fecha,
  onElegir,
}: {
  servicioId: number;
  dentista: DentistaElegido | null;
  fecha: string | null;
  onElegir: (iso: string) => void;
}) {
  const [{ hoy, limite }] = useState(() => ({
    hoy: isoDia(new Date()),
    limite: isoDia(new Date(Date.now() + MAX_DIAS * 86_400_000)),
  }));
  const [mes, setMes] = useState<Mes>(() => mesDe(fecha ?? hoy));
  const dias = useDiasDisponibles(servicioId, dentista, mes.anio, mes.mes);
  const grilla = useRef<HTMLDivElement>(null);

  const total = new Date(Date.UTC(mes.anio, mes.mes, 0)).getUTCDate();
  const desfase = (new Date(Date.UTC(mes.anio, mes.mes - 1, 1)).getUTCDay() + 6) % 7;
  const puedeAtras = valor(mes) > valor(mesDe(hoy));
  const puedeAdelante = valor(sumarMes(mes, 1)) <= valor(mesDe(limite));
  const titulo = `${NOMBRES_MES[mes.mes - 1].replace(/^./, (c) => c.toUpperCase())} ${mes.anio}`;

  const moverFoco = (e: KeyboardEvent<HTMLDivElement>) => {
    const pasos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const paso = pasos[e.key];
    const actual = Number((e.target as HTMLElement).dataset.dia);
    if (!paso || !actual) return;
    const destino = actual + paso;
    if (destino < 1 || destino > total) return;
    e.preventDefault();
    grilla.current?.querySelector<HTMLButtonElement>(`[data-dia="${destino}"]`)?.focus();
  };

  return (
    <div className="rounded-[20px] border border-borde bg-white p-[22px]">
      <div className="mb-3.5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={!puedeAtras}
          onClick={() => setMes(sumarMes(mes, -1))}
          className="size-11 rounded-xl border border-[#CFC3AE] bg-white disabled:border-borde disabled:bg-marfil disabled:text-[#9AA4A8]"
        >
          ‹
        </button>
        <h2 aria-live="polite" className="m-0 text-[17px] font-bold">
          {titulo}
        </h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={!puedeAdelante}
          onClick={() => setMes(sumarMes(mes, 1))}
          className="size-11 rounded-xl border border-[#CFC3AE] bg-white disabled:border-borde disabled:bg-marfil disabled:text-[#9AA4A8]"
        >
          ›
        </button>
      </div>
      <div
        aria-hidden="true"
        className="mb-1.5 grid grid-cols-7 gap-1 text-center text-xs font-bold text-texto-3"
      >
        {SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div
        ref={grilla}
        role="group"
        aria-label={`Días de ${titulo}`}
        aria-busy={dias.isPending}
        onKeyDown={moverFoco}
        className="grid grid-cols-7 gap-1"
      >
        {Array.from({ length: desfase }, (_, i) => (
          <span key={`v${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const iso = `${mes.anio}-${dos(mes.mes)}-${dos(n)}`;
          const libre = iso >= hoy && iso <= limite && Boolean(dias.data?.has(iso));
          const elegido = iso === fecha;
          const nombreDia = NOMBRES_DIA[new Date(Date.UTC(mes.anio, mes.mes - 1, n)).getUTCDay()];
          const etiqueta = `${nombreDia} ${n} de ${NOMBRES_MES[mes.mes - 1]}${libre ? ", con horas libres" : ", sin horas"}`;
          return (
            <button
              key={iso}
              type="button"
              data-dia={n}
              aria-label={etiqueta}
              aria-pressed={elegido}
              aria-disabled={libre ? undefined : true}
              onClick={() => libre && onElegir(iso)}
              className={`animar-in h-11 rounded-[10px] border text-sm font-semibold transition-[transform,background-color] duration-200 ${
                elegido
                  ? "animar-pop border-petroleo bg-petroleo text-white"
                  : libre
                    ? "border-[#BFD6DA] bg-[#E3EEF0] text-tinta motion-safe:hover:-translate-y-0.5"
                    : "cursor-not-allowed border-transparent bg-[#F1EEE8] text-[#9AA4A8]"
              }`}
              style={{ ["--retraso" as string]: `${((desfase + i) % 7) * 20}ms` }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3.5 flex flex-wrap gap-4 text-xs text-texto-2">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[3px] border border-petroleo bg-[#E3EEF0]"
          />
          Con horas libres
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[#F1EEE8]" />
          Sin horas
        </span>
      </div>
    </div>
  );
}
