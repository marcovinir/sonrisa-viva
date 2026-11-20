import { Link } from "react-router";
import { Diente } from "../../../shared/ui/Diente";

export function PiePagina() {
  return (
    <footer className="bg-tinta text-[#C9D6D9]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-8 px-5 pb-10 pt-14 md:px-8">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5 font-serif text-[30px] font-semibold text-marfil">
            <Diente tamano={28} trazo="#D9BC8C" grosor={1.5} />
            Sonrisa Viva
          </span>
          <span className="text-sm">Clínica dental · San José, Costa Rica</span>
        </div>
        <div className="flex flex-wrap gap-12 text-sm">
          <div className="flex flex-col gap-2.5">
            <strong className="text-marfil">Horario</strong>
            <span>Lun a vie 8:00–17:00</span>
            <span>Sábado 8:00–12:00</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <strong className="text-marfil">Síguenos</strong>
            <a href="#contacto" className="text-[#C9D6D9] hover:text-white">
              Instagram
            </a>
            <a href="#contacto" className="text-[#C9D6D9] hover:text-white">
              Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 border-t border-[#2B525C] px-5 pb-7 pt-5 text-[13px] md:px-8">
        <span>© 2026 Clínica Dental Sonrisa Viva · Proyecto de portafolio</span>
        <Link to="/panel/login" className="text-[#C9D6D9] hover:text-white">
          Acceso personal
        </Link>
      </div>
    </footer>
  );
}
