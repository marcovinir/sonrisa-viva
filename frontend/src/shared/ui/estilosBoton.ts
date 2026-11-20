export type Variante = "primario" | "contorno" | "dorado" | "peligro" | "claro";
export type Tamano = "md" | "lg";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold no-underline " +
  "transition-[transform,box-shadow,filter,background-color] duration-300 ease-(--ease-sv) " +
  "motion-safe:hover:-translate-y-0.5 hover:shadow-[0_14px_26px_-14px_rgba(14,47,56,.65)] " +
  "motion-safe:active:scale-[.97] active:duration-75 " +
  "disabled:cursor-not-allowed disabled:opacity-70 disabled:translate-y-0 disabled:shadow-none";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-petroleo text-white hover:brightness-110",
  contorno: "border-[1.5px] border-tinta bg-transparent text-tinta",
  dorado: "bg-arena-claro text-tinta hover:brightness-105",
  peligro: "bg-peligro text-white hover:brightness-110",
  claro: "border-[1.5px] border-[#CFC3AE] bg-white text-tinta",
};

const TAMANOS: Record<Tamano, string> = {
  md: "px-6 py-3 text-[15px]",
  lg: "px-7 py-4 text-base",
};

export function clasesBoton(variante: Variante = "primario", tamano: Tamano = "md", extra = "") {
  return [BASE, VARIANTES[variante], TAMANOS[tamano], extra].join(" ");
}
