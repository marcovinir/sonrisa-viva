import type { CSSProperties, ReactNode } from "react";

export type Columna<T> = {
  clave: string;
  titulo: string;
  alinear?: "izq" | "der";
  celda: (fila: T) => ReactNode;
};

export function Tabla<T>({
  columnas,
  filas,
  clave,
  vacio,
  etiqueta,
  onFila,
  filaActiva,
  pie,
}: {
  columnas: Columna<T>[];
  filas: T[];
  clave: (fila: T) => string | number;
  vacio: ReactNode;
  etiqueta: string;
  onFila?: (fila: T) => void;
  filaActiva?: string | number | null;
  pie?: ReactNode;
}) {
  return (
    <section
      aria-label={etiqueta}
      className="overflow-hidden rounded-[18px] border border-borde bg-white"
    >
      {filas.length === 0 ? (
        <div className="p-6">{vacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#FAF8F3] text-left text-xs tracking-[1px] text-texto-2">
                {columnas.map((c) => (
                  <th
                    key={c.clave}
                    scope="col"
                    className={`px-4 py-3.5 font-bold ${c.alinear === "der" ? "text-right" : ""}`}
                  >
                    {c.titulo.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const k = clave(f);
                return (
                  <tr
                    key={k}
                    onClick={onFila ? () => onFila(f) : undefined}
                    className={`animar-in border-t border-[#F1EEE8] transition-colors hover:bg-[#FAF8F3] ${onFila ? "cursor-pointer" : ""} ${
                      filaActiva === k ? "bg-[#F3F8F9] shadow-[inset_4px_0_0_#13505F]" : ""
                    }`}
                    style={{ "--retraso": `${Math.min(i, 10) * 30}ms` } as CSSProperties}
                  >
                    {columnas.map((c) => (
                      <td
                        key={c.clave}
                        className={`px-4 py-3 ${c.alinear === "der" ? "text-right" : ""}`}
                      >
                        {c.celda(f)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pie}
    </section>
  );
}
