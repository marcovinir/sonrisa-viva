import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderEn } from "../../test/render";

const BASE = "/reservar?servicio=12&dentista=cualquiera";
const dia = (nombre: string) =>
  screen.findByRole("button", { name: new RegExp(`^${nombre}`, "i") });

describe("Paso de día y hora", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-01T13:00:00Z")); // domingo 1 de marzo, 7:00 en Costa Rica
  });
  afterEach(() => vi.useRealTimers());

  it("el calendario resalta solo días con horas", async () => {
    renderEn(BASE);
    expect(await screen.findByRole("heading", { name: "Marzo 2026" })).toBeInTheDocument();
    await waitFor(async () =>
      expect(await dia("lunes 2 de marzo")).not.toHaveAttribute("aria-disabled"),
    );
    expect(await dia("martes 3 de marzo")).toHaveAttribute("aria-disabled", "true");
  });

  it("no permite ir a meses anteriores", async () => {
    renderEn(BASE);
    expect(await screen.findByRole("button", { name: "Mes anterior" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(await screen.findByRole("heading", { name: "Abril 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mes anterior" })).toBeEnabled();
  });

  it("las flechas mueven el foco entre días", async () => {
    renderEn(BASE);
    const lunes = await dia("lunes 2 de marzo");
    lunes.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(await dia("martes 3 de marzo")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(await dia("martes 10 de marzo")).toHaveFocus();
  });

  it("elegir día pide horas y agrupa mañana y tarde", async () => {
    renderEn(BASE);
    await waitFor(async () =>
      expect(await dia("lunes 2 de marzo")).not.toHaveAttribute("aria-disabled"),
    );
    await userEvent.click(await dia("lunes 2 de marzo"));
    const manana = await screen.findByRole("group", { name: "Mañana" });
    expect(
      within(manana)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["9:00 a. m.", "9:15 a. m."]);
    expect(
      within(screen.getByRole("group", { name: "Tarde" })).getByRole("button"),
    ).toHaveTextContent("1:30 p. m.");
  });

  it("un día sin horas muestra el estado vacío", async () => {
    renderEn(BASE);
    await waitFor(async () =>
      expect(await dia("miércoles 4 de marzo")).not.toHaveAttribute("aria-disabled"),
    );
    await userEvent.click(await dia("miércoles 4 de marzo"));
    expect(
      await screen.findByText("No quedan horas este día. Prueba otro día."),
    ).toBeInTheDocument();
  });

  it("elegir hora la muestra en el resumen y avanza a datos", async () => {
    renderEn(`${BASE}&fecha=2026-03-02`);
    await userEvent.click(await screen.findByRole("button", { name: "9:15 a. m." }));
    expect(
      await screen.findByRole("heading", { level: 1, name: /a nombre de quién/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Resumen de tu cita" })).toHaveTextContent(
      "Lunes 2 de marzo, 9:15 a. m.",
    );
  });
});
