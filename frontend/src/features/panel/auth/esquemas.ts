import { z } from "zod";

/** Igual que los validadores de Django: mínimo 8, no solo números, no común ni parecida a tus datos. */
export const AYUDA_CONTRASENA =
  "Al menos 8 caracteres, no solo números. Evita contraseñas comunes o parecidas a tu nombre o correo.";

export const contrasenaEsquema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .regex(/\D/, "La contraseña no puede ser solo números."),
    confirmar: z.string().min(1, "Repite la contraseña."),
  })
  .refine((d) => d.password === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden.",
  });

export type ContrasenaFormulario = z.infer<typeof contrasenaEsquema>;

export const recuperarEsquema = z.object({
  email: z.string().trim().pipe(z.email("Escribe un correo válido.")),
});

export type RecuperarFormulario = z.infer<typeof recuperarEsquema>;
