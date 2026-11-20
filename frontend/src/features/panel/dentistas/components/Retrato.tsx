import { useState } from "react";

/** Foto del dentista o, si no hay o no carga, sus iniciales. */
export function Retrato({
  nombre,
  apellidos,
  foto,
  tamano = 44,
}: {
  nombre: string;
  apellidos: string;
  foto?: string;
  tamano?: number;
}) {
  const [fallo, setFallo] = useState(false);
  const iniciales = `${nombre[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
  const estilo = { width: tamano, height: tamano };
  if (foto && !fallo) {
    return (
      <img
        src={foto}
        alt=""
        onError={() => setFallo(true)}
        className="shrink-0 rounded-full object-cover"
        style={estilo}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-[#E3EEF0] font-bold text-petroleo"
      style={{ ...estilo, fontSize: tamano * 0.36 }}
    >
      {iniciales}
    </span>
  );
}
