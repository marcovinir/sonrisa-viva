import { createContext, useContext } from "react";

export type TipoAviso = "exito" | "error" | "info";
export type ContextoAvisos = { mostrar: (texto: string, tipo?: TipoAviso) => void };

export const AvisosContexto = createContext<ContextoAvisos>({ mostrar: () => {} });

export const useAviso = () => useContext(AvisosContexto);
