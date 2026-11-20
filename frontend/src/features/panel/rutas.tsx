import type { RouteObject } from "react-router";
import { LoginPage } from "./auth/pages/LoginPage";
import { EnConstruccion } from "./estructura/EnConstruccion";
import { PanelLayout } from "./estructura/PanelLayout";
import { IrAPrimeraSeccion, RutaPanel } from "./estructura/RutaPanel";
import { permisosDe } from "./estructura/secciones";

const seccion = (ruta: string, pagina: React.ReactNode): RouteObject => ({
  path: ruta,
  element: <RutaPanel permisos={permisosDe(ruta)}>{pagina}</RutaPanel>,
});

export const rutasPanel: RouteObject[] = [
  { path: "/panel/login", element: <LoginPage /> },
  {
    path: "/panel",
    element: <PanelLayout />,
    children: [
      { index: true, element: <IrAPrimeraSeccion /> },
      seccion("agenda", <EnConstruccion titulo="Agenda" />),
      seccion("citas", <EnConstruccion titulo="Citas" />),
      seccion("servicios", <EnConstruccion titulo="Servicios" />),
      seccion("dentistas", <EnConstruccion titulo="Dentistas" />),
      seccion("usuarios", <EnConstruccion titulo="Usuarios" />),
      seccion("reportes", <EnConstruccion titulo="Reportes" />),
      { path: "*", element: <IrAPrimeraSeccion /> },
    ],
  },
];
