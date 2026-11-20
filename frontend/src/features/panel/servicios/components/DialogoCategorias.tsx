import { useState, type FormEvent } from "react";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Dialogo } from "../../ui/Dialogo";
import { useAviso } from "../../ui/avisosContexto";
import { useBorrarCategoria, useGuardarCategoria, type CategoriaPanel } from "../api";

const CONTROL =
  "min-h-11 w-full min-w-0 rounded-xl border-[1.5px] border-[#CFC3AE] bg-white px-3 text-sm font-medium text-tinta " +
  "focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none";
const ICONO =
  "flex size-11 shrink-0 items-center justify-center rounded-xl border border-borde bg-white text-base disabled:opacity-35";

const mensaje = (e: unknown, otro: string) => (e instanceof ApiError ? e.detalle : otro);

function FilaCategoria({
  categoria,
  primera,
  ultima,
  onMover,
  onError,
}: {
  categoria: CategoriaPanel;
  primera: boolean;
  ultima: boolean;
  onMover: (direccion: -1 | 1) => void;
  onError: (texto: string | null) => void;
}) {
  const guardar = useGuardarCategoria();
  const borrar = useBorrarCategoria();
  const { mostrar } = useAviso();
  const [nombre, setNombre] = useState(categoria.nombre);
  const [confirmar, setConfirmar] = useState(false);

  const renombrar = () => {
    const limpio = nombre.trim();
    if (!limpio || limpio === categoria.nombre) {
      setNombre(categoria.nombre);
      return;
    }
    guardar.mutate(
      { id: categoria.id, datos: { nombre: limpio } },
      {
        onSuccess: () => mostrar("Categoría renombrada"),
        onError: (e) => onError(mensaje(e, "No pudimos renombrar la categoría.")),
      },
    );
  };

  const confirmarBorrado = () =>
    borrar.mutate(categoria.id, {
      onSuccess: () => {
        onError(null);
        mostrar("Categoría borrada");
      },
      onError: (e) => onError(mensaje(e, "No pudimos borrar la categoría.")),
      onSettled: () => setConfirmar(false),
    });

  return (
    <li className="flex flex-wrap items-center gap-2 border-t border-[#F1EEE8] py-2.5 first:border-t-0">
      <input
        aria-label={`Nombre de la categoría ${categoria.nombre}`}
        value={nombre}
        maxLength={60}
        onChange={(e) => setNombre(e.target.value)}
        onBlur={renombrar}
        className={`${CONTROL} flex-[1_1_160px]`}
      />
      {confirmar ? (
        <span className="flex items-center gap-1.5">
          <Boton
            variante="peligro"
            className="min-h-11 px-4! py-0! text-sm!"
            aria-label={`Sí, borrar ${categoria.nombre}`}
            onClick={confirmarBorrado}
            cargando={borrar.isPending}
            textoCargando="Borrando…"
          >
            Sí, borrar
          </Boton>
          <Boton
            variante="claro"
            className="min-h-11 px-4! py-0! text-sm!"
            onClick={() => setConfirmar(false)}
          >
            No
          </Boton>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Subir ${categoria.nombre}`}
            disabled={primera}
            onClick={() => onMover(-1)}
            className={ICONO}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Bajar ${categoria.nombre}`}
            disabled={ultima}
            onClick={() => onMover(1)}
            className={ICONO}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label={`Borrar ${categoria.nombre}`}
            onClick={() => setConfirmar(true)}
            className={`${ICONO} text-peligro`}
          >
            ×
          </button>
        </span>
      )}
    </li>
  );
}

/** Crear, renombrar, ordenar y borrar las categorías del catálogo. */
export function DialogoCategorias({
  abierto,
  categorias,
  onCerrar,
}: {
  abierto: boolean;
  categorias: CategoriaPanel[];
  onCerrar: () => void;
}) {
  const guardar = useGuardarCategoria();
  const { mostrar } = useAviso();
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string | null>(null);
  const orden = [...categorias].sort((a, b) => a.orden - b.orden || a.id - b.id);

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    const nombre = nueva.trim();
    if (!nombre) return;
    guardar.mutate(
      { datos: { nombre, orden: Math.max(0, ...orden.map((c) => c.orden)) + 1 } },
      {
        onSuccess: () => {
          setNueva("");
          setError(null);
          mostrar("Categoría creada");
        },
        onError: (err) => setError(mensaje(err, "No pudimos crear la categoría.")),
      },
    );
  };

  /** Intercambia el orden con la vecina (los números se renumeran 1, 2, 3…). */
  const mover = (indice: number, direccion: -1 | 1) => {
    const lista = [...orden];
    const destino = indice + direccion;
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    lista.forEach((c, i) => {
      if (c.orden !== i + 1) guardar.mutate({ id: c.id, datos: { orden: i + 1 } });
    });
  };

  return (
    <Dialogo abierto={abierto} titulo="Categorías" onCerrar={onCerrar}>
      <div className="flex flex-col gap-4 text-tinta">
        <p className="m-0 text-texto-2">
          Agrupan los servicios en la web. El orden de esta lista es el orden en que se muestran.
        </p>
        {error ? (
          <p
            role="alert"
            className="animar-temblor m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3 text-sm font-semibold text-peligro"
          >
            {error}
          </p>
        ) : null}
        <ul className="m-0 list-none p-0">
          {orden.map((c, i) => (
            <FilaCategoria
              key={c.id}
              categoria={c}
              primera={i === 0}
              ultima={i === orden.length - 1}
              onMover={(d) => mover(i, d)}
              onError={setError}
            />
          ))}
        </ul>
        <form
          onSubmit={agregar}
          className="flex flex-wrap items-end gap-2 border-t border-borde pt-4"
        >
          <div className="flex flex-[1_1_200px] flex-col gap-1.5">
            <label htmlFor="categoria-nueva" className="text-sm font-bold">
              Nueva categoría
            </label>
            <input
              id="categoria-nueva"
              value={nueva}
              maxLength={60}
              onChange={(e) => setNueva(e.target.value)}
              className={CONTROL}
            />
          </div>
          <Boton type="submit" cargando={guardar.isPending} textoCargando="Agregando…">
            Agregar
          </Boton>
        </form>
      </div>
    </Dialogo>
  );
}
