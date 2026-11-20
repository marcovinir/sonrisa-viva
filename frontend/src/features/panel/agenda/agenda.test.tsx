import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conSesion, pagina, YO_ADMIN, YO_DENTISTA } from "../../../test/panel";
import { renderEn } from "../../../test/render";
import { servidor } from "../../../test/servidor";
import type { CitaPanel, DentistaPanel } from "./api";

const HORARIO = [0, 1, 2, 3, 4]
  .flatMap((dia) => [
    { dia_semana: dia, hora_inicio: "08:00:00", hora_fin: "12:00:00" },
    { dia_semana: dia, hora_inicio: "13:00:00", hora_fin: "17:00:00" },
  ])
  .concat([{ dia_semana: 5, hora_inicio: "08:00:00", hora_fin: "12:00:00" }]);

const dentista = (id: number, nombre: string, apellidos: string): DentistaPanel => ({
  id,
  usuario: {
    id: id + 10,
    email: `${nombre.toLowerCase()}@sonrisaviva.test`,
    nombre,
    apellidos,
    is_active: true,
  },
  especialidad: "Odontología general",
  biografia: "",
  foto_url: "",
  visible_en_web: true,
  servicios: [1],
  horarios: HORARIO,
});

const LAURA = dentista(3, "Laura", "Vargas Rojas");
const ANDRES = dentista(4, "Andrés", "Mora Solís");

const cita = (
  id: number,
  dia: string,
  ini: string,
  fin: string,
  paciente: string,
  servicio: string,
  estado: CitaPanel["estado"] = "confirmada",
): CitaPanel => {
  const [nombre, apellidos] = paciente.split(" ");
  return {
    id,
    inicio: `${dia}T${ini}:00-06:00`,
    fin: `${dia}T${fin}:00-06:00`,
    estado,
    precio_colones: 25000,
    notas_internas: "",
    paciente: {
      id,
      nombre,
      apellidos,
      email: `${nombre.toLowerCase()}@correo.test`,
      telefono: "8888-8888",
    },
    dentista: { id: 3, nombre: "Laura", apellidos: "Vargas Rojas" },
    servicio: { id: 1, nombre: servicio, duracion_min: 45 },
    creado_en: "2026-02-20T10:00:00-06:00",
  };
};

let citas: CitaPanel[];
let pedidosCitas: URL[];

/** Backend falso de la agenda; las citas se pueden cambiar entre pedidos. */
function backend({ perfil = LAURA as DentistaPanel | null } = {}) {
  servidor.use(
    http.get("/api/v1/panel/mi-perfil/", () =>
      perfil
        ? HttpResponse.json(perfil)
        : HttpResponse.json({ detalle: "No encontrado.", campos: {} }, { status: 404 }),
    ),
    http.get("/api/v1/panel/dentistas/", () => HttpResponse.json(pagina([LAURA, ANDRES]))),
    http.get("/api/v1/panel/citas/", ({ request }) => {
      const url = new URL(request.url);
      pedidosCitas.push(url);
      const desde = url.searchParams.get("desde") ?? "";
      return HttpResponse.json(
        pagina(citas.filter((c) => c.inicio.slice(0, 10) >= desde && desde === "2026-03-02")),
      );
    }),
    http.get("/api/v1/panel/bloqueos/", () =>
      HttpResponse.json(
        pagina([
          {
            id: 1,
            dentista: 3,
            inicio: "2026-03-04T08:00:00-06:00",
            fin: "2026-03-04T12:00:00-06:00",
            motivo: "Congreso de odontología",
          },
        ]),
      ),
    ),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-03-02T11:30:00-06:00"));
  citas = [
    cita(1, "2026-03-02", "08:00", "08:45", "Ana Rodríguez", "Limpieza dental", "completada"),
    cita(2, "2026-03-02", "09:15", "10:00", "Carlos Solís", "Limpieza dental"),
    cita(3, "2026-03-02", "13:00", "14:00", "María Jiménez", "Resina (calza)"),
    cita(4, "2026-03-03", "08:30", "09:00", "José Mora", "Valoración general", "cancelada"),
  ];
  pedidosCitas = [];
});
afterEach(() => vi.useRealTimers());

const tarjeta = (nombre: RegExp) => screen.findByRole("button", { name: nombre });

