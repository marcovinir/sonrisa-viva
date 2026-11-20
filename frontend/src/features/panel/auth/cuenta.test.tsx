import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";

const ENLACE_INVALIDO = "El enlace no es válido o ya fue usado.";
const MENSAJE_RECUPERAR =
  "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.";

const escribirClaves = async (clave: string, confirmar = clave) => {
  await userEvent.type(await screen.findByLabelText("Contraseña nueva"), clave);
  await userEvent.type(screen.getByLabelText("Repite la contraseña"), confirmar);
};

/** Registra lo que llega a POST /auth/<modo>/ y responde con `respuesta`. */
const capturar = (
  modo: string,
  respuesta: () => Response = () => new HttpResponse(null, { status: 204 }),
) => {
  const recibidos: unknown[] = [];
  servidor.use(
    http.post(`/api/v1/auth/${modo}/`, async ({ request }) => {
      recibidos.push(await request.json());
      return respuesta();
    }),
  );
  return recibidos;
};

describe("Activar y restablecer contraseña", () => {
  it("activar con contraseña válida muestra éxito y botón a login", async () => {
    const recibidos = capturar("activar");
    renderEn("/panel/activar/MQ/abc-123");
    expect(await screen.findByRole("heading", { name: "Activa tu cuenta" })).toBeInTheDocument();
    await escribirClaves("Sonrisa-2026");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
    expect(
      await screen.findByRole("heading", { name: "Listo, ya puedes entrar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/panel/login",
    );
    expect(recibidos).toEqual([{ uid: "MQ", token: "abc-123", password: "Sonrisa-2026" }]);
  });

  it("contraseñas distintas no envían", async () => {
    const recibidos = capturar("activar");
    renderEn("/panel/activar/MQ/abc-123");
    await escribirClaves("Sonrisa-2026", "Sonrisa-2027");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(recibidos).toHaveLength(0);
  });

  it("contraseña solo numérica muestra la regla", async () => {
    const recibidos = capturar("activar");
    renderEn("/panel/activar/MQ/abc-123");
    await escribirClaves("12345678");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
    expect(await screen.findByText("La contraseña no puede ser solo números.")).toBeInTheDocument();
    expect(recibidos).toHaveLength(0);
  });

  it("contraseña corta muestra el mínimo", async () => {
    renderEn("/panel/activar/MQ/abc-123");
    await escribirClaves("abc12");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres."),
    ).toBeInTheDocument();
  });

  it("error de campo del backend se ve en el campo", async () => {
    capturar("activar", () =>
      HttpResponse.json(
        {
          detalle: "Revisa los datos marcados.",
          campos: { password: ["Esta contraseña es demasiado común."] },
        },
        { status: 400 },
      ),
    );
    renderEn("/panel/activar/MQ/abc-123");
    await escribirClaves("Password123");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
    const mensaje = await screen.findByText("Esta contraseña es demasiado común.");
    expect(screen.getByLabelText("Contraseña nueva")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(mensaje.id),
    );
  });

  it("enlace inválido muestra la explicación y el enlace a recuperar", async () => {
    capturar("activar", () =>
      HttpResponse.json({ detalle: ENLACE_INVALIDO, campos: {} }, { status: 400 }),
    );
    renderEn("/panel/activar/MQ/vencido");
    await escribirClaves("Sonrisa-2026");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
    expect(
      await screen.findByRole("heading", { name: "Este enlace ya no sirve" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedir un enlace nuevo" })).toHaveAttribute(
      "href",
      "/panel/recuperar",
    );
  });

  it("restablecer usa POST /auth/restablecer/", async () => {
    const recibidos = capturar("restablecer");
    renderEn("/panel/restablecer/Mg/xyz-789");
    expect(
      await screen.findByRole("heading", { name: "Elige una contraseña nueva" }),
    ).toBeInTheDocument();
    await escribirClaves("Sonrisa-2026");
    await userEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
    expect(
      await screen.findByRole("heading", { name: "Listo, ya puedes entrar" }),
    ).toBeInTheDocument();
    expect(recibidos).toEqual([{ uid: "Mg", token: "xyz-789", password: "Sonrisa-2026" }]);
  });
});

describe("Recuperar contraseña", () => {
  it("recuperar siempre muestra el mismo mensaje, exista o no", async () => {
    // El backend responde 204 exista o no la cuenta; la pantalla no distingue.
    const recibidos = capturar("recuperar");
    renderEn("/panel/recuperar");
    await userEvent.type(await screen.findByLabelText("Correo"), "laura@sonrisaviva.test");
    await userEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(await screen.findByText(MENSAJE_RECUPERAR)).toBeInTheDocument();
    expect(recibidos).toEqual([{ email: "laura@sonrisaviva.test" }]);
  });

  it("un correo inválido no se envía", async () => {
    const recibidos = capturar("recuperar");
    renderEn("/panel/recuperar");
    await userEvent.type(await screen.findByLabelText("Correo"), "laura");
    await userEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(await screen.findByText("Escribe un correo válido.")).toBeInTheDocument();
    await waitFor(() => expect(recibidos).toHaveLength(0));
  });
});
