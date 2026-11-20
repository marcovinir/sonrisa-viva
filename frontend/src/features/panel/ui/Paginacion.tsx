export function Paginacion({
  pagina,
  total,
  porPagina = 20,
  onCambiar,
}: {
  pagina: number;
  total: number;
  porPagina?: number;
  onCambiar: (p: number) => void;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  const visibles = Array.from({ length: paginas }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === paginas || Math.abs(p - pagina) <= 1,
  );
  const boton = "size-10 rounded-[10px] border text-sm font-semibold disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F1EEE8] px-4 py-3.5 text-[13px] text-texto-2">
      <span>
        Mostrando {desde}–{hasta} de {total}
      </span>
      {paginas > 1 ? (
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => onCambiar(pagina - 1)}
            className={`${boton} border-[#CFC3AE] bg-white`}
          >
            ‹
          </button>
          {visibles.map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === pagina ? "page" : undefined}
              onClick={() => onCambiar(p)}
              className={`${boton} ${p === pagina ? "border-tinta bg-tinta text-white" : "border-[#CFC3AE] bg-white"}`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            aria-label="Página siguiente"
            disabled={pagina >= paginas}
            onClick={() => onCambiar(pagina + 1)}
            className={`${boton} border-[#CFC3AE] bg-white`}
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