describe("Agenda semanal", () => {
  it("muestra las citas de la semana con chip de estado", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/agenda");
    expect(await screen.findByRole("heading", { name: "Mi agenda" })).toBeInTheDocument();
    expect(screen.getByText("Semana del lunes 2 al sábado 7 de marzo")).toBeInTheDocument();
    expect(await tarjeta(/Ana Rodríguez.*Asistió/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carlos Solís.*Por marcar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /María Jiménez.*Confirmada/ })).toBeInTheDocument();
    // Las canceladas no ocupan espacio en la grilla.
    expect(screen.queryByRole("button", { name: /José Mora/ })).not.toBeInTheDocument();
    expect(screen.getByText("Congreso de odontología")).toBeInTheDocument();
    // Resúmenes
    expect(screen.getByText("3 citas · 1 atendida")).toBeInTheDocument();
    expect(screen.getByText(/en 1 h 30 min/i)).toBeInTheDocument();
    expect(screen.getByText("1 cita ya terminó")).toBeInTheDocument();
  });

  it("la pestaña lleva el nombre de la sección al entrar desde el login", async () => {
    backend();
    servidor.use(
      http.post("/api/v1/auth/login/", () => {
        conSesion(YO_DENTISTA);
        return HttpResponse.json(YO_DENTISTA);
      }),
    );
    renderEn("/panel/login?siguiente=%2Fpanel%2Fagenda");
    await userEvent.type(await screen.findByLabelText("Correo"), "laura.vargas@sonrisaviva.test");
    await userEvent.type(screen.getByLabelText("Contraseña"), "Clave-Segura-2026");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("heading", { name: "Mi agenda" })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe("Mi agenda · Panel Sonrisa Viva"));
  });

  it("la línea Ahora aparece en la semana actual", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/agenda");
    expect(await screen.findByRole("img", { name: "Hora actual: 11:30" })).toBeInTheDocument();
  });

  it("el almuerzo sale sombreado según el horario", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/agenda");
    await tarjeta(/Carlos Solís/);
    expect(screen.getAllByText("Almuerzo")).toHaveLength(5);
    expect(screen.getAllByText("Fuera de horario")).toHaveLength(1);
  });

  it("seleccionar cita terminada permite marcar Asistió y actualiza el chip", async () => {
    conSesion(YO_DENTISTA);
    backend();
    const cuerpos: unknown[] = [];
    servidor.use(
      http.post("/api/v1/panel/citas/2/estado/", async ({ request }) => {
        const cuerpo = (await request.json()) as { estado: CitaPanel["estado"] };
        cuerpos.push(cuerpo);
        citas = citas.map((c) => (c.id === 2 ? { ...c, estado: cuerpo.estado } : c));
        return HttpResponse.json(citas.find((c) => c.id === 2));
      }),
    );
    renderEn("/panel/agenda");
    await userEvent.click(await tarjeta(/Carlos Solís/));
    const detalle = screen.getByRole("complementary", { name: "Cita seleccionada" });
    expect(within(detalle).getByRole("heading", { name: "Carlos Solís" })).toBeInTheDocument();
    expect(within(detalle).getByText("Ya terminó · falta marcar asistencia")).toBeInTheDocument();
    await userEvent.click(within(detalle).getByRole("button", { name: "Asistió" }));
    expect(await tarjeta(/Carlos Solís.*Asistió/)).toBeInTheDocument();
    expect(cuerpos).toEqual([{ estado: "completada" }]);
  });

  it("cita futura no ofrece marcar asistencia y lo explica", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/agenda");
    await userEvent.click(await tarjeta(/María Jiménez/));
    const detalle = screen.getByRole("complementary", { name: "Cita seleccionada" });
    expect(
      within(detalle).getByText("Podrás marcar asistencia cuando la cita termine."),
    ).toBeInTheDocument();
    expect(within(detalle).queryByRole("button", { name: "Asistió" })).not.toBeInTheDocument();
  });

  it("admin puede elegir dentista y la consulta lleva ?dentista=", async () => {
    conSesion(YO_ADMIN);
    backend({ perfil: null });
    renderEn("/panel/agenda");
    expect(await screen.findByRole("heading", { name: "Agenda" })).toBeInTheDocument();
    const selector = await screen.findByLabelText("Dentista");
    await waitFor(() => expect(selector).toHaveValue("3"));
    await waitFor(() =>
      expect(pedidosCitas.some((u) => u.searchParams.get("dentista") === "3")).toBe(true),
    );
    await userEvent.selectOptions(selector, "4");
    await waitFor(() =>
      expect(pedidosCitas.some((u) => u.searchParams.get("dentista") === "4")).toBe(true),
    );
  });

  it("dentista no ve el selector de dentista ni Cancelar", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/agenda");
    await userEvent.click(await tarjeta(/María Jiménez/));
    expect(screen.queryByLabelText("Dentista")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar cita" })).not.toBeInTheDocument();
    expect(pedidosCitas.every((u) => !u.searchParams.has("dentista"))).toBe(true);
  });

  it("admin cancela una cita confirmada tras confirmar", async () => {
    conSesion(YO_ADMIN);
    backend({ perfil: null });
    const cuerpos: unknown[] = [];
    servidor.use(
      http.post("/api/v1/panel/citas/3/estado/", async ({ request }) => {
        cuerpos.push(await request.json());
        citas = citas.map((c) => (c.id === 3 ? { ...c, estado: "cancelada" } : c));
        return HttpResponse.json(citas.find((c) => c.id === 3));
      }),
    );
    renderEn("/panel/agenda");
    await userEvent.click(await tarjeta(/María Jiménez/));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar cita" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Cancelar esta cita?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sí, cancelar" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /María Jiménez/ })).not.toBeInTheDocument(),
    );
    expect(cuerpos).toEqual([{ estado: "cancelada" }]);
    expect(
      await screen.findByText("Cita cancelada. Le avisamos al paciente por correo."),
    ).toBeInTheDocument();
  });

  it("crear bloqueo con 409 muestra el mensaje en el diálogo", async () => {
    conSesion(YO_DENTISTA);
    backend();
    const detalle409 = "Hay 1 citas confirmadas en ese rango; cancélalas o reprográmalas primero.";
    const cuerpos: unknown[] = [];
    servidor.use(
      http.post("/api/v1/panel/bloqueos/", async ({ request }) => {
        cuerpos.push(await request.json());
        return HttpResponse.json({ detalle: detalle409, campos: {} }, { status: 409 });
      }),
    );
    renderEn("/panel/agenda");
    await tarjeta(/Carlos Solís/);
    await userEvent.click(screen.getByRole("button", { name: "+ Bloquear horario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Bloquear horario" });
    await userEvent.selectOptions(within(dialogo).getByLabelText("Desde"), "13:00");
    await userEvent.selectOptions(within(dialogo).getByLabelText("Hasta"), "15:00");
    await userEvent.type(within(dialogo).getByLabelText("Motivo"), "Cita médica");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Guardar bloqueo" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent(detalle409);
    expect(cuerpos).toEqual([
      {
        inicio: "2026-03-02T13:00:00-06:00",
        fin: "2026-03-02T15:00:00-06:00",
        motivo: "Cita médica",
      },
    ]);
  });

  it("hasta antes que desde no envía el bloqueo", async () => {
    conSesion(YO_DENTISTA);
    backend();
    renderEn("/panel/agenda");
    await tarjeta(/Carlos Solís/);
    await userEvent.click(screen.getByRole("button", { name: "+ Bloquear horario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Bloquear horario" });
    await userEvent.selectOptions(within(dialogo).getByLabelText("Desde"), "15:00");
    await userEvent.selectOptions(within(dialogo).getByLabelText("Hasta"), "14:00");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Guardar bloqueo" }));
    expect(
      await within(dialogo).findByText("La hora final debe ser después de la inicial."),
    ).toBeInTheDocument();
  });

  it("notas se guardan al salir del campo", async () => {
    conSesion(YO_DENTISTA);
    backend();
    const cuerpos: unknown[] = [];
    servidor.use(
      http.patch("/api/v1/panel/citas/2/", async ({ request }) => {
        const cuerpo = (await request.json()) as { notas_internas: string };
        cuerpos.push(cuerpo);
        return HttpResponse.json({ ...citas[1], ...cuerpo });
      }),
    );
    renderEn("/panel/agenda");
    await userEvent.click(await tarjeta(/Carlos Solís/));
    await userEvent.type(screen.getByLabelText("Notas internas"), "Sensibilidad");
    await userEvent.tab();
    expect(await screen.findByText("Notas guardadas")).toBeInTheDocument();
    expect(cuerpos).toEqual([{ notas_internas: "Sensibilidad" }]);
  });

  it("semana siguiente cambia el parámetro y pide citas nuevas", async () => {
    conSesion(YO_DENTISTA);
    backend();
    const { router } = renderEn("/panel/agenda");
    await tarjeta(/Carlos Solís/);
    await userEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
    await waitFor(() => expect(router.state.location.search).toBe("?semana=2026-03-09"));
    await waitFor(() =>
      expect(pedidosCitas.some((u) => u.searchParams.get("desde") === "2026-03-09")).toBe(true),
    );
    expect(screen.getByText("Semana del lunes 9 al sábado 14 de marzo")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Hora actual/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hoy" }));
    await waitFor(() => expect(router.state.location.search).toBe("?semana=2026-03-02"));
  });
});
