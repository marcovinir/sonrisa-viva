import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { servidor } from "../../test/servidor";
import { renderEn } from "../../test/render";

describe("Landing (parte 1)", () => {
  it("el header lleva a /reservar", async () => {
    renderEn("/");
    const header = await screen.findByRole("banner");
    expect(within(header).getByRole("link", { name: "Agenda tu cita" })).toHaveAttribute(
      "href",
      "/reservar",
    );
  });

  it("el menú móvil abre, cierra con Esc y devuelve el foco", async () => {
    renderEn("/");
    const boton = await screen.findByRole("button", { name: "Abrir menú" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(boton).toHaveAccessibleName("Cerrar menú");
    const menu = document.getElementById(boton.getAttribute("aria-controls")!)!;
    expect(within(menu).getByRole("link", { name: "Servicios" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(boton).toHaveFocus();
  });

  it("el hero muestra el precio mínimo real", async () => {
    renderEn("/");
    expect(await screen.findByText("Valoración desde ₡15 000")).toBeInTheDocument();
  });

  it("el hero sin API muestra el texto de respaldo", async () => {
    servidor.use(http.get("/api/v1/servicios/", () => HttpResponse.error()));
    renderEn("/");
    await waitFor(() =>
      expect(screen.getByText("Valoración con precio claro")).toBeInTheDocument(),
    );
  });

  it("el pie tiene Acceso personal a /panel/login", async () => {
    renderEn("/");
    const pie = await screen.findByRole("contentinfo");
    expect(within(pie).getByRole("link", { name: "Acceso personal" })).toHaveAttribute(
      "href",
      "/panel/login",
    );
  });

  it("hay un solo h1 y las secciones clave", async () => {
    renderEn("/");
    expect(await screen.findAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Tu sonrisa en tres pasos" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Una clínica pequeña a propósito." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Especialidades" })).toBeInTheDocument();
  });
});
