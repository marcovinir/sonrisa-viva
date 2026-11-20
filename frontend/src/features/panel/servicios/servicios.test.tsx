import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { conSesion, pagina, YO_ADMIN } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";
import type { CategoriaPanel, ServicioPanel } from "./api";

const EN_USO = "No se puede borrar porque tiene citas asociadas; desactívalo en su lugar.";
const EN_USO_CAT =
  "No se puede borrar porque tiene servicios asociados; muévelos a otra categoría primero.";

let servicios: ServicioPanel[];
let categorias: CategoriaPanel[];
let pedidos: URL[];
let cuerpos: { metodo: string; url: string; cuerpo: unknown }[];

const servicio = (
  id: number,
  nombre: string,
  categoria: number,
  duracion_min: number,
  precio_colones: number,
  activo = true,
): ServicioPanel => ({
  id,
  categoria,
  nombre,
  slug: nombre.toLowerCase().replace(/ /g, "-"),
  descripcion: "",
  duracion_min,
  precio_colones,
  activo,
});

function backend() {
  servidor.use(
    http.get("/api/v1/panel/servicios/", ({ request }) => {
      const url = new URL(request.url);
      pedidos.push(url);
      const activo = url.searchParams.get("activo");
      const lista = servicios.filter((s) => activo === null || String(s.activo) === activo);
      return HttpResponse.json(pagina(lista));
    }),
    http.post("/api/v1/panel/servicios/", async ({ request }) => {
      const cuerpo = (await request.json()) as Omit<ServicioPanel, "id" | "slug">;
      cuerpos.push({ metodo: "POST", url: request.url, cuerpo });
      const nuevo = { ...cuerpo, id: 99, slug: "nuevo" } as ServicioPanel;
      servicios = [...servicios, nuevo];
      return HttpResponse.json(nuevo, { status: 201 });
    }),
    http.patch("/api/v1/panel/servicios/:id/", async ({ request, params }) => {
      const cuerpo = (await request.json()) as Partial<ServicioPanel>;
      cuerpos.push({ metodo: "PATCH", url: request.url, cuerpo });
      servicios = servicios.map((s) => (s.id === Number(params.id) ? { ...s, ...cuerpo } : s));
      return HttpResponse.json(servicios.find((s) => s.id === Number(params.id)));
    }),
    http.delete("/api/v1/panel/servicios/:id/", () =>
      HttpResponse.json({ detalle: EN_USO, campos: {} }, { status: 409 }),
    ),
    http.get("/api/v1/panel/categorias/", () => HttpResponse.json(pagina(categorias))),
    http.post("/api/v1/panel/categorias/", async ({ request }) => {
      const cuerpo = (await request.json()) as Omit<CategoriaPanel, "id">;
      cuerpos.push({ metodo: "POST", url: request.url, cuerpo });
      const nueva = { ...cuerpo, id: 50 };
      categorias = [...categorias, nueva];
      return HttpResponse.json(nueva, { status: 201 });
    }),
    http.delete("/api/v1/panel/categorias/:id/", () =>
      HttpResponse.json({ detalle: EN_USO_CAT, campos: {} }, { status: 409 }),
    ),
  );
}

beforeEach(() => {
  categorias = [
    { id: 1, nombre: "Preventiva", orden: 1 },
    { id: 2, nombre: "Estética", orden: 2 },
  ];
  servicios = [
    servicio(1, "Limpieza dental", 1, 45, 25000),
    servicio(2, "Blanqueamiento", 2, 60, 90000),
    servicio(3, "Sellantes", 1, 30, 15000, false),
  ];
  pedidos = [];
  cuerpos = [];
  conSesion(YO_ADMIN);
  backend();
});

const fila = async (nombre: string) =>
  (await screen.findByRole("cell", { name: new RegExp(nombre) })).closest("tr")!;

