import { describe, expect, it } from "vitest";
import { aHorarios, agruparPorDia, validarBloques } from "./horario";

describe("horario", () => {
  it("agruparPorDia ordena los bloques y recorta los segundos", () => {
    const dias = agruparPorDia([
      { dia_semana: 0, hora_inicio: "13:00:00", hora_fin: "17:00:00" },
      { dia_semana: 0, hora_inicio: "08:00:00", hora_fin: "12:00:00" },
      { dia_semana: 5, hora_inicio: "08:00:00", hora_fin: "12:00:00" },
    ]);
    expect(dias[0]).toEqual([
      { inicio: "08:00", fin: "12:00" },
      { inicio: "13:00", fin: "17:00" },
    ]);
    expect(dias[1]).toEqual([]);
    expect(dias[5]).toEqual([{ inicio: "08:00", fin: "12:00" }]);
  });

  it("aHorarios vuelve al formato del backend", () => {
    expect(aHorarios({ 0: [{ inicio: "08:00", fin: "12:00" }], 2: [] })).toEqual([
      { dia_semana: 0, hora_inicio: "08:00", hora_fin: "12:00" },
    ]);
  });

  it("detecta traslape el lunes", () => {
    expect(
      validarBloques({
        0: [
          { inicio: "08:00", fin: "12:00" },
          { inicio: "11:00", fin: "14:00" },
        ],
      }),
    ).toEqual(["Los bloques del lunes se traslapan."]);
  });

  it("rechaza 8:10", () => {
    expect(validarBloques({ 1: [{ inicio: "08:10", fin: "12:00" }] })).toEqual([
      "Las horas deben ir en múltiplos de 15 minutos.",
    ]);
  });

  it("rechaza inicio después del fin y bloques vacíos", () => {
    expect(validarBloques({ 2: [{ inicio: "12:00", fin: "08:00" }] })).toEqual([
      "La hora de inicio debe ser anterior a la de fin.",
    ]);
    expect(validarBloques({ 3: [{ inicio: "", fin: "12:00" }] })).toEqual([
      "Completa la hora de inicio y de fin de cada bloque.",
    ]);
  });

  it("bloques válidos no dan errores", () => {
    expect(
      validarBloques({
        0: [
          { inicio: "08:00", fin: "12:00" },
          { inicio: "12:00", fin: "17:00" },
        ],
        5: [{ inicio: "08:00", fin: "12:00" }],
      }),
    ).toEqual([]);
  });
});
