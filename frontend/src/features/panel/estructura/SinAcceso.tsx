import { BotonEnlace } from "../../../shared/ui/Boton";
import { Diente } from "../../../shared/ui/Diente";
import { useSesion } from "../auth/useSesion";
import { nombreSeccion, seccionesDe } from "./secciones";

export function SinAcceso() {
  const { yo } = useSesion();
  const primera = seccionesDe(yo)[0];
  return (
    <section className="flex max-w-lg flex-col items-start gap-4 py-10">
      <Diente tamano={40} trazo="#B8935A" />
      <h1 className="m-0 font-serif text-[40px] font-medium leading-tight">
        No tienes acceso a esta sección
      </h1>
      <p className="m-0 text-texto-2">Tu cuenta no tiene permiso para ver esta parte del panel.</p>
      {primera ? (
        <BotonEnlace to={`/panel/${primera.ruta}`}>Ir a {nombreSeccion(primera, yo)}</BotonEnlace>
      ) : null}
    </section>
  );
}
