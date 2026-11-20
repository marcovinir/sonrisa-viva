import { createBrowserRouter } from "react-router";
import { PaginaSimple } from "./paginas/PaginaSimple";

export const rutas = [
  {
    path: "/",
    element: <PaginaSimple titulo="Sonrisa Viva" texto="Sitio en construcción." />,
  },
  {
    path: "/panel/*",
    element: (
      <PaginaSimple
        titulo="Panel en construcción"
        texto="El panel de la clínica llega en el Plan 4."
      />
    ),
  },
  {
    path: "*",
    element: (
      <PaginaSimple
        titulo="No encontramos esta página"
        texto="Puede que el enlace esté incompleto o que la página ya no exista."
      />
    ),
  },
];

export const crearRouter = () => createBrowserRouter(rutas);
