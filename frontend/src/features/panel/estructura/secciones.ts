import type { Yo } from "../auth/api";

export type Seccion = {
  ruta: string;
  nombre: string;
  nombreDentista?: string;
  permisos: string[];
};

/** Secciones del panel en orden; basta con tener alguno de los permisos. */
export const SECCIONES: Seccion[] = [
  {
    ruta: "agenda",
    nombre: "Agenda",
    nombreDentista: "Mi agenda",
    permisos: ["citas.ver_propias", "citas.ver_todas"],
  },
  {
    ruta: "citas",
    nombre: "Citas",
    nombreDentista: "Mis citas",
    permisos: ["citas.ver_todas", "citas.ver_propias"],
  },
  { ruta: "servicios", nombre: "Servicios", permisos: ["catalogo.gestionar"] },
  { ruta: "dentistas", nombre: "Dentistas", permisos: ["dentistas.gestionar"] },
  { ruta: "usuarios", nombre: "Usuarios", permisos: ["usuarios.gestionar"] },
  { ruta: "reportes", nombre: "Reportes", permisos: ["reportes.ver"] },
];

export const nombreSeccion = (s: Seccion, yo: Yo | null) =>
  yo && !yo.permisos.includes("citas.ver_todas") && s.nombreDentista ? s.nombreDentista : s.nombre;

export const seccionesDe = (yo: Yo | null) =>
  yo ? SECCIONES.filter((s) => s.permisos.some((p) => yo.permisos.includes(p))) : [];

export const permisosDe = (ruta: string) => SECCIONES.find((s) => s.ruta === ruta)?.permisos ?? [];

export const primeraRuta = (yo: Yo | null) => {
  const primera = seccionesDe(yo)[0];
  return primera ? `/panel/${primera.ruta}` : "/";
};

/** Solo se acepta volver a rutas internas del panel. */
export const destinoSeguro = (siguiente: string | null, yo: Yo | null) =>
  siguiente &&
  siguiente.startsWith("/panel/") &&
  !siguiente.startsWith("//") &&
  !siguiente.startsWith("/panel/login")
    ? siguiente
    : primeraRuta(yo);
