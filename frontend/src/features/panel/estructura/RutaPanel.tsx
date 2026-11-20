import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Esqueleto } from "../../../shared/ui/Estado";
import { useSesion } from "../auth/useSesion";
import { primeraRuta } from "./secciones";
import { SinAcceso } from "./SinAcceso";

/** Exige sesión y, si se indican, alguno de los permisos. */
export function RutaPanel({
  permisos = [],
  children,
}: {
  permisos?: string[];
  children: ReactNode;
}) {
  const { yo, cargando, puedeAlguno } = useSesion();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="p-8" aria-busy="true">
        <Esqueleto className="h-10 w-64" />
      </div>
    );
  }
  if (!yo) {
    const siguiente = encodeURIComponent(ubicacion.pathname + ubicacion.search);
    return <Navigate to={`/panel/login?siguiente=${siguiente}`} replace />;
  }
  if (!puedeAlguno(permisos)) return <SinAcceso />;
  return <>{children}</>;
}

export function IrAPrimeraSeccion() {
  const { yo } = useSesion();
  return <Navigate to={primeraRuta(yo)} replace />;
}
