import type { ButtonHTMLAttributes } from "react";

export function Chip({
  activo = false,
  className = "",
  ...resto
}: { activo?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const estado = activo
    ? "border-tinta bg-tinta text-white"
    : "border-[#CFC3AE] bg-transparent text-tinta hover:border-tinta";
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={`min-h-11 rounded-full border-[1.5px] px-[18px] text-sm font-semibold transition-[background-color,border-color,transform] duration-200 motion-safe:hover:-translate-y-px ${estado} ${className}`}
      {...resto}
    />
  );
}
