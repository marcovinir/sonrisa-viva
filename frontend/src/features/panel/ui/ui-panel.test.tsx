import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialogo } from "./Dialogo";
import { Paginacion } from "./Paginacion";

describe("UI del panel", () => {
  it("Dialogo abre con showModal y cierra con Esc", async () => {
    const onCerrar = vi.fn();
    const { rerender } = render(
      <Dialogo abierto titulo="Borrar servicio" onCerrar={onCerrar}>
        ¿Seguro?
      </Dialogo>,
    );
    const dialogo = screen.getByRole("dialog", { name: "Borrar servicio" });
    expect(dialogo).toHaveAttribute("open");
    await userEvent.keyboard("{Escape}");
    expect(onCerrar).toHaveBeenCalled();
    rerender(
      <Dialogo abierto={false} titulo="Borrar servicio" onCerrar={onCerrar}>
        ¿Seguro?
      </Dialogo>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Paginacion muestra el rango y cambia de página", async () => {
    const onCambiar = vi.fn();
    render(<Paginacion pagina={2} total={45} onCambiar={onCambiar} />);
    expect(screen.getByText("Mostrando 21–40 de 45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onCambiar).toHaveBeenCalledWith(3);
  });

  it("Paginacion se oculta con una sola página", () => {
    const { container } = render(<Paginacion pagina={1} total={8} onCambiar={() => {}} />);
    expect(container).toHaveTextContent("Mostrando 1–8 de 8");
    expect(screen.queryByRole("button", { name: "Página siguiente" })).not.toBeInTheDocument();
  });
});
