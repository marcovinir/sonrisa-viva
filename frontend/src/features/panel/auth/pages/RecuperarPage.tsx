import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Campo } from "../../../../shared/ui/Campo";
import { useRecuperar } from "../api";
import { recuperarEsquema, type RecuperarFormulario } from "../esquemas";
import { AlertaCuenta, EncabezadoCuenta, MarcoCuenta } from "./MarcoCuenta";

const DECORATIVO = {
  titulo: "Te ayudamos",
  destacado: "a volver.",
  texto: "Te enviamos un enlace al correo para que elijas una contraseña nueva.",
};

export function RecuperarPage() {
  const recuperar = useRecuperar();
  const [enviado, setEnviado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarFormulario>({
    resolver: zodResolver(recuperarEsquema),
    defaultValues: { email: "" },
  });

  const enviar = handleSubmit((datos) => {
    setErrorGeneral(null);
    recuperar.mutate(datos, {
      onSuccess: () => setEnviado(true),
      onError: (error) =>
        setErrorGeneral(
          error instanceof ApiError
            ? error.detalle
            : "No pudimos enviar el enlace. Intenta de nuevo.",
        ),
    });
  });

  return (
    <MarcoCuenta tituloPestana="Recuperar contraseña" decorativo={DECORATIVO}>
      {enviado ? (
        <>
          <EncabezadoCuenta
            titulo="Revisa tu correo"
            texto="Si el correo está registrado, te enviamos un enlace para restablecer la contraseña."
          />
          <p className="m-0 text-sm text-texto-2">
            Puede tardar unos minutos. Revisa también la carpeta de correo no deseado.
          </p>
        </>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
          <EncabezadoCuenta
            titulo="Recuperar contraseña"
            texto="Escribe el correo con el que entras al panel y te enviamos un enlace."
          />
          {errorGeneral ? <AlertaCuenta>{errorGeneral}</AlertaCuenta> : null}
          <Campo
            id="correo"
            etiqueta="Correo"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Boton type="submit" tamano="lg" cargando={recuperar.isPending} textoCargando="Enviando…">
            Enviar enlace
          </Boton>
        </form>
      )}
      <Link to="/panel/login" className="py-2 text-center text-sm font-semibold text-petroleo">
        ← Volver a iniciar sesión
      </Link>
    </MarcoCuenta>
  );
}
