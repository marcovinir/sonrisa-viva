import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderEn } from "../../test/render";

const titulo = (nombre: RegExp) => screen.findByRole("heading", { level: 1, name: nombre });
const resumen = () => screen.getByRole("complementary", { name: "Resumen de tu cita" });

describe("Asistente de reserva (servicio y dentista)", () => {
  it("sin parámetros empieza en servicio", async () => {
    renderEn("/reservar");
    expect(await titulo(/qué servicio necesitas/i)).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Servicio");
  });

  it("?servicio=<id> salta a dentista y lo muestra en el resumen", async () => {
    renderEn("/reservar?servicio=12");
    expect(await titulo(/con quién quieres atenderte/i)).toBeInTheDocument();
    await waitFor(() => expect(resumen()).toHaveTextContent("Limpieza dental"));
    expect(resumen()).toHaveTextContent("₡25 000");
  });

  it("?dentista=<id> sin servicio pide servicio y conserva el dentista si lo hace", async () => {
    const { router } = renderEn("/reservar?dentista=5");
    expect(await titulo(/qué servicio necesitas/i)).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: /elegir limpieza dental/i }));
    expect(await titulo(/elige el día y la hora/i)).toBeInTheDocument();
    expect(router.state.location.search).toContain("dentista=5");
    await waitFor(() => expect(resumen()).toHaveTextContent("Laura Vargas Rojas"));
  });

  it("un servicio inexistente muestra aviso y vuelve a servicio", async () => {
    const { router } = renderEn("/reservar?servicio=99");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ese servicio ya no está disponible.",
    );
    expect(await titulo(/qué servicio necesitas/i)).toBeInTheDocument();
    expect(router.state.location.search).not.toContain("servicio=99");
  });

  it("elegir cualquiera avanza a hora", async () => {
    renderEn("/reservar?servicio=12");
    await titulo(/con quién quieres atenderte/i);
    await userEvent.click(screen.getByRole("button", { name: /cualquiera disponible/i }));
    expect(await titulo(/elige el día y la hora/i)).toBeInTheDocument();
    expect(resumen()).toHaveTextContent("Cualquiera disponible");
  });

  it("cambiar de servicio limpia el dentista que no lo hace", async () => {
    const { router } = renderEn("/reservar?servicio=12&dentista=5");
    await titulo(/elige el día y la hora/i);
    await userEvent.click(screen.getByRole("link", { name: /servicio/i }));
    await titulo(/qué servicio necesitas/i);
    await userEvent.click(await screen.findByRole("button", { name: /elegir blanqueamiento/i }));
    expect(await titulo(/con quién quieres atenderte/i)).toBeInTheDocument();
    expect(router.state.location.search).not.toContain("dentista");
  });

  it("el foco va al título del paso", async () => {
    renderEn("/reservar?servicio=12");
    await titulo(/con quién quieres atenderte/i);
    await userEvent.click(screen.getByRole("button", { name: /cualquiera disponible/i }));
    const h1 = await titulo(/elige el día y la hora/i);
    await waitFor(() => expect(h1).toHaveFocus());
  });

  it("en móvil hay un resumen plegable arriba del paso", async () => {
    renderEn("/reservar?servicio=12");
    const plegable = await screen.findByText("Tu cita: Limpieza dental");
    expect(plegable.closest("summary")).not.toBeNull();
    const details = plegable.closest("details")!;
    expect(details).not.toHaveAttribute("open");
    await userEvent.click(plegable);
    expect(details).toHaveAttribute("open");
    expect(within(details).getByText("₡25 000")).toBeInTheDocument();
  });

  it("los pasos hechos son enlaces para volver", async () => {
    renderEn("/reservar?servicio=12&dentista=cualquiera");
    await titulo(/elige el día y la hora/i);
    const pasos = screen.getByRole("list", { name: "Pasos de la reserva" });
    expect(within(pasos).getByRole("link", { name: /servicio/i })).toBeInTheDocument();
    expect(within(pasos).getByRole("link", { name: /dentista/i })).toBeInTheDocument();
    expect(within(pasos).queryByRole("link", { name: /tus datos/i })).not.toBeInTheDocument();
  });
});
