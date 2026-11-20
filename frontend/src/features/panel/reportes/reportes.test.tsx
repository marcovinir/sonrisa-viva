import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { conSesion, YO_ADMIN, YO_DENTISTA } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";

let pedidos: URL[];
let tasa: { completadas: number; no_asistio: number; tasa: number | null };

const MESES = [
  { mes: "2026-01", total: 30, completadas: 26, canceladas: 3, no_asistio: 4 },
  { mes: "2026-02", total: 34, completadas: 31, canceladas: 2, no_asistio: 3 },
  { mes: "2026-03", total: 12, completadas: 5, canceladas: 1, no_asistio: 0 },
];
const SERVICIOS = [
  { id: 1, nombre: "Limpieza dental", total: 40, completadas: 36, ingresos_colones: 900000 },
  { id: 2, nombre: "Blanqueamiento", total: 20, completadas: 18, ingresos_colones: 1620000 },
  { id: 3, nombre: "Resina", total: 16, completadas: 8, ingresos_colones: 3580000 },
];
const DENTISTAS = [
  {
    id: 4,
    nombre: "Andrés",
    apellidos: "Mora",
    total: 18,
    completadas: 15,
    no_asistio: 3,
    ingresos_colones: 2100000,
  },
  {
    id: 3,
    nombre: "Laura",
    apellidos: "Vargas",
    total: 41,
    completadas: 37,
    no_asistio: 2,
    ingresos_colones: 3000000,
  },
  {
    id: 5,
    nombre: "Diego",
    apellidos: "Quesada",
    total: 17,
    completadas: 10,
    no_asistio: 2,
    ingresos_colones: 1000000,
  },
];

function backend() {
  const responder =
    (datos: () => JsonBodyType) =>
    ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      pedidos.push(url);
      if ((url.searchParams.get("desde") ?? "") > (url.searchParams.get("hasta") ?? "9999"))
        return HttpResponse.json(
          {
            detalle: "Revisa los datos marcados.",
            campos: { desde: ["Debe ser anterior a «hasta»."] },
          },
          { status: 400 },
        );
      return HttpResponse.json(datos());
    };
  servidor.use(
    http.get(
      "/api/v1/panel/reportes/tasa-asistencia/",
      responder(() => tasa),
    ),
    http.get(
      "/api/v1/panel/reportes/citas-por-mes/",
      responder(() => MESES),
    ),
    http.get(
      "/api/v1/panel/reportes/citas-por-servicio/",
      responder(() => SERVICIOS),
    ),
    http.get(
      "/api/v1/panel/reportes/citas-por-dentista/",
      responder(() => DENTISTAS),
    ),
  );
}

