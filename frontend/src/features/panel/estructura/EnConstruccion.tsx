import { EncabezadoPagina } from "../ui/EncabezadoPagina";

/** Marcador temporal de una sección mientras se construye (lo reemplazan las tareas del Plan 4). */
export function EnConstruccion({ titulo }: { titulo: string }) {
  return <EncabezadoPagina titulo={titulo} descripcion="Esta sección se está construyendo." />;
}
