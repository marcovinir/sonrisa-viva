import { Link } from "react-router";

export function PaginaSimple({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-marfil p-6 text-center text-tinta">
      <div className="flex max-w-md flex-col items-center gap-4">
        <h1 className="font-serif text-5xl font-medium">{titulo}</h1>
        <p className="text-texto-2">{texto}</p>
        <Link to="/" className="font-semibold text-petroleo underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
