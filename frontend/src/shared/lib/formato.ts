/** Formatos en español de Costa Rica (iguales a los del backend). */

const ZONA = "America/Costa_Rica";
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

type Partes = {
  anio: number;
  mes: number;
  dia: number;
  diaSemana: number;
  hora: number;
  minuto: number;
};

const formateador = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});
const SEMANA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Las partes de una fecha en hora de Costa Rica. */
export function partesCR(fecha: Date | string): Partes {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const p = Object.fromEntries(formateador.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    anio: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    diaSemana: SEMANA.indexOf(p.weekday),
    hora: Number(p.hour),
    minuto: Number(p.minute),
  };
}

export function colones(monto: number): string {
  return (
    "₡" +
    Math.round(monto)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  );
}

/** «lunes 2 de marzo» */
export function fechaLarga(iso: string | Date): string {
  const p = partesCR(iso);
  return `${DIAS[p.diaSemana]} ${p.dia} de ${MESES[p.mes - 1]}`;
}

/** «9:15 a. m.» */
export function hora(iso: string | Date): string {
  const p = partesCR(iso);
  const h12 = p.hora % 12 || 12;
  return `${h12}:${String(p.minuto).padStart(2, "0")} ${p.hora < 12 ? "a. m." : "p. m."}`;
}

/** «YYYY-MM-DD» en hora de Costa Rica. */
export function isoDia(d: Date): string {
  const p = partesCR(d);
  return `${p.anio}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`;
}

export const NOMBRES_MES = MESES;
export const NOMBRES_DIA = DIAS;
