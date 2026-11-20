import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conSesion, pagina, YO_ADMIN } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";
import type { Bloqueo, DentistaPanel } from "../agenda/api";

const AVISO_OCULTO =
  "Completa el perfil y el horario, y marca Visible en la web para que aparezca en el sitio.";

let dentistas: DentistaPanel[];
let bloqueos: Bloqueo[];
let envios: { metodo: string; url: string; cuerpo: unknown }[];

const laura = (): DentistaPanel => ({
  id: 3,
  usuario: {
    id: 13,
    email: "laura@x.test",
    nombre: "Laura",
    apellidos: "Vargas Rojas",
    is_active: true,
  },
  especialidad: "Odontología general",
  biografia: "Diez años de experiencia.",
  foto_url: "",
  visible_en_web: true,
  servicios: [1],
  horarios: [
    { dia_semana: 0, hora_inicio: "08:00:00", hora_fin: "12:00:00" },
    { dia_semana: 0, hora_inicio: "13:00:00", hora_fin: "17:00:00" },
  ],
});
const diego = (): DentistaPanel => ({
  id: 4,
  usuario: {
    id: 14,
    email: "diego@x.test",
    nombre: "Diego",
    apellidos: "Quesada Araya",
    is_active: false,
  },
  especialidad: "",
  biografia: "",
  foto_url: "",
  visible_en_web: false,
  servicios: [],
  horarios: [],
});

