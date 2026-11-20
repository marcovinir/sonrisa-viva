import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderEn } from "../../test/render";
import { horaLibre, servidor } from "../../test/servidor";

const INICIO = horaLibre(9, 15).inicio;
const RUTA = `/reservar?servicio=12&dentista=cualquiera&fecha=2026-03-02&inicio=${encodeURIComponent(INICIO)}`;

const RESUMEN = {
  id: 77,
  servicio: { id: 12, nombre: "Limpieza dental" },
  dentista: { id: 5, nombre: "Laura", apellidos: "Vargas Rojas" },
  inicio: INICIO,
  fin: horaLibre(10).inicio,
  precio_colones: 25000,
  estado: "confirmada",
  paciente: { nombre: "Carlos", email: "carlos@correo.test" },
};

async function llenar() {
  await userEvent.type(await screen.findByLabelText("Nombre"), "Carlos");
  await userEvent.type(screen.getByLabelText("Apellidos"), "Solís Mora");
  await userEvent.type(screen.getByLabelText("Correo electrónico"), "carlos@correo.test");
  await userEvent.type(screen.getByLabelText("Teléfono"), "8888-8888");
}

describe("Paso de datos y envío", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-01T13:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("valida correo y teléfono con mensajes en español", async () => {
    renderEn(RUTA);
    await userEvent.type(await screen.findByLabelText("Correo electrónico"), "carlos@");
    await userEvent.type(screen.getByLabelText("Teléfono"), "abc");
    await userEvent.tab();
    expect(
      await screen.findByText("Escribe un correo válido (por ejemplo, nombre@gmail.com)."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Escribe un teléfono válido (solo números, + o -)."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("aria-invalid", "true");
  });

  it("confirmar envía un solo POST aunque se haga doble clic y navega a confirmada", async () => {
    let posts = 0;
    let cuerpo: unknown = null;
    servidor.use(
      http.post("/api/v1/citas/", async ({ request }) => {
        posts += 1;
        cuerpo = await request.json();
        await delay(80);
        return HttpResponse.json(RESUMEN, { status: 201 });
      }),
    );
    renderEn(RUTA);
    await llenar();
    const boton = screen.getByRole("button", { name: "Confirmar la cita" });
    await userEvent.dblClick(boton);
    expect(await screen.findByRole("button", { name: /confirmando/i })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: /listo, carlos/i }),
    ).toBeInTheDocument();
    expect(posts).toBe(1);
    expect(cuerpo).toEqual({
      servicio: 12,
      inicio: INICIO,
      dentista: null,
      paciente: {
        nombre: "Carlos",
        apellidos: "Solís Mora",
        email: "carlos@correo.test",
        telefono: "8888-8888",
      },
    });
  });

  it("409 vuelve a hora, avisa, refresca horas y conserva los datos", async () => {
    let consultasHoras = 0;
    servidor.use(
      http.post("/api/v1/citas/", () =>
        HttpResponse.json(
          { detalle: "Esa hora acaba de ocuparse, elige otra.", campos: {} },
          { status: 409 },
        ),
      ),
      http.get("/api/v1/disponibilidad/", ({ request }) => {
        consultasHoras += 1;
        const fecha = new URL(request.url).searchParams.get("fecha");
        return HttpResponse.json({ fecha, horas: [horaLibre(13, 30)] });
      }),
    );
    renderEn(RUTA);
    await llenar();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar la cita" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Esa hora acaba de ocuparse, elige otra.",
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: /elige el día y la hora/i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(consultasHoras).toBeGreaterThan(0));
    await userEvent.click(await screen.findByRole("button", { name: "1:30 p. m." }));
    expect(await screen.findByLabelText("Nombre")).toHaveValue("Carlos");
    expect(screen.getByLabelText("Teléfono")).toHaveValue("8888-8888");
  });

  it("los errores de campo del backend se muestran en su campo", async () => {
    servidor.use(
      http.post("/api/v1/citas/", () =>
        HttpResponse.json(
          {
            detalle: "Revisa los datos marcados.",
            campos: { email: ["Ese correo no se puede usar."] },
          },
          { status: 400 },
        ),
      ),
    );
    renderEn(RUTA);
    await llenar();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar la cita" }));
    expect(await screen.findByText("Ese correo no se puede usar.")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("aria-invalid", "true");
  });
});
