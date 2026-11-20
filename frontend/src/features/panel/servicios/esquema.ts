import { z } from "zod";

export const DURACION_INVALIDA =
  "La duración debe ser un múltiplo de 15 minutos (por ejemplo 45 o 60).";

/** Igual que las reglas del backend (ServicioPanelSerializer). */
export const servicioEsquema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Escribe el nombre del servicio.")
    .max(120, "El nombre puede tener hasta 120 caracteres."),
  categoria: z.number({ error: "Elige una categoría." }).int().positive("Elige una categoría."),
  duracion_min: z
    .number({ error: "Escribe la duración en minutos." })
    .int(DURACION_INVALIDA)
    .min(15, DURACION_INVALIDA)
    .refine((v) => v % 15 === 0, DURACION_INVALIDA),
  precio_colones: z
    .number({ error: "Escribe el precio en colones." })
    .int("El precio va sin decimales.")
    .min(0, "El precio no puede ser negativo."),
  descripcion: z.string().max(2000, "La descripción puede tener hasta 2000 caracteres."),
  indicaciones: z.string().max(500, "Las indicaciones pueden tener hasta 500 caracteres."),
  activo: z.boolean(),
});

export type ServicioFormulario = z.infer<typeof servicioEsquema>;
