import { NavLink } from "react-router";
import { Diente } from "../../../shared/ui/Diente";
import { useLogout } from "../auth/api";
import { useSesion } from "../auth/useSesion";
import { nombreSeccion, seccionesDe } from "./secciones";

export function BarraLateral() {
  const { yo } = useSesion();
  const logout = useLogout();
  const secciones = seccionesDe(yo);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 bg-tinta px-4 py-5 text-[#C9D6D9] lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:gap-7 lg:py-7">
      <div className="flex items-center gap-2.5 px-2.5">
        <Diente tamano={26} trazo="#D9BC8C" />
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[25px] font-semibold text-marfil">Sonrisa Viva</span>
          <span className="mt-1 text-[9px] font-bold tracking-[2.5px] text-arena-claro">PANEL</span>
        </span>
      </div>
      <nav
        aria-label="Panel"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 text-[15px] font-semibold lg:flex-col lg:overflow-visible"
      >
        {secciones.map((s, i) => (
          <NavLink
            key={s.ruta}
            to={`/panel/${s.ruta}`}
            className={({ isActive }) =>
              `animar-entrada flex min-h-11 shrink-0 items-center rounded-xl px-3.5 no-underline transition-[background-color,color,transform] duration-200 ${
                isActive
                  ? "bg-[#1E4A55] text-white"
                  : "text-[#C9D6D9] hover:bg-[#17414B] hover:text-white motion-safe:hover:translate-x-1"
              }`
            }
            style={{ ["--retraso" as string]: `${i * 40}ms` }}
          >
            {nombreSeccion(s, yo)}
          </NavLink>
        ))}
      </nav>
      {yo ? (
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#17414B] p-3.5 lg:mt-auto lg:flex-col lg:items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-marfil">
              {yo.nombre} {yo.apellidos}
            </span>
            <span className="text-xs">{yo.rol === "admin" ? "Administración" : "Dentista"}</span>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="min-h-11 text-left text-[13px] font-semibold text-arena-claro hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </aside>
  );
}
