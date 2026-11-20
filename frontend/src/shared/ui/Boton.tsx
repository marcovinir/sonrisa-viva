import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { clasesBoton, type Tamano, type Variante } from "./estilosBoton";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animar-girar size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <circle cx="12" cy="12" r="9" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}

type PropsComunes = {
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
  children: ReactNode;
};

type PropsBoton = PropsComunes &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    cargando?: boolean;
    textoCargando?: string;
  };

export function Boton({
  variante,
  tamano,
  className,
  children,
  cargando = false,
  textoCargando = "Un momento…",
  disabled,
  type = "button",
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type}
      className={clasesBoton(variante, tamano, className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? (
        <>
          <Spinner />
          {textoCargando}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function BotonEnlace({
  variante,
  tamano,
  className,
  children,
  ...resto
}: PropsComunes & LinkProps) {
  return (
    <Link className={clasesBoton(variante, tamano, className)} {...resto}>
      {children}
    </Link>
  );
}
