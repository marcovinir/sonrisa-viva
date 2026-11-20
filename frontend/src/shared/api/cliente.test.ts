import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { servidor } from "../../test/servidor";
import { api, ApiError } from "./cliente";

describe("api", () => {
  it("manda X-CSRFToken en POST tras pedir csrf", async () => {
    let tokenRecibido: string | null = null;
    servidor.use(
      http.get("/api/v1/auth/csrf/", () => {
        document.cookie = "csrftoken=abc123; path=/";
        return new HttpResponse(null, { status: 204 });
      }),
      http.post("/api/v1/citas/", ({ request }) => {
        tokenRecibido = request.headers.get("X-CSRFToken");
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );
    const r = await api<{ id: number }>("/citas/", { metodo: "POST", cuerpo: { a: 1 } });
    expect(r).toEqual({ id: 1 });
    expect(tokenRecibido).toBe("abc123");
  });

  it("agrega la query y devuelve undefined en 204", async () => {
    let url = "";
    servidor.use(
      http.get("/api/v1/disponibilidad/", ({ request }) => {
        url = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const r = await api("/disponibilidad/", {
      query: { servicio: 2, fecha: "2026-03-02", dentista: undefined },
    });
    expect(r).toBeUndefined();
    expect(url).toContain("servicio=2");
    expect(url).not.toContain("dentista");
  });

  it("convierte {detalle,campos} en ApiError", async () => {
    servidor.use(
      http.get("/api/v1/servicios/", () =>
        HttpResponse.json(
          { detalle: "Revisa los datos marcados.", campos: { email: ["Malo"] } },
          { status: 400 },
        ),
      ),
    );
    const error = (await api("/servicios/").catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.detalle).toBe("Revisa los datos marcados.");
    expect(error.campos).toEqual({ email: ["Malo"] });
  });

  it("convierte un fallo de red en ApiError status 0", async () => {
    servidor.use(http.get("/api/v1/servicios/", () => HttpResponse.error()));
    const error = (await api("/servicios/").catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.detalle).toBe(
      "No pudimos conectar con la clínica. Revisa tu conexión e intenta de nuevo.",
    );
  });
});
