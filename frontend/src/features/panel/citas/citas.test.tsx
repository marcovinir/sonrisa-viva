import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conSesion, pagina, YO_ADMIN, YO_DENTISTA } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";
import type { CitaPanel } from "../agenda/api";

const cita = (id: number, estado: CitaPanel["estado"] = "confirmada"): CitaPanel => ({
  id,
  inicio: "2026-03-05T09:00:00-06:00",
  fin: "2026-03-05T09:45:00-06:00",
  estado,
  precio_colones: 25000,
  notas_internas: "",
  paciente: {
    id,
    nombre: `Paciente${id}`,
    apellidos: "Prueba",
    email: `p${id}@correo.test`,
    telefono: "8888-8888",
  },
  dentista: { id: 3, nombre: "Laura", apellidos: "Vargas Rojas" },
  servicio: { id: 1, nombre: "Limpieza dental", duracion_min: 45 },
  creado_en: "2026-02-20T10:00:00-06:00",
});

let todas: CitaPanel[];
let pedidos: URL[];

function backend() {
  servidor.use(
    http.get("/api/v1/panel/citas/", ({ request }) => {
      const url = new URL(request.url);
      pedidos.push(url);
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const estado = url.searchParams.get("estado");
      const filtradas = todas.filter(
        (c) =>
          (!q || c.paciente.nombre.toLowerCase().includes(q)) && (!estado || c.estado === estado),
      );
      const page = Number(url.searchParams.get("page") ?? 1);
      return HttpResponse.json(
        pagina(filtradas.slice((page - 1) * 20, page * 20), filtradas.length),
      );
    }),
    http.get("/api/v1/panel/dentistas/", () =>
      HttpResponse.json(
        pagina([
          {
            id: 3,
            usuario: {
              id: 13,
              email: "l@x.test",
              nombre: "Laura",
              apellidos: "Vargas Rojas",
              is_active: true,
            },
            especialidad: "",
            biografia: "",
            foto_url: "",
            visible_en_web: true,
            servicios: [],
            horarios: [],
          },
        ]),
      ),
    ),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-03-02T11:30:00-06:00"));
  todas = Array.from({ length: 45 }, (_, i) => cita(i + 1));
  pedidos = [];
});
afterEach(() => vi.useRealTimers());

const ultimo = () => pedidos[pedidos.length - 1].searchParams;

