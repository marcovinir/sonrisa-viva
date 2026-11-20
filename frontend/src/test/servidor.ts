/** Servidor MSW para las pruebas, con datos iguales a `manage.py sembrar`. */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const CATEGORIAS = [
  { id: 1, nombre: "Preventiva", orden: 1 },
  { id: 2, nombre: "Estética", orden: 2 },
  { id: 3, nombre: "Ortodoncia", orden: 3 },
];

const cat = (id: number) => ({ id, nombre: CATEGORIAS.find((c) => c.id === id)!.nombre });

export const SERVICIOS = [
  {
    id: 11,
    nombre: "Valoración general",
    slug: "valoracion-general",
    descripcion: "Revisión completa de dientes y encías con plan de tratamiento.",
    duracion_min: 30,
    precio_colones: 15000,
    categoria: cat(1),
  },
  {
    id: 12,
    nombre: "Limpieza dental",
    slug: "limpieza-dental",
    descripcion: "Profilaxis, eliminación de sarro y pulido.",
    duracion_min: 45,
    precio_colones: 25000,
    categoria: cat(1),
  },
  {
    id: 14,
    nombre: "Blanqueamiento",
    slug: "blanqueamiento",
    descripcion: "Blanqueamiento en consultorio con lámpara LED.",
    duracion_min: 90,
    precio_colones: 120000,
    categoria: cat(2),
  },
  {
    id: 17,
    nombre: "Control de brackets",
    slug: "control-brackets",
    descripcion: "Ajuste mensual de brackets.",
    duracion_min: 30,
    precio_colones: 30000,
    categoria: cat(3),
  },
];

export const DENTISTAS = [
  {
    id: 5,
    nombre: "Laura",
    apellidos: "Vargas Rojas",
    especialidad: "Odontología general",
    biografia: "Valoraciones y limpiezas.",
    foto_url: "/equipo/laura-vargas.jpg",
    servicios: [11, 12],
  },
  {
    id: 6,
    nombre: "Andrés",
    apellidos: "Mora Jiménez",
    especialidad: "Ortodoncia",
    biografia: "Brackets.",
    foto_url: "",
    servicios: [11, 17],
  },
];

/** Lunes 2 de marzo de 2026 en hora de Costa Rica (UTC-6). */
export const horaLibre = (hh: number, mm = 0, dentistas = [5]) => {
  const inicio = new Date(Date.UTC(2026, 2, 2, hh + 6, mm));
  const fin = new Date(inicio.getTime() + 45 * 60_000);
  return { inicio: inicio.toISOString(), fin: fin.toISOString(), dentistas };
};

export const handlersBase = [
  http.get("/api/v1/auth/csrf/", () => {
    document.cookie = "csrftoken=prueba; path=/";
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("/api/v1/servicios/", () => HttpResponse.json(SERVICIOS)),
  http.get("/api/v1/categorias/", () => HttpResponse.json(CATEGORIAS)),
  http.get("/api/v1/dentistas/", ({ request }) => {
    const servicio = Number(new URL(request.url).searchParams.get("servicio"));
    return HttpResponse.json(
      servicio ? DENTISTAS.filter((d) => d.servicios.includes(servicio)) : DENTISTAS,
    );
  }),
  http.get("/api/v1/disponibilidad/dias/", () =>
    HttpResponse.json({ dias: ["2026-03-02", "2026-03-04", "2026-03-09"] }),
  ),
  http.get("/api/v1/disponibilidad/", ({ request }) => {
    const fecha = new URL(request.url).searchParams.get("fecha");
    const horas = fecha === "2026-03-02" ? [horaLibre(9), horaLibre(9, 15), horaLibre(13, 30)] : [];
    return HttpResponse.json({ fecha, horas });
  }),
];

export const servidor = setupServer(...handlersBase);
