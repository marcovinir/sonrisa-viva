import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderEn } from "../../test/render";
import { SERVICIOS, servidor } from "../../test/servidor";

const seccion = (nombre: RegExp) => screen.findByRole("region", { name: nombre });

describe("Landing (parte 2)", () => {
  it("lista servicios de la API con precio en colones", async () => {
    renderEn("/");
    const servicios = await seccion(/lo que hacemos por tu sonrisa/i);
    expect(await within(servicios).findAllByRole("article")).toHaveLength(SERVICIOS.length);
    expect(within(servicios).getByText("Limpieza dental")).toBeInTheDocument();
    expect(within(servicios).getByText(/₡25 000/)).toBeInTheDocument();
  });

  it("el chip Estética filtra las tarjetas", async () => {
    renderEn("/");
    const servicios = await seccion(/lo que hacemos por tu sonrisa/i);
    await within(servicios).findAllByRole("article");
    await userEvent.click(within(servicios).getByRole("button", { name: "Estética" }));
    const tarjetas = within(servicios).getAllByRole("article");
    expect(tarjetas).toHaveLength(1);
    expect(tarjetas[0]).toHaveTextContent("Blanqueamiento");
    expect(within(servicios).getByRole("button", { name: "Estética" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Agendar lleva a /reservar?servicio=<id>", async () => {
    renderEn("/");
    const enlace = await screen.findByRole("link", { name: "Agendar Limpieza dental" });
    expect(enlace).toHaveAttribute("href", "/reservar?servicio=12");
  });

  it("un error de servicios muestra Reintentar y reintenta", async () => {
    let llamadas = 0;
    servidor.use(
      http.get("/api/v1/servicios/", () => {
        llamadas += 1;
        return llamadas <= 1
          ? HttpResponse.json({ detalle: "Error del servidor.", campos: {} }, { status: 500 })
          : HttpResponse.json(SERVICIOS);
      }),
    );
    renderEn("/");
    const servicios = await seccion(/lo que hacemos por tu sonrisa/i);
    await userEvent.click(await within(servicios).findByRole("button", { name: "Reintentar" }));
    expect(await within(servicios).findAllByRole("article")).toHaveLength(SERVICIOS.length);
  });

  it("el equipo usa iniciales si la foto falla", async () => {
    renderEn("/");
    const equipo = await seccion(/cuatro especialistas/i);
    const foto = await within(equipo).findByRole("img", { name: "Retrato de Laura Vargas Rojas" });
    fireEvent.error(foto);
    await waitFor(() =>
      expect(
        within(equipo).getByRole("img", { name: "Retrato de Laura Vargas Rojas" }),
      ).toHaveTextContent("LV"),
    );
    // Andrés no tiene foto: muestra iniciales desde el inicio.
    expect(
      within(equipo).getByRole("img", { name: "Retrato de Andrés Mora Jiménez" }),
    ).toHaveTextContent("AM");
  });

  it("Agendar con un dentista lleva ?dentista=<id>", async () => {
    renderEn("/");
    const enlace = await screen.findByRole("link", { name: /agendar con laura/i });
    expect(enlace).toHaveAttribute("href", "/reservar?dentista=5");
  });

  it("el carrusel avanza, retrocede y anuncia la posición", async () => {
    renderEn("/");
    const testimonios = await seccion(/lo que dicen nuestros pacientes/i);
    const carrusel = within(testimonios).getByRole("region", { name: "Testimonios" });
    expect(carrusel).toHaveTextContent("1 de 3");
    await userEvent.click(within(carrusel).getByRole("button", { name: "Testimonio siguiente" }));
    expect(carrusel).toHaveTextContent("2 de 3");
    await userEvent.click(within(carrusel).getByRole("button", { name: "Testimonio anterior" }));
    await userEvent.click(within(carrusel).getByRole("button", { name: "Testimonio anterior" }));
    expect(carrusel).toHaveTextContent("3 de 3");
  });

  it("contacto tiene preguntas frecuentes", async () => {
    renderEn("/");
    const contacto = await seccion(/estamos para ayudarte/i);
    expect(
      within(contacto).getByText("¿Necesito crear una cuenta para agendar?"),
    ).toBeInTheDocument();
  });
});
