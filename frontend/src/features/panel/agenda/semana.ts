/** Cálculos puros de la agenda semanal (fechas "YYYY-MM-DD" y horas en Costa Rica). */
import { NOMBRES_DIA, NOMBRES_MES, partesCR } from "../../../shared/lib/formato";

export const HORA_INICIO = 8;
export const HORA_FIN = 17;
export const PX_POR_HORA = 96;
/** Costa Rica no tiene horario de verano: siempre UTC−6. */
const ZONA_CR = "-06:00";

const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const aIso = (d: Date) => d.toISOString().slice(0, 10);

export function sumarDias(iso: string, n: number): string {
  const d = aFecha(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return aIso(d);
}

/** Lunes de la semana del día dado (el domingo cuenta en la semana que termina). */
export function lunesDe(iso: string): string {
  const desdeLunes = (aFecha(iso).getUTCDay() + 6) % 7;
  return sumarDias(iso, -desdeLunes);
}

/** De lunes a sábado. */
export function diasSemana(lunes: string): string[] {
  return Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i));
}

/** 0 = lunes … 6 = domingo (igual que dia_semana del backend). */
export const diaSemanaDe = (iso: string) => (aFecha(iso).getUTCDay() + 6) % 7;

export const minutosCR = (fecha: string | Date) => {
  const p = partesCR(fecha);
  return p.hora * 60 + p.minuto;
};

const minutosHora = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function posicion(
  inicioIso: string,
  finIso: string,
  horaInicio = HORA_INICIO,
  pxPorHora = PX_POR_HORA,
): { top: number; alto: number } {
  const ini = minutosCR(inicioIso);
  const fin = minutosCR(finIso);
  return {
    top: ((ini - horaInicio * 60) / 60) * pxPorHora,
    alto: ((fin - ini) / 60) * pxPorHora,
  };
}

export type EstadoCita = "confirmada" | "cancelada" | "completada" | "no_asistio";
export type EstadoVisual = EstadoCita | "por_marcar";

export function estadoVisual(cita: { estado: string; fin: string }, ahora: Date): EstadoVisual {
  if (cita.estado === "confirmada" && new Date(cita.fin) <= ahora) return "por_marcar";
  return cita.estado as EstadoCita;
}

export type BloqueHorario = { dia_semana: number; hora_inicio: string; hora_fin: string };
export type Franja = { desde: number; hasta: number; texto: string };

/** Lo que queda sin atención dentro de 8:00–17:00 según los bloques de ese día. */
export function franjasDelDia(
  bloques: BloqueHorario[],
  horaInicio = HORA_INICIO,
  horaFin = HORA_FIN,
): Franja[] {
  const inicio = horaInicio * 60;
  const fin = horaFin * 60;
  if (bloques.length === 0) return [{ desde: inicio, hasta: fin, texto: "Sin atención" }];
  const orden = bloques
    .map((b) => ({ desde: minutosHora(b.hora_inicio), hasta: minutosHora(b.hora_fin) }))
    .sort((a, b) => a.desde - b.desde);
  const franjas: Franja[] = [];
  let cursor = inicio;
  orden.forEach((b, i) => {
    if (b.desde > cursor) {
      franjas.push({
        desde: cursor,
        hasta: Math.min(b.desde, fin),
        texto: i === 0 ? "Fuera de horario" : "Almuerzo",
      });
    }
    cursor = Math.max(cursor, b.hasta);
  });
  if (cursor < fin) franjas.push({ desde: cursor, hasta: fin, texto: "Fuera de horario" });
  return franjas.filter((f) => f.hasta > f.desde);
}

/** «2026-03-04» + «08:15» → ISO con la zona de Costa Rica. */
export const isoCR = (dia: string, hhmm: string) => `${dia}T${hhmm}:00${ZONA_CR}`;

/** «Semana del lunes 2 al sábado 7 de marzo». */
export function textoSemana(lunes: string): string {
  const [, m1, d1] = lunes.split("-").map(Number);
  const [, m2, d2] = sumarDias(lunes, 5).split("-").map(Number);
  const mes1 = NOMBRES_MES[m1 - 1];
  const mes2 = NOMBRES_MES[m2 - 1];
  return m1 === m2
    ? `Semana del lunes ${d1} al sábado ${d2} de ${mes2}`
    : `Semana del lunes ${d1} de ${mes1} al sábado ${d2} de ${mes2}`;
}

/** «en 25 min», «en 1 h 30 min», «en 2 días». */
export function textoFaltan(minutos: number): string {
  if (minutos < 60) return `en ${Math.max(minutos, 1)} min`;
  if (minutos >= 60 * 24) {
    const dias = Math.floor(minutos / (60 * 24));
    return dias === 1 ? "mañana" : `en ${dias} días`;
  }
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `en ${h} h ${m} min` : `en ${h} h`;
}

/** «9:15» (24 h, como en la grilla). */
export function horaCorta(fecha: string | Date): string {
  const p = partesCR(fecha);
  return `${p.hora}:${String(p.minuto).padStart(2, "0")}`;
}

/** «Lunes 2». */
export function diaCorto(fecha: string | Date): string {
  const p = partesCR(fecha);
  const nombre = NOMBRES_DIA[p.diaSemana];
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${p.dia}`;
}
