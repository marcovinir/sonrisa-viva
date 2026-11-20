import { z } from "zod";

/** Las mismas reglas que valida el backend (ReservaSerializer). */
export const pacienteEsquema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre.").max(100, "Máximo 100 caracteres."),
  apellidos: z.string().trim().min(1, "Escribe tus apellidos.").max(150, "Máximo 150 caracteres."),
  email: z
    .string()
    .trim()
    .pipe(z.email("Escribe un correo válido (por ejemplo, nombre@gmail.com).")),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, "Escribe un teléfono válido (solo números, + o -)."),
});

export type PacienteFormulario = z.infer<typeof pacienteEsquema>;
