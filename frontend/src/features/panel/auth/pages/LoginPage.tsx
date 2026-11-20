import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ApiError } from "../../../../shared/api/cliente";
import { Boton } from "../../../../shared/ui/Boton";
import { Campo } from "../../../../shared/ui/Campo";
import { destinoSeguro } from "../../estructura/secciones";
import { useLogin } from "../api";
import { useSesion } from "../useSesion";
import { PanelDecorativo } from "./PanelDecorativo";

export function LoginPage() {
  const { yo, cargando } = useSesion();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);

  useEffect(() => {
    document.title = "Iniciar sesión · Panel Sonrisa Viva";
  }, []);

  if (!cargando && yo && !login.isSuccess)
    return <Navigate to={destinoSeguro(params.get("siguiente"), yo)} replace />;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (nuevo) =>
          navigate(destinoSeguro(params.get("siguiente"), nuevo), { replace: true }),
      },
    );
  };

  const error =
    login.error instanceof ApiError
      ? login.error.detalle
      : login.error
        ? "No pudimos iniciar sesión. Intenta de nuevo."
        : null;

  return (
    <div className="flex min-h-screen flex-wrap bg-marfil font-sans text-tinta">
      <PanelDecorativo
        titulo="Tu agenda,"
        destacado="en orden."
        texto="Citas, horarios y reportes de la clínica en un solo lugar."
      />
      <section className="flex flex-[1_1_480px] items-center justify-center px-8 py-14">
        <form onSubmit={enviar} noValidate className="flex w-full max-w-[400px] flex-col gap-5">
          <div className="animar-entrada">
            <h1 className="m-0 font-serif text-[40px] font-medium">Iniciar sesión</h1>
            <p className="m-0 mt-1.5 text-[15px] text-texto-2">
              Usa el correo con el que te registró la clínica.
            </p>
          </div>
          {error ? (
            <p
              role="alert"
              className="animar-temblor m-0 rounded-xl border-[1.5px] border-[#E2B9B5] bg-[#FBF1F0] px-4 py-3.5 text-sm font-semibold text-peligro"
            >
              {error}
            </p>
          ) : null}
          <Campo
            id="correo"
            etiqueta="Correo"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="clave" className="text-sm font-bold">
                Contraseña
              </label>
              <Link to="/panel/recuperar" className="text-[13px] font-semibold text-petroleo">
                ¿La olvidaste?
              </Link>
            </div>
            <div className="relative">
              <input
                id="clave"
                type={ver ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 w-full rounded-xl border-[1.5px] border-[#CFC3AE] bg-white pl-3.5 pr-14 font-medium transition-[border-color,box-shadow] hover:border-[#8FA4AA] focus:shadow-[0_0_0_4px_rgba(19,80,95,.12)] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Mostrar contraseña"
                aria-pressed={ver}
                onClick={() => setVer((v) => !v)}
                className="absolute right-0.5 top-0.5 flex size-11 items-center justify-center"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#45555C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {ver ? <path d="M3 3l18 18" /> : null}
                </svg>
              </button>
            </div>
          </div>
          <Boton type="submit" tamano="lg" cargando={login.isPending} textoCargando="Entrando…">
            Entrar
          </Boton>
          <Link to="/" className="py-2 text-center text-sm font-semibold text-petroleo">
            ← Volver al sitio
          </Link>
        </form>
      </section>
    </div>
  );
}
