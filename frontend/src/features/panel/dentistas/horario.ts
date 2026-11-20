/** Horario semanal del dentista: agrupar por día y validar como el backend. */
import type { BloqueHorario } from "../agenda/semana";

export type Bloque = { inicio: string; fin: string };
export type HorarioPorDia = Partial<Record<number, Bloque[]>>;

/** 0 = lunes … 6 = domingo (igual que dia_semana del backend). */
export const NOMBRES_DIAS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

const hhmm = (t: string) => t.slice(0, 5);
const minutos = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function agruparPorDia(horarios: BloqueHorario[]): Record<number, Bloque[]> {
  const dias: Record<number, Bloque[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const h of horarios)
    dias[h.dia_semana].push({ inicio: hhmm(h.hora_inicio), fin: hhmm(h.hora_fin) });
  for (const d of Object.values(dias)) d.sort((a, b) => a.inicio.localeCompare(b.inicio));
  return dias;
}

export function aHorarios(dias: HorarioPorDia): BloqueHorario[] {
  return Object.entries(dias).flatMap(([dia, bloques]) =>
    (bloques ?? []).map((b) => ({
      dia_semana: Number(dia),
      hora_inicio: b.inicio,
      hora_fin: b.fin,
    })),
  );
}

/** Las mismas reglas y mensajes que `reemplazar_horario` del backend. */
export function validarBloques(dias: HorarioPorDia): string[] {
  const errores: string[] = [];
  for (const [dia, bloques] of Object.entries(dias)) {
    const completos: Bloque[] = [];
    for (const b of bloques ?? []) {
      if (!b.inicio || !b.fin) {
        errores.push("Completa la hora de inicio y de fin de cada bloque.");
        continue;
      }
      if (minutos(b.inicio) % 15 || minutos(b.fin) % 15)
        errores.push("Las horas deben ir en múltiplos de 15 minutos.");
      if (minutos(b.inicio) >= minutos(b.fin))
        errores.push("La hora de inicio debe ser anterior a la de fin.");
      completos.push(b);
    }
    completos.sort((a, b) => minutos(a.inicio) - minutos(b.inicio));
    if (completos.some((b, i) => i > 0 && minutos(completos[i - 1].fin) > minutos(b.inicio)))
      errores.push(`Los bloques del ${NOMBRES_DIAS[Number(dia)]} se traslapan.`);
  }
  return [...new Set(errores)];
}
