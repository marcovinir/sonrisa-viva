import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../shared/api/cliente";
import type { DentistaElegido } from "./estado";

export type HoraLibre = { inicio: string; fin: string; dentistas: number[] };

export type CitaResumen = {
  id: number;
  servicio: { id: number; nombre: string };
  dentista: { id: number; nombre: string; apellidos: string };
  inicio: string;
  fin: string;
  precio_colones: number;
  estado: "confirmada" | "cancelada" | "completada" | "no_asistio";
  paciente: { nombre: string; email: string };
};

export type Paciente = { nombre: string; apellidos: string; email: string; telefono: string };

const idDentista = (d: DentistaElegido | null | undefined) =>
  typeof d === "number" ? d : undefined;
const dosDigitos = (n: number) => String(n).padStart(2, "0");

export function useDiasDisponibles(
  servicioId: number,
  dentista: DentistaElegido | null,
  anio: number,
  mes: number,
) {
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const desde = `${anio}-${dosDigitos(mes)}-01`;
  const hasta = `${anio}-${dosDigitos(mes)}-${dosDigitos(ultimo)}`;
  return useQuery({
    queryKey: ["dias", servicioId, dentista, anio, mes],
    queryFn: () =>
      api<{ dias: string[] }>("/disponibilidad/dias/", {
        query: { servicio: servicioId, desde, hasta, dentista: idDentista(dentista) },
      }),
    select: (r) => new Set(r.dias),
  });
}

export function useHorasLibres(
  servicioId: number,
  dentista: DentistaElegido | null,
  fecha: string | null,
) {
  return useQuery({
    queryKey: ["horas", servicioId, dentista, fecha],
    enabled: Boolean(fecha),
    queryFn: () =>
      api<{ fecha: string; horas: HoraLibre[] }>("/disponibilidad/", {
        query: { servicio: servicioId, fecha: fecha ?? undefined, dentista: idDentista(dentista) },
      }),
    select: (r) => r.horas,
  });
}

export function useReservar() {
  return useMutation({
    mutationFn: (datos: {
      servicio: number;
      inicio: string;
      dentista: DentistaElegido | null;
      paciente: Paciente;
    }) =>
      api<CitaResumen>("/citas/", {
        metodo: "POST",
        cuerpo: { ...datos, dentista: idDentista(datos.dentista) ?? null },
      }),
  });
}
