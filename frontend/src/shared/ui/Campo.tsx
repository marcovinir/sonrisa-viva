import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from "react";

type Comun = {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  className?: string;
};

type PropsInput = Comun & {
  as?: "input";
  ref?: Ref<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>;
type PropsArea = Comun & {
  as: "textarea";
  ref?: Ref<HTMLTextAreaElement>;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

const CONTROL =
  "w-full rounded-xl border-[1.5px] bg-white px-3.5 font-medium text-tinta transition-[border-color,box-shadow] " +
  "duration-200 hover:border-[#8FA4AA] focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none";

export function Campo(props: PropsInput | PropsArea) {
  const { id, etiqueta, error, ayuda, className = "", as, ...resto } = props;
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const describe =
    [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(" ") || undefined;
  const borde = error ? "border-error animar-temblor" : "border-[#CFC3AE]";
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": describe };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold">
        {etiqueta}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          className={`${CONTROL} ${borde} py-2.5`}
          {...aria}
          {...(resto as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          className={`${CONTROL} ${borde} min-h-12`}
          {...aria}
          {...(resto as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? (
        <p id={idError} className="m-0 text-[13px] font-semibold text-error">
          {error}
        </p>
      ) : null}
      {ayuda ? (
        <p id={idAyuda} className="m-0 text-[13px] text-texto-3">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