describe("Lista de citas", () => {
  it("lista citas paginadas y muestra el rango", async () => {
    conSesion(YO_ADMIN);
    backend();
    renderEn("/panel/citas");
    expect(await screen.findByRole("heading", { name: "Citas" })).toBeInTheDocument();
    expect(await screen.findByText("Mostrando 1–20 de 45")).toBeInTheDocument();
    expect(screen.getByText("45 citas")).toBeInTheDocument();
    const tabla = screen.getByRole("table");
    expect(within(tabla).getAllByRole("row")).toHaveLength(21);
    expect(within(tabla).getByRole("columnheader", { name: "DENTISTA" })).toBeInTheDocument();
    expect(ultimo().get("orden")).toBe("-inicio");
    await userEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByText("Mostrando 21–40 de 45")).toBeInTheDocument();
    expect(ultimo().get("page")).toBe("2");
  });

  it("escribir en paciente filtra tras la pausa y vuelve a la página 1", async () => {
    conSesion(YO_ADMIN);
    backend();
    const { router } = renderEn("/panel/citas?page=2");
    expect(await screen.findByText("Mostrando 21–40 de 45")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Paciente"), "paciente4");
    await waitFor(() => expect(router.state.location.search).toBe("?q=paciente4"));
    expect(await screen.findByText("Mostrando 1–7 de 7")).toBeInTheDocument();
    // La búsqueda esperó a que se dejara de escribir: un solo pedido con q.
    expect(pedidos.filter((u) => u.searchParams.has("q"))).toHaveLength(1);
  });

  it("chip activo se quita con su ×", async () => {
    conSesion(YO_ADMIN);
    backend();
    const { router } = renderEn("/panel/citas?estado=confirmada&desde=2026-03-02&hasta=2026-03-07");
    const chips = await screen.findByRole("list", { name: "Filtros activos" });
    expect(within(chips).getByText("2–7 mar")).toBeInTheDocument();
    expect(within(chips).getByText("Confirmada")).toBeInTheDocument();
    await userEvent.click(within(chips).getByRole("button", { name: "Quitar filtro de estado" }));
    await waitFor(() =>
      expect(router.state.location.search).toBe("?desde=2026-03-02&hasta=2026-03-07"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Limpiar todo" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.queryByRole("list", { name: "Filtros activos" })).not.toBeInTheDocument();
  });

  it("dentista no ve la columna ni el filtro de dentista", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/citas");
    expect(await screen.findByRole("heading", { name: "Mis citas" })).toBeInTheDocument();
    const tabla = await screen.findByRole("table");
    expect(within(tabla).queryByRole("columnheader", { name: "DENTISTA" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Dentista")).not.toBeInTheDocument();
    expect(within(tabla).queryByRole("button", { name: /^Cancelar/ })).not.toBeInTheDocument();
  });

  it("cancelar pide confirmación y actualiza la fila", async () => {
    conSesion(YO_ADMIN);
    backend();
    const cuerpos: unknown[] = [];
    servidor.use(
      http.post("/api/v1/panel/citas/1/estado/", async ({ request }) => {
        cuerpos.push(await request.json());
        todas = todas.map((c) => (c.id === 1 ? { ...c, estado: "cancelada" } : c));
        return HttpResponse.json(todas[0]);
      }),
    );
    renderEn("/panel/citas");
    const boton = await screen.findByRole("button", { name: "Cancelar cita de Paciente1 Prueba" });
    await userEvent.click(boton);
    const dialogo = await screen.findByRole("dialog", { name: "¿Cancelar esta cita?" });
    expect(dialogo).toHaveTextContent("Se avisará al paciente por correo.");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, cancelar" }));
    const fila = (await screen.findByText("p1@correo.test")).closest("tr")!;
    await waitFor(() => expect(within(fila).getByText("Cancelada")).toBeInTheDocument());
    expect(
      screen.queryByRole("button", { name: "Cancelar cita de Paciente1 Prueba" }),
    ).not.toBeInTheDocument();
    expect(cuerpos).toEqual([{ estado: "cancelada" }]);
  });

  it("ver abre el detalle de la cita", async () => {
    conSesion(YO_ADMIN);
    backend();
    renderEn("/panel/citas");
    await userEvent.click(
      await screen.findByRole("button", { name: "Ver cita de Paciente2 Prueba" }),
    );
    const dialogo = await screen.findByRole("dialog", { name: "Detalle de la cita" });
    expect(within(dialogo).getByRole("heading", { name: "Paciente2 Prueba" })).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("Notas internas")).toBeInTheDocument();
  });

  it("sin resultados ofrece limpiar filtros", async () => {
    conSesion(YO_ADMIN);
    backend();
    const { router } = renderEn("/panel/citas?q=nadie");
    expect(await screen.findByText("No hay citas con estos filtros")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(await screen.findByText("Mostrando 1–20 de 45")).toBeInTheDocument();
  });

  it("los filtros sobreviven a recargar la URL", async () => {
    conSesion(YO_ADMIN);
    backend();
    renderEn("/panel/citas?q=paciente1&estado=confirmada&dentista=3&page=1");
    expect(await screen.findByLabelText("Paciente")).toHaveValue("paciente1");
    expect(screen.getByLabelText("Estado")).toHaveValue("confirmada");
    await waitFor(() => expect(screen.getByLabelText("Dentista")).toHaveValue("3"));
    await waitFor(() => expect(ultimo().get("q")).toBe("paciente1"));
    expect(ultimo().get("estado")).toBe("confirmada");
    expect(ultimo().get("dentista")).toBe("3");
  });
});
