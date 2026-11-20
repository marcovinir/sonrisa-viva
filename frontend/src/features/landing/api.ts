import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/api/cliente";

export type Categoria = { id: number; nombre: string; orden?: number };

export type Servicio = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  duracion_min: number;
  precio_colones: number;
  categoria: { id: number; nombre: string };
};

export type Dentista = {
  id: number;
  nombre: string;
  apellidos: string;
  especialidad: string;
  biografia: string;
  foto_url: string;
  servicios: number[];
};

export const useServicios = () =>
  useQuery({ queryKey: ["servicios"], queryFn: () => api<Servicio[]>("/servicios/") });

export const useCategorias = () =>
  useQuery({ queryKey: ["categorias"], queryFn: () => api<Categoria[]>("/categorias/") });

export const useDentistas = (servicioId?: number | null) =>
  useQuery({
    queryKey: ["dentistas", servicioId ?? null],
    queryFn: () => api<Dentista[]>("/dentistas/", { query: { servicio: servicioId ?? undefined } }),
  });
