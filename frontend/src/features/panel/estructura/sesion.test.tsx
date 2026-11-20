import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { conSesion, YO_ADMIN, YO_DENTISTA } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";

const iniciar = async (email = "admin@sonrisaviva.test", clave = "Clave-Segura-2026") => {
  await userEvent.type(await screen.findByLabelText("Correo"), email);
  await userEvent.type(screen.getByLabelText("Contraseña"), clave);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
};

describe("Sesión y estructura del panel", () => {
  it("sin sesión /panel/citas redirige a login con siguiente", async () => {
    const { router } = renderEn("/panel/citas");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/panel/login");
    expect(router.state.location.search).toBe("?siguiente=%2Fpanel%2Fcitas");
  });

  it("login correcto lleva a siguiente", async () => {
    const { router } = renderEn("/panel/login?siguiente=%2Fpanel%2Fservicios");
    servidor.use(
      http.post("/api/v1/auth/login/", () => {
        conSesion(YO_ADMIN);
        return HttpResponse.json(YO_ADMIN);
      }),
    );
    await iniciar();
    await waitFor(() => expect(router.state.location.pathname).toBe("/panel/servicios"));
  });

  it("login incorrecto muestra el mensaje del backend", async () => {
    servidor.use(
      http.post("/api/v1/auth/login/", () =>
        HttpResponse.json(
          { detalle: "Correo o contraseña incorrectos.", campos: {} },
          { status: 400 },
        ),
      ),
    );
    renderEn("/panel/login");
    await iniciar("x@x.test", "mala");
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
  });

  it("un siguiente externo se ignora", async () => {
    const { router } = renderEn("/panel/login?siguiente=https%3A%2F%2Fotro.test");
    servidor.use(
      http.post("/api/v1/auth/login/", () => {
        conSesion(YO_ADMIN);
        return HttpResponse.json(YO_ADMIN);
      }),
    );
    await iniciar();
    await waitFor(() => expect(router.state.location.pathname).toBe("/panel/agenda"));
  });

  it("el admin ve las 6 secciones; el dentista, Mi agenda y Mis citas", async () => {
    conSesion(YO_ADMIN);
    const { unmount } = renderEn("/panel/agenda");
    const nav = await screen.findByRole("navigation", { name: "Panel" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Agenda", "Citas", "Servicios", "Dentistas", "Usuarios", "Reportes"]);
    unmount();
    conSesion(YO_DENTISTA);
    renderEn("/panel/agenda");
    const nav2 = await screen.findByRole("navigation", { name: "Panel" });
    expect(
      within(nav2)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Mi agenda", "Mis citas"]);
  });

  it("un dentista en /panel/usuarios ve No tienes acceso", async () => {
    conSesion(YO_DENTISTA);
    renderEn("/panel/usuarios");
    expect(
      await screen.findByRole("heading", { name: "No tienes acceso a esta sección" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Mi agenda" })).toHaveAttribute(
      "href",
      "/panel/agenda",
    );
  });

  it("/panel lleva a la primera sección permitida", async () => {
    conSesion(YO_DENTISTA);
    const { router } = renderEn("/panel");
    await waitFor(() => expect(router.state.location.pathname).toBe("/panel/agenda"));
  });

  it("cerrar sesión limpia y vuelve a login", async () => {
    conSesion(YO_ADMIN);
    let cerro = false;
    servidor.use(
      http.post("/api/v1/auth/logout/", () => {
        cerro = true;
        servidor.use(http.get("/api/v1/auth/yo/", () => new HttpResponse(null, { status: 403 })));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderEn("/panel/agenda");
    await userEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/panel/login"));
    expect(cerro).toBe(true);
  });
});
