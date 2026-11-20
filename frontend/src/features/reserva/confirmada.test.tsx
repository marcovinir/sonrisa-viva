import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { Providers } from "../../app/providers";
import { rutas } from "../../app/router";
import { clientePrueba } from "../../test/render";
import { generarIcs } from "../../shared/lib/calendario";
import type { CitaResumen } from "./api";

const CITA: CitaResumen = {
  id: 77,
  servicio: { id: 12, nombre: "Limpieza dental" },
  dentista: { id: 5, nombre: "Laura", apellidos: "Vargas Rojas" },
  inicio: "2026-03-02T15:15:00Z",
  fin: "2026-03-02T16:00:00Z",
  precio_colones: 25000,
  estado: "confirmada",
  paciente: { nombre: "Carlos", email: "carlos@correo.test" },
};

function renderConfirmada(cita?: CitaResumen) {
  const router = createMemoryRouter(rutas, {
    initialEntries: [{ pathname: "/reservar/confirmada", state: cita ? { cita } : null }],
  });
  return render(
    <Providers client={clientePrueba()}>
      <RouterProvider router={router} />
    </Providers>,
  );
}

describe("Página de confirmación", () => {
  it("muestra nombre, servicio, fecha, dentista, precio y correo", async () => {
    renderConfirmada(CITA);
    expect(
      await screen.findByRole("heading", { level: 1, name: "¡Listo, Carlos! Te esperamos." }),
    ).toBeInTheDocument();
    const detalle = screen.getByRole("region", { name: "Detalle de la cita" });
    expect(detalle).toHaveTextContent("Limpieza dental");
    expect(detalle).toHaveTextContent("Lunes 2 de marzo");
    expect(detalle).toHaveTextContent("9:15 a. m. – 10:00 a. m.");
    expect(detalle).toHaveTextContent("Laura Vargas Rojas");
    expect(detalle).toHaveTextContent("₡25 000");
    expect(screen.getByText("carlos@correo.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar al calendario" })).toBeInTheDocument();
  });

  it("sin estado muestra el mensaje de respaldo", async () => {
    renderConfirmada();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Tu reserva ya fue registrada." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  it("generarIcs crea un VEVENT con fechas UTC", () => {
    const ics = generarIcs(CITA);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20260302T151500Z");
    expect(ics).toContain("DTEND:20260302T160000Z");
    expect(ics).toContain("SUMMARY:Cita: Limpieza dental · Sonrisa Viva");
    expect(ics).toContain("LOCATION:Clínica Dental Sonrisa Viva");
    expect(ics).toContain("UID:cita-77@sonrisaviva");
    expect(ics.split("\r\n").at(-2)).toBe("END:VCALENDAR");
  });
});
