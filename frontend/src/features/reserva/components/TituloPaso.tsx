import { useEffect, useRef, type ReactNode } from "react";

/** Título del paso: recibe el foco al montarse para que lectores de pantalla anuncien el cambio. */
export function TituloPaso({
  children,
  descripcion,
}: {
  children: ReactNode;
  descripcion?: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="mb-6">
      <h1
        ref={ref}
        tabIndex={-1}
        className="m-0 mb-1.5 font-serif text-[36px] font-medium leading-[1.1] outline-none md:text-[44px]"
      >
        {children}
      </h1>
      {descripcion ? <p className="m-0 text-[15px] text-texto-2">{descripcion}</p> : null}
    </div>
  );
}
