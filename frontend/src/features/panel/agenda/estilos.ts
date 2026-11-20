import type { EstadoVisual } from "./semana";

/** Colores y textos de cada estado (tablero Panel-agenda v3). El chip siempre lleva texto. */
export const ESTADOS: Record<
  EstadoVisual,
  {
    fondo: string;
    barra: string;
    texto: string;
    chip: string;
    chipFondo: string;
    chipColor: string;
    icono: string;
  }
> = {
  confirmada: {
    fondo: "#E3EEF0",
    barra: "#13505F",
    texto: "#0E2F38",
    chip: "Confirmada",
    chipFondo: "#FFFFFF",
    chipColor: "#13505F",
    icono: "",
  },
  completada: {
    fondo: "#EAF3EA",
    barra: "#2E6B3A",
    texto: "#1F4A28",
    chip: "✓ Asistió",
    chipFondo: "#FFFFFF",
    chipColor: "#2E6B3A",
    icono: "✓",
  },
  no_asistio: {
    fondo: "#F6EDE0",
    barra: "#8A6A3B",
    texto: "#4A3A22",
    chip: "✕ No asistió",
    chipFondo: "#FFFFFF",
    chipColor: "#6B5330",
    icono: "✕",
  },
  por_marcar: {
    fondo: "#13505F",
    barra: "#D9BC8C",
    texto: "#FFFFFF",
    chip: "Por marcar",
    chipFondo: "#D9BC8C",
    chipColor: "#0E2F38",
    icono: "!",
  },
  cancelada: {
    fondo: "#F1EEE8",
    barra: "#8A9398",
    texto: "#45555C",
    chip: "Cancelada",
    chipFondo: "#FFFFFF",
    chipColor: "#45555C",
    icono: "",
  },
};

/** Texto largo del estado en el detalle de la cita. */
export const ESTADO_LARGO: Record<EstadoVisual, string> = {
  confirmada: "Confirmada",
  completada: "Asistió",
  no_asistio: "No asistió",
  por_marcar: "Ya terminó · falta marcar asistencia",
  cancelada: "Cancelada",
};

export const RAYADO_BLOQUEO =
  "repeating-linear-gradient(45deg,#EFE8DB 0,#EFE8DB 6px,#F8F5EF 6px,#F8F5EF 12px)";
export const RAYADO_FRANJA =
  "repeating-linear-gradient(135deg,#F4F1EA 0,#F4F1EA 8px,#FAF8F3 8px,#FAF8F3 16px)";