// La página se carga perezosa (con Recharts); se precarga para que la primera prueba no espere.
beforeAll(async () => {
  await import("./pages/ReportesPage");
}, 20_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-03-02T11:30:00-06:00"));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  pedidos = [];
  tasa = { completadas: 62, no_asistio: 7, tasa: 0.892 };
  conSesion(YO_ADMIN);
  backend();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const indicador = (titulo: string) => screen.findByRole("region", { name: titulo });

describe("Reportes", () => {
  it("muestra los cuatro indicadores con formato", async () => {
    renderEn("/panel/reportes");
    expect(await screen.findByRole("heading", { name: "Reportes", level: 1 })).toBeInTheDocument();
    expect(await within(await indicador("Citas atendidas")).findByText("62")).toBeInTheDocument();
    expect(within(await indicador("Tasa de asistencia")).getByText("89,2 %")).toBeInTheDocument();
    expect(within(await indicador("No asistieron")).getByText("7")).toBeInTheDocument();
    expect(await within(await indicador("Ingresos")).findByText("₡6,1 M")).toBeInTheDocument();
  });

  it("por defecto pide los últimos 6 meses", async () => {
    renderEn("/panel/reportes");
    await indicador("Citas atendidas");
    await waitFor(() => expect(pedidos.length).toBeGreaterThanOrEqual(4));
    expect(pedidos.every((u) => u.searchParams.get("desde") === "2025-10-01")).toBe(true);
    expect(pedidos.every((u) => u.searchParams.get("hasta") === "2026-03-02")).toBe(true);
    expect(screen.getByLabelText("Desde")).toHaveValue("2025-10-01");
  });

  it("tasa null muestra guion", async () => {
    tasa = { completadas: 0, no_asistio: 0, tasa: null };
    renderEn("/panel/reportes");
    expect(await within(await indicador("Tasa de asistencia")).findByText("—")).toBeInTheDocument();
  });

  it("cambiar el rango pide los reportes con desde/hasta", async () => {
    const { router } = renderEn("/panel/reportes");
    await indicador("Citas atendidas");
    const desde = screen.getByLabelText("Desde");
    await userEvent.clear(desde);
    await userEvent.type(desde, "2026-01-01");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() =>
      expect(router.state.location.search).toBe("?desde=2026-01-01&hasta=2026-03-02"),
    );
    await waitFor(() => {
      const nombres = pedidos
        .filter((u) => u.searchParams.get("desde") === "2026-01-01")
        .map((u) => u.pathname.split("/").at(-2));
      expect(new Set(nombres)).toEqual(
        new Set(["tasa-asistencia", "citas-por-mes", "citas-por-servicio", "citas-por-dentista"]),
      );
    });
  });

  it("rango invertido muestra el error", async () => {
    renderEn("/panel/reportes?desde=2026-03-01&hasta=2026-01-01");
    const error = await screen.findByText("Debe ser anterior a «hasta».");
    expect(screen.getByLabelText("Desde")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(error.id),
    );
  });

  it("tabla accesible de meses tiene una fila por mes", async () => {
    renderEn("/panel/reportes");
    const tabla = await screen.findByRole("table", { name: "Citas por mes" });
    const filas = within(tabla).getAllByRole("row");
    expect(filas).toHaveLength(1 + MESES.length);
    expect(within(filas[1]).getByRole("rowheader")).toHaveTextContent("enero 2026");
    expect(
      within(filas[1])
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["26", "4", "3"]);
    expect(screen.getByRole("table", { name: "Citas por servicio" })).toBeInTheDocument();
  });

  it("tabla de dentistas ordenada por citas", async () => {
    renderEn("/panel/reportes");
    const tabla = await screen.findByRole("table", { name: "Por dentista" });
    const nombres = within(tabla)
      .getAllByRole("rowheader")
      .map((c) => c.textContent);
    expect(nombres).toEqual(["Laura Vargas", "Andrés Mora", "Diego Quesada"]);
    const laura = within(tabla).getAllByRole("row")[1];
    expect(within(laura).getByText("94,9 %")).toBeInTheDocument();
    expect(within(laura).getByText("₡3 000 000")).toBeInTheDocument();
  });

  it("sin datos muestra el estado vacío", async () => {
    tasa = { completadas: 0, no_asistio: 0, tasa: null };
    servidor.use(
      http.get("/api/v1/panel/reportes/citas-por-mes/", () =>
        HttpResponse.json([
          { mes: "2026-03", total: 0, completadas: 0, canceladas: 0, no_asistio: 0 },
        ]),
      ),
      http.get("/api/v1/panel/reportes/citas-por-servicio/", () => HttpResponse.json([])),
      http.get("/api/v1/panel/reportes/citas-por-dentista/", () => HttpResponse.json([])),
    );
    renderEn("/panel/reportes");
    expect(await screen.findAllByText("No hay citas en este rango.")).toHaveLength(3);
  });

  it("dentista sin permiso ve No tienes acceso", async () => {
    conSesion(YO_DENTISTA);
    renderEn("/panel/reportes");
    expect(
      await screen.findByRole("heading", { name: "No tienes acceso a esta sección" }),
    ).toBeInTheDocument();
  });
});
