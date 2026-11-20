import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton, BotonEnlace } from "../../../../shared/ui/Boton";
import { Campo } from "../../../../shared/ui/Campo";
import { useEstablecerContrasena, type ModoContrasena } from "../api";
import { AYUDA_CONTRASENA, contrasenaEsquema, type ContrasenaFormulario } from "../esquemas";
import { AlertaCuenta, EncabezadoCuenta, MarcoCuenta } from "./MarcoCuenta";

const ENLACE_INVALIDO = "El enlace no es válido o ya fue usado.";

const TEXTOS: Record<
  ModoContrasena,
  { pestana: string; titulo: string; texto: string; boton: string; cargando: string }
> = {
  activar: {
    pestana: "Activar cuenta",
    titulo: "Activa tu cuenta",
    texto: "Elige la contraseña con la que vas a entrar al panel de la clínica.",
    boton: "Activar cuenta",
    cargando: "Activando…",
  },
  restablecer: {
    pestana: "Restablecer contraseña",
    titulo: "Elige una contraseña nueva",
    texto: "La anterior deja de funcionar en cuanto guardes esta.",
    boton: "Guardar contraseña",
    cargando: "Guardando…",
  },
};

const DECORATIVOS: Record<ModoContrasena, { titulo: string; destacado: string; texto: string }> = {
  activar: {
    titulo: "Ya casi",
    destacado: "estás dentro.",
    texto: "Un paso más y tienes tu agenda de Sonrisa Viva lista.",
  },
  restablecer: {
    titulo: "Una contraseña",
    destacado: "nueva.",
    texto: "Elígela y vuelve a tu agenda en un momento.",
  },
};

/** Formulario de contraseña nueva para /panel/activar/… y /panel/restablecer/…. */
export function ActivarPage({ modo }: { modo: ModoContrasena }) {
  const { uid = "", token = "" } = useParams();
  const textos = TEXTOS[modo];
  const decorativo = DECORATIVOS[modo];
  const enviarClave = useEstablecerContrasena(modo);
  const [estado, setEstado] = useState<"formulario" | "listo" | "invalido">("formulario");
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContrasenaFormulario>({
    resolver: zodResolver(contrasenaEsquema),
    defaultValues: { password: "", confirmar: "" },
  });

  const enviar = handleSubmit(({ password }) => {
    setErrorGeneral(null);
    enviarClave.mutate(
      { uid, token, password },
      {
        onSuccess: () => setEstado("listo"),
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            setErrorGeneral("No pudimos guardar la contraseña. Intenta de nuevo.");
          } else if (error.detalle === ENLACE_INVALIDO) {
            setEstado("invalido");
          } else if (error.campos.password?.length) {
            setError(
              "password",
              { message: error.campos.password.join(" ") },
              { shouldFocus: true },
            );
          } else {
            setErrorGeneral(error.detalle);
          }
        },
      },
    );
  });

  if (estado === "listo") {
    return (
      <MarcoCuenta tituloPestana={textos.pestana} decorativo={decorativo}>
        <EncabezadoCuenta
          titulo="Listo, ya puedes entrar"
          texto="Tu contraseña quedó guardada. Inicia sesión con tu correo y la contraseña nueva."
        />
        <BotonEnlace to="/panel/login" tamano="lg">
          Iniciar sesión
        </BotonEnlace>
      </MarcoCuenta>
    );
  }

  if (estado === "invalido") {
    return (
      <MarcoCuenta tituloPestana={textos.pestana} decorativo={decorativo}>
        <EncabezadoCuenta
          titulo="Este enlace ya no sirve"
          texto="Los enlaces del correo se usan una sola vez y vencen a los pocos días. Si ya elegiste tu contraseña, inicia sesión; si no, pide un enlace nuevo."
        />
        <BotonEnlace to="/panel/recuperar" tamano="lg">
          Pedir un enlace nuevo
        </BotonEnlace>
        <Link
          to="/panel/login"
          className="flex min-h-11 items-center justify-center text-sm font-semibold text-petroleo"
        >
          Ir a iniciar sesión
        </Link>
      </MarcoCuenta>
    );
  }

  return (
    <MarcoCuenta tituloPestana={textos.pestana} decorativo={decorativo}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <EncabezadoCuenta titulo={textos.titulo} texto={textos.texto} />
        {errorGeneral ? <AlertaCuenta>{errorGeneral}</AlertaCuenta> : null}
        <Campo
          id="clave-nueva"
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          ayuda={AYUDA_CONTRASENA}
          error={errors.password?.message}
          {...register("password")}
        />
        <Campo
          id="clave-confirmar"
          etiqueta="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register("confirmar")}
        />
        <Boton
          type="submit"
          tamano="lg"
          cargando={enviarClave.isPending}
          textoCargando={textos.cargando}
        >
          {textos.boton}
        </Boton>
      </form>
    </MarcoCuenta>
  );
}