function backend() {
  servidor.use(
    http.get("/api/v1/panel/dentistas/", () => HttpResponse.json(pagina(dentistas))),
    http.patch("/api/v1/panel/dentistas/:id/", async ({ request, params }) => {
      const cuerpo = (await request.json()) as Partial<DentistaPanel>;
      envios.push({ metodo: "PATCH", url: request.url, cuerpo });
      dentistas = dentistas.map((d) => (d.id === Number(params.id) ? { ...d, ...cuerpo } : d));
      return HttpResponse.json(dentistas.find((d) => d.id === Number(params.id)));
    }),
    http.put("/api/v1/panel/dentistas/:id/horarios/", async ({ request }) => {
      const cuerpo = await request.json();
      envios.push({ metodo: "PUT", url: request.url, cuerpo });
      return HttpResponse.json(cuerpo);
    }),
    http.get("/api/v1/panel/servicios/", () =>
      HttpResponse.json(
        pagina([
          {
            id: 1,
            categoria: 1,
            nombre: "Limpieza dental",
            slug: "limpieza",
            descripcion: "",
            duracion_min: 45,
            precio_colones: 25000,
            activo: true,
          },
          {
            id: 2,
            categoria: 2,
            nombre: "Blanqueamiento",
            slug: "blanqueamiento",
            descripcion: "",
            duracion_min: 60,
            precio_colones: 90000,
            activo: true,
          },
        ]),
      ),
    ),
    http.get("/api/v1/panel/bloqueos/", () => HttpResponse.json(pagina(bloqueos))),
    http.delete("/api/v1/panel/bloqueos/:id/", ({ request, params }) => {
      envios.push({ metodo: "DELETE", url: request.url, cuerpo: null });
      bloqueos = bloqueos.filter((b) => b.id !== Number(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-03-02T11:30:00-06:00"));
  dentistas = [laura(), diego()];
  bloqueos = [
    {
      id: 7,
      dentista: 3,
      inicio: "2026-03-04T08:00:00-06:00",
      fin: "2026-03-04T12:00:00-06:00",
      motivo: "Congreso de odontología",
    },
  ];
  envios = [];
  conSesion(YO_ADMIN);
  backend();
});
afterEach(() => vi.useRealTimers());

const detalle = () =>
  screen.getByRole("region", { name: /Laura Vargas Rojas|Diego Quesada Araya/ });

describe("Dentistas", () => {
  it("lista dentistas y abre el primero", async () => {
    renderEn("/panel/dentistas");
    const lista = await screen.findByRole("list", { name: "Dentistas" });
    const items = within(lista).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Visible")).toBeInTheDocument();
    expect(within(items[1]).getByText("Oculto en la web")).toBeInTheDocument();
    expect(within(items[1]).getByText("Cuenta inactiva")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Laura Vargas Rojas", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Perfil" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Especialidad")).toHaveValue("Odontología general");
  });

  it("guardar perfil con servicios envía PATCH con ids", async () => {
    renderEn("/panel/dentistas");
    await screen.findByRole("heading", { name: "Laura Vargas Rojas", level: 2 });
    const blanqueamiento = await screen.findByRole("button", { name: "Blanqueamiento" });
    expect(blanqueamiento).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(blanqueamiento);
    expect(blanqueamiento).toHaveAttribute("aria-pressed", "true");
    await userEvent.clear(screen.getByLabelText("Especialidad"));
    await userEvent.type(screen.getByLabelText("Especialidad"), "Estética dental");
    await userEvent.click(screen.getByRole("button", { name: "Guardar perfil" }));
    expect(await screen.findByText("Perfil guardado")).toBeInTheDocument();
    expect(envios).toEqual([
      expect.objectContaining({
        metodo: "PATCH",
        cuerpo: {
          especialidad: "Estética dental",
          biografia: "Diez años de experiencia.",
          foto_url: "",
          visible_en_web: true,
          servicios: [1, 2],
        },
      }),
    ]);
  });

  it("editor de horario agrega y quita bloques y envía PUT", async () => {
    renderEn("/panel/dentistas?id=3");
    await userEvent.click(await screen.findByRole("tab", { name: "Horario" }));
    const lunes = screen.getByRole("group", { name: "Lunes" });
    expect(within(lunes).getByLabelText("Lunes, inicio del bloque 1")).toHaveValue("08:00");
    await userEvent.click(within(lunes).getByRole("button", { name: "Quitar bloque 2 del lunes" }));
    const sabado = screen.getByRole("group", { name: "Sábado" });
    expect(within(sabado).getByText("Sin atención")).toBeInTheDocument();
    await userEvent.click(within(sabado).getByRole("button", { name: "Agregar bloque el sábado" }));
    fireEvent.change(within(sabado).getByLabelText("Sábado, fin del bloque 1"), {
      target: { value: "11:00" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Guardar horario" }));
    expect(await screen.findByText("Horario guardado")).toBeInTheDocument();
    expect(envios).toEqual([
      expect.objectContaining({
        metodo: "PUT",
        cuerpo: [
          { dia_semana: 0, hora_inicio: "08:00", hora_fin: "12:00" },
          { dia_semana: 5, hora_inicio: "08:00", hora_fin: "11:00" },
        ],
      }),
    ]);
  });

  it("traslape se avisa sin enviar", async () => {
    renderEn("/panel/dentistas?id=3");
    await userEvent.click(await screen.findByRole("tab", { name: "Horario" }));
    fireEvent.change(screen.getByLabelText("Lunes, inicio del bloque 2"), {
      target: { value: "11:00" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Guardar horario" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Los bloques del lunes se traslapan.",
    );
    expect(envios).toHaveLength(0);
  });

  it("error del backend en horarios se muestra", async () => {
    servidor.use(
      http.put("/api/v1/panel/dentistas/:id/horarios/", () =>
        HttpResponse.json(
          {
            detalle: "Revisa los datos marcados.",
            campos: { horarios: ["Los bloques del martes se traslapan."] },
          },
          { status: 400 },
        ),
      ),
    );
    renderEn("/panel/dentistas?id=3");
    await userEvent.click(await screen.findByRole("tab", { name: "Horario" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar horario" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Los bloques del martes se traslapan.",
    );
  });

  it("las pestañas se recorren con flechas", async () => {
    renderEn("/panel/dentistas?id=3");
    const perfil = await screen.findByRole("tab", { name: "Perfil" });
    perfil.focus();
    await userEvent.keyboard("{ArrowRight}");
    const horario = screen.getByRole("tab", { name: "Horario" });
    expect(horario).toHaveFocus();
    expect(horario).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Horario" })).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(perfil).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Bloqueos" })).toHaveFocus();
    expect(perfil).toHaveAttribute("tabindex", "-1");
  });

  it("bloqueos lista los próximos y quita con confirmación", async () => {
    renderEn("/panel/dentistas?id=3");
    await userEvent.click(await screen.findByRole("tab", { name: "Bloqueos" }));
    expect(await screen.findByText("Congreso de odontología")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Quitar bloqueo Congreso de odontología" }),
    );
    const dialogo = await screen.findByRole("dialog", { name: "¿Quitar este bloqueo?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, quitar" }));
    await waitFor(() =>
      expect(screen.queryByText("Congreso de odontología")).not.toBeInTheDocument(),
    );
    expect(envios[0]).toMatchObject({ metodo: "DELETE" });
    expect(await screen.findByText("No tiene bloqueos próximos.")).toBeInTheDocument();
  });

  it("dentista oculto muestra el aviso de completar perfil", async () => {
    const { router } = renderEn("/panel/dentistas");
    await userEvent.click(await screen.findByRole("button", { name: /Diego Quesada Araya/ }));
    await waitFor(() => expect(router.state.location.search).toBe("?id=4"));
    expect(await screen.findByText(AVISO_OCULTO)).toBeInTheDocument();
    expect(detalle()).toBeInTheDocument();
  });
});
