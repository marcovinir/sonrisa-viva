import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("muestra 404 en ruta desconocida", async () => {
    window.history.pushState({}, "", "/no-existe");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: /no encontramos esta página/i }),
    ).toBeInTheDocument();
  });

  it("el panel sin sesión pide iniciar sesión", async () => {
    window.history.pushState({}, "", "/panel");
    render(<App />);
    expect(await screen.findByRole("heading", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});
