import { describe, expect, it } from "vitest";
import {
  diasSemana,
  fechaCorta,
  estadoVisual,
  franjasDelDia,
  isoCR,
  lunesDe,
  posicion,
  sumarDias,
  textoFaltan,
  textoSemana,
} from "./semana";

const cita = (inicio: string, fin: string, estado = "confirmada") =>
  ({ inicio, fin, estado }) as const;

describe("semana", () => {
  it("lunesDe del domingo 1 de marzo es 2026-02-23", () => {
    expect(lunesDe("2026-03-01")).toBe("2026-02-23");
    expect(lunesDe("2026-03-02")).toBe("2026-03-02");
    expect(lunesDe("2026-03-07")).toBe("2026-03-02");
  });

  it("sumarDias cruza meses", () => {
    expect(sumarDias("2026-03-30", 7)).toBe("2026-04-06");
    expect(sumarDias("2026-03-02", -7)).toBe("2026-02-23");
  });

  it("diasSemana devuelve 6 días", () => {
    expect(diasSemana("2026-03-02")).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
    ]);
  });

  it("posicion de 9:15–10:00 es top 120 alto 72", () => {
    expect(posicion("2026-03-02T09:15:00-06:00", "2026-03-02T10:00:00-06:00")).toEqual({
      top: 120,
      alto: 72,
    });
    // En UTC también se interpreta en hora de Costa Rica.
    expect(posicion("2026-03-02T15:15:00Z", "2026-03-02T16:00:00Z")).toEqual({
      top: 120,
      alto: 72,
    });
  });

  it("estadoVisual por_marcar cuando ya terminó", () => {
    const ahora = new Date("2026-03-02T11:30:00-06:00");
    expect(
      estadoVisual(cita("2026-03-02T09:15:00-06:00", "2026-03-02T10:00:00-06:00"), ahora),
    ).toBe("por_marcar");
    expect(
      estadoVisual(cita("2026-03-02T13:00:00-06:00", "2026-03-02T14:00:00-06:00"), ahora),
    ).toBe("confirmada");
    expect(
      estadoVisual(
        cita("2026-03-02T08:00:00-06:00", "2026-03-02T08:45:00-06:00", "completada"),
        ahora,
      ),
    ).toBe("completada");
  });

  it("franjasDelDia marca el almuerzo y lo que queda fuera del horario", () => {
    const horario = [
      { dia_semana: 0, hora_inicio: "08:00:00", hora_fin: "12:00:00" },
      { dia_semana: 0, hora_inicio: "13:00:00", hora_fin: "16:00:00" },
    ];
    expect(franjasDelDia(horario)).toEqual([
      { desde: 720, hasta: 780, texto: "Almuerzo" },
      { desde: 960, hasta: 1020, texto: "Fuera de horario" },
    ]);
    expect(franjasDelDia([])).toEqual([{ desde: 480, hasta: 1020, texto: "Sin atención" }]);
  });

  it("isoCR arma la fecha con la zona de Costa Rica", () => {
    expect(isoCR("2026-03-04", "08:15")).toBe("2026-03-04T08:15:00-06:00");
  });

  it("textoSemana y textoFaltan", () => {
    expect(textoSemana("2026-03-02")).toBe("Semana del lunes 2 al sábado 7 de marzo");
    expect(textoSemana("2026-03-30")).toBe("Semana del lunes 30 de marzo al sábado 4 de abril");
    expect(textoFaltan(25)).toBe("en 25 min");
    expect(textoFaltan(90)).toBe("en 1 h 30 min");
    expect(textoFaltan(120)).toBe("en 2 h");
    expect(textoFaltan(60 * 24 * 2 + 5)).toBe("en 2 días");
  });

  it("fechaCorta lleva el día de la semana y el mes", () => {
    expect(fechaCorta("2026-05-25T15:30:00-06:00")).toBe("Lun 25 may");
    expect(fechaCorta("2026-12-02T23:30:00-06:00")).toBe("Mié 2 dic");
  });
});
