import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/cliente";
import { Boton } from "./Boton";
import { Campo } from "./Campo";
import { Chip } from "./Chip";
import { EstadoError, EstadoVacio } from "./Estado";
import { IlustracionServicio } from "./IlustracionServicio";

describe("Boton", () => {
  it("cargando queda deshabilitado con aria-busy y no dispara onClick", async () => {
    const onClick = vi.fn();
    render(
      <Boton cargando textoCargando="Confirmando…" onClick={onClick}>
        Confirmar
      </Boton>,
    );
    const boton = screen.getByRole("button", { name: /confirmando/i });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");
    await userEvent.click(boton);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Campo", () => {
  it("con error enlaza aria-describedby al mensaje", () => {
    render(<Campo id="email" etiqueta="Correo" error="Escribe un correo válido." />);
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const id = input.getAttribute("aria-describedby")!;
    expect(document.getElementById(id)).toHaveTextContent("Escribe un correo válido.");
  });

  it("con ayuda la enlaza sin marcar error", () => {
    render(<Campo id="tel" etiqueta="Teléfono" ayuda="Solo si hay cambios." />);
    const input = screen.getByLabelText("Teléfono");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)).toHaveTextContent(
      "Solo si hay cambios.",
    );
  });
});

describe("Chip", () => {
  it("refleja aria-pressed", () => {
    render(<Chip activo>Todos</Chip>);
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("IlustracionServicio", () => {
  it("elige el acento por slug y tiene aria-label", () => {
    render(<IlustracionServicio slug="control-brackets" categoria="Ortodoncia" />);
    const img = screen.getByRole("img", { name: "Ilustración: diente con brackets" });
    expect(img).toHaveAttribute("data-acento", "brackets");
  });

  it("con slug desconocido usa brillo", () => {
    render(<IlustracionServicio slug="nuevo-servicio" categoria="Otra" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-acento", "brillo");
  });
});

describe("Estados", () => {
  it("EstadoError muestra detalle y llama onReintentar", async () => {
    const onReintentar = vi.fn();
    render(<EstadoError error={new ApiError(0, "Sin conexión.")} onReintentar={onReintentar} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión.");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledOnce();
  });

  it("EstadoVacio muestra título y texto", () => {
    render(<EstadoVacio titulo="Sin horas" texto="Prueba otro día." />);
    expect(screen.getByText("Sin horas")).toBeInTheDocument();
    expect(screen.getByText("Prueba otro día.")).toBeInTheDocument();
  });
});
