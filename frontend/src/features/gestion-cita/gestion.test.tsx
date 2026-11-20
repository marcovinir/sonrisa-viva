import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderEn } from "../../test/render";
import { horaLibre, servidor } from "../../test/servidor";

const URL_API = "/api/v1/citas/gestion/:token/";

const cita = (extra: Record<string, unknown> = {}) => ({
  id: 77,
  servicio: { id: 12, nombre: "Limpieza dental" },
  dentista: { id: 5, nombre: "Laura", apellidos: "Vargas Rojas" },
  inicio: horaLibre(9, 15).inicio,
  fin: horaLibre(10).inicio,
  precio_colones: 25000,
  estado: "confirmada",
  paciente: { nombre: "Carlos", email: "carlos@correo.test" },
  puede_cambiar: true,
  ...extra,
});

describe("Gestión de la cita por enlace", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-01T13:00:00Z"));
    servidor.use(http.get(URL_API, () => HttpResponse.json(cita())));
  });
  afterEach(() => vi.useRealTimers());

  it("un token desconocido muestra No encontramos esa cita", async () => {
    servidor.use(
      http.get(URL_API, () =>
        HttpResponse.json({ detalle: "No encontrado.", campos: {} }, { status: 404 }),
      ),
    );
    renderEn("/cita/no-existe");
    expect(
      await screen.findByRole("heading", { level: 1, name: "No encontramos esa cita" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agendar una cita/i })).toHaveAttribute(
      "href",
      "/reservar",
    );
  });

  it("muestra la cita y su estado", async () => {
    renderEn("/cita/abc");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Hola, Carlos" }),
    ).toBeInTheDocument();
    const tarjeta = screen.getByRole("region", { name: "Tu cita" });
    expect(tarjeta).toHaveTextContent("Limpieza dental");
    expect(tarjeta).toHaveTextContent("9:15 a. m. – 10:00 a. m.");
    expect(tarjeta).toHaveTextContent("Laura Vargas Rojas");
    expect(tarjeta).toHaveTextContent("Confirmada");
  });

  it("sin puede_cambiar oculta las acciones y explica por qué", async () => {
    servidor.use(http.get(URL_API, () => HttpResponse.json(cita({ puede_cambiar: false }))));
    renderEn("/cita/abc");
    expect(await screen.findByText(/faltan menos de 24 horas/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar la cita/i })).not.toBeInTheDocument();
  });

  it("una cita cancelada dice que ya no se puede modificar", async () => {
    servidor.use(
      http.get(URL_API, () =>
        HttpResponse.json(cita({ estado: "cancelada", puede_cambiar: false })),
      ),
    );
    renderEn("/cita/abc");
    expect(await screen.findByText("Esta cita ya no se puede modificar.")).toBeInTheDocument();
  });

  it("reprogramar a otra hora actualiza la tarjeta", async () => {
    let cuerpo: unknown = null;
    servidor.use(
      http.patch(URL_API, async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json(
          cita({ inicio: horaLibre(13, 30).inicio, fin: horaLibre(14, 15).inicio }),
        );
      }),
    );
    renderEn("/cita/abc");
    await userEvent.click(await screen.findByRole("button", { name: /^lunes 2 de marzo/i }));
    await userEvent.click(await screen.findByRole("button", { name: "1:30 p. m." }));
    await userEvent.click(screen.getByRole("button", { name: "Mover a las 1:30 p. m." }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Listo: tu cita quedó para el lunes 2 de marzo, 1:30 p. m.",
    );
    expect(screen.getByRole("status").textContent).not.toMatch(/\.\.$/);
    expect(cuerpo).toEqual({ inicio: horaLibre(13, 30).inicio });
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Tu cita" })).toHaveTextContent(
        "1:30 p. m. – 2:15 p. m.",
      ),
    );
  });

  it("reprogramar con 400 muestra el mensaje", async () => {
    servidor.use(
      http.patch(URL_API, () =>
        HttpResponse.json(
          { detalle: "Esa hora ya no está disponible.", campos: {} },
          { status: 400 },
        ),
      ),
    );
    renderEn("/cita/abc");
    await userEvent.click(await screen.findByRole("button", { name: /^lunes 2 de marzo/i }));
    await userEvent.click(await screen.findByRole("button", { name: "9:00 a. m." }));
    await userEvent.click(screen.getByRole("button", { name: "Mover a las 9:00 a. m." }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Esa hora ya no está disponible.");
  });

  it("cancelar pide confirmación con el foco en mantenerla", async () => {
    renderEn("/cita/abc");
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar la cita" }));
    const dialogo = await screen.findByRole("alertdialog");
    expect(dialogo).toHaveTextContent("¿Seguro que quieres cancelar la cita");
    expect(screen.getByRole("button", { name: "No, mantenerla" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "No, mantenerla" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("cancelar confirmado cambia a Cancelada", async () => {
    let borrada = false;
    servidor.use(
      http.delete(URL_API, () => {
        borrada = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderEn("/cita/abc");
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar la cita" }));
    await userEvent.click(await screen.findByRole("button", { name: "Sí, cancelar" }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Tu cita" })).toHaveTextContent("Cancelada"),
    );
    expect(borrada).toBe(true);
    expect(screen.getByRole("link", { name: "Agendar otra cita" })).toHaveAttribute(
      "href",
      "/reservar",
    );
  });
});
