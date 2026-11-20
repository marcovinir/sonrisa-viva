/** Cliente de la API: rutas relativas, CSRF de Django y errores uniformes. */

export class ApiError extends Error {
  status: number;
  detalle: string;
  campos: Record<string, string[]>;

  constructor(status: number, detalle: string, campos: Record<string, string[]> = {}) {
    super(detalle);
    this.name = "ApiError";
    this.status = status;
    this.detalle = detalle;
    this.campos = campos;
  }
}

export const SIN_CONEXION =
  "No pudimos conectar con la clínica. Revisa tu conexión e intenta de nuevo.";

type Metodo = "GET" | "POST" | "PATCH" | "DELETE";
type Opciones = {
  metodo?: Metodo;
  cuerpo?: unknown;
  query?: Record<string, string | number | undefined | null>;
};

const BASE = "/api/v1";

function url(ruta: string, query?: Opciones["query"]): string {
  const u = new URL(BASE + ruta, window.location.origin);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function leerCookie(nombre: string): string | null {
  const par = document.cookie.split("; ").find((c) => c.startsWith(nombre + "="));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

async function asegurarCsrf(): Promise<string | null> {
  if (!leerCookie("csrftoken")) {
    await fetch(url("/auth/csrf/"), { credentials: "same-origin" });
  }
  return leerCookie("csrftoken");
}

async function aError(respuesta: Response): Promise<ApiError> {
  try {
    const datos = await respuesta.json();
    return new ApiError(respuesta.status, datos.detalle ?? "Algo salió mal.", datos.campos ?? {});
  } catch {
    return new ApiError(respuesta.status, "Algo salió mal. Intenta de nuevo.");
  }
}

export async function api<T = unknown>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const metodo = opciones.metodo ?? "GET";
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  let respuesta: Response;
  try {
    if (metodo !== "GET") {
      const token = await asegurarCsrf();
      if (token) cabeceras["X-CSRFToken"] = token;
    }
    if (opciones.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
    respuesta = await fetch(url(ruta, opciones.query), {
      method: metodo,
      headers: cabeceras,
      credentials: "same-origin",
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, SIN_CONEXION);
  }
  if (!respuesta.ok) throw await aError(respuesta);
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}
