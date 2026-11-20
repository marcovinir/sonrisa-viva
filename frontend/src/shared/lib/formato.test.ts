import { describe, expect, it } from "vitest";
import { colones, fechaLarga, hora, isoDia } from "./formato";

describe("formato", () => {
  it("colones formatea con espacio fino", () => {
    expect(colones(25000)).toBe("₡25 000");
    expect(colones(150000)).toBe("₡150 000");
    expect(colones(900)).toBe("₡900");
  });

  it("fechaLarga y hora en hora de Costa Rica", () => {
    expect(fechaLarga("2026-03-02T15:15:00Z")).toBe("lunes 2 de marzo");
    expect(hora("2026-03-02T15:15:00Z")).toBe("9:15 a. m.");
    expect(hora("2026-03-02T19:30:00Z")).toBe("1:30 p. m.");
  });

  it("isoDia usa la fecha de Costa Rica", () => {
    // 2026-03-03 04:00 UTC todavía es lunes 2 en Costa Rica (UTC-6)
    expect(isoDia(new Date("2026-03-03T04:00:00Z"))).toBe("2026-03-02");
  });
});
