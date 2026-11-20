/** Datos y ayudas de MSW para las pruebas del panel. */
import { http, HttpResponse } from "msw";
import { servidor } from "./servidor";

const TODOS = [
  "usuarios.gestionar",
  "catalogo.gestionar",
  "dentistas.gestionar",
  "dentistas.bloqueos_propios",
  "citas.ver_todas",
  "citas.gestionar_todas",
  "citas.ver_propias",
  "citas.marcar_asistencia",
  "reportes.ver",
].sort();

export const YO_ADMIN = {
  id: 1,
  email: "admin@sonrisaviva.test",
  nombre: "Admin",
  apellidos: "Sonrisa Viva",
  rol: "admin" as const,
  permisos: TODOS,
};

export const YO_DENTISTA = {
  id: 2,
  email: "laura.vargas@sonrisaviva.test",
  nombre: "Laura",
  apellidos: "Vargas Rojas",
  rol: "dentista" as const,
  permisos: ["citas.marcar_asistencia", "citas.ver_propias", "dentistas.bloqueos_propios"],
};

/** Simula una sesión iniciada con el usuario indicado. */
export function conSesion(yo: typeof YO_ADMIN | typeof YO_DENTISTA) {
  servidor.use(http.get("/api/v1/auth/yo/", () => HttpResponse.json(yo)));
}

/** Respuesta paginada como la de DRF. */
export const pagina = <T>(results: T[], count = results.length) => ({
  count,
  next: null,
  previous: null,
  results,
});
