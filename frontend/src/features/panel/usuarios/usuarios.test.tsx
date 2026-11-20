import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conSesion, pagina, YO_ADMIN } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";
import type { DentistaPanel } from "../agenda/api";
import type { UsuarioPanel } from "./api";

const ULTIMO_ADMIN = "Debe quedar al menos un administrador activo.";

let usuarios: UsuarioPanel[];
let dentistas: DentistaPanel[];
let pedidos: URL[];
let envios: { url: string; cuerpo: unknown }[];
let citasConfirmadas: number;

const usuario = (
  id: number,
  nombre: string,
  apellidos: string,
  rol: "admin" | "dentista",
  extra: Partial<UsuarioPanel> = {},
): UsuarioPanel => ({
  id,
  email: `${nombre.toLowerCase()}@x.test`,
  nombre,
  apellidos,
  rol,
  is_active: true,
  activado: true,
  creado_en: "2026-01-10T10:00:00-06:00",
  ...extra,
});

const perfil = (id: number, usuarioId: number, nombre: string): DentistaPanel => ({
  id,
  usuario: { id: usuarioId, email: "", nombre, apellidos: "", is_active: true },
  especialidad: "",
  biografia: "",
  foto_url: "",
  visible_en_web: false,
  servicios: [],
  horarios: [],
});

