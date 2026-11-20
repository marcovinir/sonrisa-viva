import { Diente } from "./Diente";

export function Logo({
  variante = "oscuro",
  compacto = false,
}: {
  variante?: "oscuro" | "claro";
  compacto?: boolean;
}) {
  const texto = variante === "oscuro" ? "text-tinta" : "text-marfil";
  const sub = variante === "oscuro" ? "text-dorado-texto" : "text-arena-claro";
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-full bg-tinta ${compacto ? "size-10" : "size-[46px]"}`}
      >
        <Diente tamano={compacto ? 22 : 26} trazo="#D9BC8C" sonrisa />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif font-semibold tracking-[0.5px] ${texto} ${compacto ? "text-[25px]" : "text-[30px]"}`}
        >
          Sonrisa Viva
        </span>
        <span className={`mt-1 text-[10px] font-semibold tracking-[3px] ${sub}`}>
          CLÍNICA DENTAL
        </span>
      </span>
    </span>
  );
}