describe("Servicios", () => {
  it("lista servicios activos con su ilustración", async () => {
    renderEn("/panel/servicios");
    expect(await screen.findByRole("heading", { name: "Servicios" })).toBeInTheDocument();
    const limpieza = await fila("Limpieza dental");
    expect(within(limpieza).getByText("Preventiva")).toBeInTheDocument();
    expect(within(limpieza).getByText("45 min")).toBeInTheDocument();
    expect(within(limpieza).getByText("₡25 000")).toBeInTheDocument();
    expect(limpieza.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("Sellantes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activos (2)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await screen.findByRole("button", { name: "Inactivos (1)" })).toBeInTheDocument();
    expect(screen.getByText("3 servicios en 2 categorías")).toBeInTheDocument();
  });

  it("filtrar inactivos pide ?activo=false", async () => {
    renderEn("/panel/servicios");
    await userEvent.click(await screen.findByRole("button", { name: "Inactivos (1)" }));
    expect(await fila("Sellantes")).toBeInTheDocument();
    expect(pedidos.some((u) => u.searchParams.get("activo") === "false")).toBe(true);
    expect(screen.queryByText("Limpieza dental")).not.toBeInTheDocument();
  });

  it("crear servicio válido lo agrega y avisa", async () => {
    renderEn("/panel/servicios");
    await fila("Limpieza dental");
    await userEvent.click(screen.getByRole("button", { name: "+ Nuevo servicio" }));
    const panel = screen.getByRole("complementary", { name: "Nuevo servicio" });
    await userEvent.type(within(panel).getByLabelText("Nombre"), "Ortodoncia invisible");
    await userEvent.selectOptions(within(panel).getByLabelText("Categoría"), "2");
    await userEvent.clear(within(panel).getByLabelText("Duración (min)"));
    await userEvent.type(within(panel).getByLabelText("Duración (min)"), "60");
    await userEvent.type(within(panel).getByLabelText("Precio (₡)"), "120000");
    await userEvent.click(within(panel).getByRole("button", { name: "Crear servicio" }));
    expect(await screen.findByText("Servicio creado")).toBeInTheDocument();
    expect(await fila("Ortodoncia invisible")).toBeInTheDocument();
    expect(cuerpos[0]).toMatchObject({
      metodo: "POST",
      cuerpo: {
        nombre: "Ortodoncia invisible",
        categoria: 2,
        duracion_min: 60,
        precio_colones: 120000,
        descripcion: "",
        activo: true,
      },
    });
  });

  it("duración 50 muestra el error y no envía", async () => {
    renderEn("/panel/servicios");
    await userEvent.click(await fila("Limpieza dental"));
    const panel = screen.getByRole("complementary", { name: "Editar servicio" });
    const duracion = within(panel).getByLabelText("Duración (min)");
    await userEvent.clear(duracion);
    await userEvent.type(duracion, "50");
    await userEvent.click(within(panel).getByRole("button", { name: "Guardar cambios" }));
    expect(
      await within(panel).findByText(
        "La duración debe ser un múltiplo de 15 minutos (por ejemplo 45 o 60).",
      ),
    ).toBeInTheDocument();
    expect(duracion).toHaveAttribute("aria-invalid", "true");
    expect(cuerpos).toHaveLength(0);
  });

  it("editar precio actualiza la fila", async () => {
    renderEn("/panel/servicios");
    await userEvent.click(await fila("Limpieza dental"));
    const panel = screen.getByRole("complementary", { name: "Editar servicio" });
    expect(within(panel).getByLabelText("Nombre")).toHaveValue("Limpieza dental");
    const precio = within(panel).getByLabelText("Precio (₡)");
    await userEvent.clear(precio);
    await userEvent.type(precio, "27500");
    await userEvent.click(within(panel).getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();
    await waitFor(async () =>
      expect(within(await fila("Limpieza dental")).getByText("₡27 500")).toBeInTheDocument(),
    );
    expect(cuerpos[0]).toMatchObject({ metodo: "PATCH", cuerpo: { precio_colones: 27500 } });
  });

  it("borrar con 409 muestra el detalle y conserva la fila", async () => {
    renderEn("/panel/servicios");
    await userEvent.click(await fila("Limpieza dental"));
    const panel = screen.getByRole("complementary", { name: "Editar servicio" });
    await userEvent.click(within(panel).getByRole("button", { name: "Borrar" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Borrar «Limpieza dental»?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, borrar" }));
    expect(await screen.findByText(EN_USO)).toBeInTheDocument();
    expect(await fila("Limpieza dental")).toBeInTheDocument();
  });

  it("desmarcar Visible en la web lo pasa a inactivos", async () => {
    renderEn("/panel/servicios");
    await userEvent.click(await fila("Blanqueamiento"));
    const panel = screen.getByRole("complementary", { name: "Editar servicio" });
    await userEvent.click(within(panel).getByLabelText("Visible en la web"));
    await userEvent.click(within(panel).getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("button", { name: "Inactivos (2)" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Blanqueamiento")).not.toBeInTheDocument());
    expect(cuerpos[0]).toMatchObject({ metodo: "PATCH", cuerpo: { activo: false } });
  });

  it("categorías: crear y borrar con 409", async () => {
    renderEn("/panel/servicios");
    await fila("Limpieza dental");
    await userEvent.click(screen.getByRole("button", { name: "Categorías" }));
    const dialogo = await screen.findByRole("dialog", { name: "Categorías" });
    await userEvent.type(within(dialogo).getByLabelText("Nueva categoría"), "Periodoncia");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Agregar" }));
    expect(await within(dialogo).findByDisplayValue("Periodoncia")).toBeInTheDocument();
    expect(cuerpos[0]).toMatchObject({
      metodo: "POST",
      cuerpo: { nombre: "Periodoncia", orden: 3 },
    });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Borrar Preventiva" }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, borrar Preventiva" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent(EN_USO_CAT);
    expect(within(dialogo).getByDisplayValue("Preventiva")).toBeInTheDocument();
  });
});