function backend() {
  servidor.use(
    http.get("/api/v1/panel/usuarios/", ({ request }) => {
      const url = new URL(request.url);
      pedidos.push(url);
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      return HttpResponse.json(
        pagina(usuarios.filter((u) => !q || `${u.nombre} ${u.email}`.toLowerCase().includes(q))),
      );
    }),
    http.post("/api/v1/panel/usuarios/", async ({ request }) => {
      const cuerpo = (await request.json()) as Pick<
        UsuarioPanel,
        "email" | "nombre" | "apellidos" | "rol"
      >;
      envios.push({ url: request.url, cuerpo });
      const nuevo = usuario(20, cuerpo.nombre, cuerpo.apellidos, cuerpo.rol, {
        email: cuerpo.email,
        activado: false,
      });
      usuarios = [...usuarios, nuevo];
      if (cuerpo.rol === "dentista") dentistas = [...dentistas, perfil(9, 20, cuerpo.nombre)];
      return HttpResponse.json(nuevo, { status: 201 });
    }),
    http.post("/api/v1/panel/usuarios/:id/:accion/", ({ request, params }) => {
      envios.push({ url: request.url, cuerpo: null });
      const id = Number(params.id);
      if (params.accion === "desactivar")
        usuarios = usuarios.map((u) => (u.id === id ? { ...u, is_active: false } : u));
      if (params.accion === "reactivar")
        usuarios = usuarios.map((u) => (u.id === id ? { ...u, is_active: true } : u));
      return HttpResponse.json(usuarios.find((u) => u.id === id));
    }),
    http.get("/api/v1/panel/dentistas/", () => HttpResponse.json(pagina(dentistas))),
    http.get("/api/v1/panel/citas/", ({ request }) => {
      pedidos.push(new URL(request.url));
      return HttpResponse.json(pagina([], citasConfirmadas));
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-03-02T11:30:00-06:00"));
  usuarios = [
    usuario(1, "Admin", "Sonrisa Viva", "admin", { email: "admin@sonrisaviva.test" }),
    usuario(13, "Laura", "Vargas Rojas", "dentista"),
    usuario(14, "Diego", "Quesada Araya", "dentista", { activado: false }),
    usuario(15, "Ana", "Inactiva Mora", "admin", { is_active: false }),
    usuario(16, "Pablo", "Segundo Admin", "admin"),
  ];
  dentistas = [perfil(3, 13, "Laura"), perfil(4, 14, "Diego")];
  pedidos = [];
  envios = [];
  citasConfirmadas = 0;
  conSesion(YO_ADMIN);
  backend();
});
afterEach(() => vi.useRealTimers());

const fila = async (texto: string) => (await screen.findByText(texto)).closest("tr")!;

describe("Usuarios", () => {
  it("lista usuarios con estado pendiente", async () => {
    renderEn("/panel/usuarios");
    expect(await screen.findByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(
      within(await fila("diego@x.test")).getByText("Pendiente de activar"),
    ).toBeInTheDocument();
    expect(within(await fila("ana@x.test")).getByText("Inactivo")).toBeInTheDocument();
    expect(within(await fila("laura@x.test")).getByText("Activo")).toBeInTheDocument();
    expect(within(await fila("laura@x.test")).getByText("Dentista")).toBeInTheDocument();
  });

  it("buscar filtra por q", async () => {
    const { router } = renderEn("/panel/usuarios");
    await fila("laura@x.test");
    await userEvent.type(screen.getByLabelText("Buscar"), "laura");
    await waitFor(() => expect(router.state.location.search).toBe("?q=laura"));
    await waitFor(() => expect(screen.queryByText("diego@x.test")).not.toBeInTheDocument());
    expect(pedidos.some((u) => u.searchParams.get("q") === "laura")).toBe(true);
  });

  it("filtros de rol y estado van en la URL", async () => {
    const { router } = renderEn("/panel/usuarios");
    await fila("laura@x.test");
    await userEvent.selectOptions(screen.getByLabelText("Rol"), "dentista");
    await userEvent.selectOptions(screen.getByLabelText("Estado"), "false");
    await waitFor(() => expect(router.state.location.search).toBe("?rol=dentista&activo=false"));
    const ultimo = pedidos.filter((u) => u.pathname.includes("usuarios")).pop()!;
    expect(ultimo.searchParams.get("rol")).toBe("dentista");
    expect(ultimo.searchParams.get("activo")).toBe("false");
  });

  it("crear dentista avisa del correo y ofrece completar perfil", async () => {
    renderEn("/panel/usuarios");
    await fila("laura@x.test");
    await userEvent.click(screen.getByRole("button", { name: "+ Nuevo usuario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    await userEvent.type(within(dialogo).getByLabelText("Correo"), "sofia@x.test");
    await userEvent.type(within(dialogo).getByLabelText("Nombre"), "Sofía");
    await userEvent.type(within(dialogo).getByLabelText("Apellidos"), "López Mora");
    await userEvent.click(within(dialogo).getByRole("radio", { name: /Dentista/ }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));
    expect(
      await within(dialogo).findByText(
        "Le enviamos un correo a sofia@x.test para que active su cuenta.",
      ),
    ).toBeInTheDocument();
    expect(
      await within(dialogo).findByRole("link", { name: "Completar su perfil" }),
    ).toHaveAttribute("href", "/panel/dentistas?id=9");
    expect(envios[0].cuerpo).toEqual({
      email: "sofia@x.test",
      nombre: "Sofía",
      apellidos: "López Mora",
      rol: "dentista",
    });
  });

  it("correo duplicado se ve en el campo", async () => {
    servidor.use(
      http.post("/api/v1/panel/usuarios/", () =>
        HttpResponse.json(
          {
            detalle: "Revisa los datos marcados.",
            campos: { email: ["Ya existe un usuario con ese correo."] },
          },
          { status: 400 },
        ),
      ),
    );
    renderEn("/panel/usuarios");
    await fila("laura@x.test");
    await userEvent.click(screen.getByRole("button", { name: "+ Nuevo usuario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    await userEvent.type(within(dialogo).getByLabelText("Correo"), "laura@x.test");
    await userEvent.type(within(dialogo).getByLabelText("Nombre"), "Laura");
    await userEvent.type(within(dialogo).getByLabelText("Apellidos"), "Otra");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));
    const error = await within(dialogo).findByText("Ya existe un usuario con ese correo.");
    expect(within(dialogo).getByLabelText("Correo")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(error.id),
    );
  });

  it("desactivar dentista con citas futuras avisa y enlaza a esas citas", async () => {
    citasConfirmadas = 3;
    renderEn("/panel/usuarios");
    await userEvent.click(
      within(await fila("laura@x.test")).getByRole("button", {
        name: "Desactivar a Laura Vargas Rojas",
      }),
    );
    const dialogo = await screen.findByRole("dialog", {
      name: "¿Desactivar a Laura Vargas Rojas?",
    });
    expect(
      await within(dialogo).findByText(
        "Tiene 3 citas confirmadas desde hoy. Al desactivar su cuenta dejará de aparecer en el sitio, pero esas citas siguen en pie: cancélalas o reasígnalas.",
      ),
    ).toBeInTheDocument();
    expect(within(dialogo).getByRole("link", { name: "Ver esas citas" })).toHaveAttribute(
      "href",
      "/panel/citas?dentista=3&estado=confirmada&desde=2026-03-02",
    );
    const consulta = pedidos.find((u) => u.pathname.includes("citas"))!;
    expect(Object.fromEntries(consulta.searchParams)).toEqual({
      dentista: "3",
      estado: "confirmada",
      desde: "2026-03-02",
      tamano: "1",
    });
  });

  it("desactivar sin citas confirma y cambia el estado", async () => {
    renderEn("/panel/usuarios");
    await userEvent.click(
      within(await fila("pablo@x.test")).getByRole("button", {
        name: "Desactivar a Pablo Segundo Admin",
      }),
    );
    const dialogo = await screen.findByRole("dialog", {
      name: "¿Desactivar a Pablo Segundo Admin?",
    });
    expect(within(dialogo).getByText(/ya no podrá entrar al panel/)).toBeInTheDocument();
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, desactivar" }));
    await waitFor(async () =>
      expect(within(await fila("pablo@x.test")).getByText("Inactivo")).toBeInTheDocument(),
    );
    expect(
      within(await fila("pablo@x.test")).getByRole("button", {
        name: "Reactivar a Pablo Segundo Admin",
      }),
    ).toBeInTheDocument();
    expect(envios[0].url).toContain("/panel/usuarios/16/desactivar/");
    // Un admin no tiene citas: no se consultan.
    expect(pedidos.some((u) => u.pathname.includes("citas"))).toBe(false);
  });

  it("no hay Desactivar en la propia fila", async () => {
    renderEn("/panel/usuarios");
    const propia = await fila("admin@sonrisaviva.test");
    expect(within(propia).getByText("Es tu cuenta")).toBeInTheDocument();
    expect(within(propia).queryByRole("button", { name: /Desactivar/ })).not.toBeInTheDocument();
  });

  it("reenviar activación solo en pendientes", async () => {
    renderEn("/panel/usuarios");
    await fila("laura@x.test");
    const botones = screen.getAllByRole("button", { name: /^Reenviar activación/ });
    expect(botones).toHaveLength(1);
    expect(botones[0]).toHaveAccessibleName("Reenviar activación a Diego Quesada Araya");
    await userEvent.click(botones[0]);
    expect(
      await screen.findByText("Le reenviamos el correo de activación a diego@x.test."),
    ).toBeInTheDocument();
    expect(envios[0].url).toContain("/panel/usuarios/14/reenviar-activacion/");
  });

  it("editar nombre en la misma fila", async () => {
    servidor.use(
      http.patch("/api/v1/panel/usuarios/:id/", async ({ request, params }) => {
        const cuerpo = (await request.json()) as Partial<UsuarioPanel>;
        envios.push({ url: request.url, cuerpo });
        usuarios = usuarios.map((u) => (u.id === Number(params.id) ? { ...u, ...cuerpo } : u));
        return HttpResponse.json(usuarios.find((u) => u.id === Number(params.id)));
      }),
    );
    renderEn("/panel/usuarios");
    await userEvent.click(
      within(await fila("laura@x.test")).getByRole("button", {
        name: "Editar nombre de Laura Vargas Rojas",
      }),
    );
    const apellidos = screen.getByLabelText("Apellidos de Laura Vargas Rojas");
    await userEvent.clear(apellidos);
    await userEvent.type(apellidos, "Vargas Solís");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Laura Vargas Solís")).toBeInTheDocument();
    expect(envios[0].cuerpo).toEqual({ nombre: "Laura", apellidos: "Vargas Solís" });
  });

  it("error de último admin se muestra en el diálogo", async () => {
    servidor.use(
      http.post("/api/v1/panel/usuarios/:id/desactivar/", () =>
        HttpResponse.json({ detalle: ULTIMO_ADMIN, campos: {} }, { status: 400 }),
      ),
    );
    renderEn("/panel/usuarios");
    await userEvent.click(
      within(await fila("pablo@x.test")).getByRole("button", {
        name: "Desactivar a Pablo Segundo Admin",
      }),
    );
    const dialogo = await screen.findByRole("dialog", {
      name: "¿Desactivar a Pablo Segundo Admin?",
    });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, desactivar" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent(ULTIMO_ADMIN);
  });
});
