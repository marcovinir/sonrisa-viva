import { useEffect, useRef, useState } from "react";

/** Búsqueda que aplica el filtro 350 ms después de dejar de escribir. */
export function CampoBusqueda({
  id,
  etiqueta,
  placeholder,
  valor,
  onCambiar,
  className = "",
}: {
  id: string;
  etiqueta: string;
  placeholder?: string;
  valor: string;
  onCambiar: (v: string) => void;
  className?: string;
}) {
  const [texto, setTexto] = useState(valor);
  const [previo, setPrevio] = useState(valor);
  // Si la URL cambia desde fuera (un chip, «Limpiar todo»), el campo la sigue.
  if (valor !== previo) {
    setPrevio(valor);
    setTexto(valor);
  }
  // La función cambia en cada render; la ref evita reiniciar la pausa por eso.
  const alCambiar = useRef(onCambiar);
  useEffect(() => {
    alCambiar.current = onCambiar;
  }, [onCambiar]);
  useEffect(() => {
    if (texto.trim() === valor) return;
    const t = window.setTimeout(() => alCambiar.current(texto.trim()), 350);
    return () => window.clearTimeout(t);
  }, [texto, valor]);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-bold">
        {etiqueta}
      </label>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="min-h-11 w-full rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3 text-sm font-medium text-tinta transition-[border-color,box-shadow] hover:border-[#8FA4AA] focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none"
      />
    </div>
  );
}
