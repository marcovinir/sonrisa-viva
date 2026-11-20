import { lazy, Suspense, type ComponentType } from "react";
import type { RouteObject } from "react-router";
import { ActivarPage } from "./auth/pages/ActivarPage";
import { LoginPage } from "./auth/pages/LoginPage";
import { RecuperarPage } from "./auth/pages/RecuperarPage";
import { CargandoSeccion } from "./estructura/CargandoSeccion";
import { PanelLayout } from "./estructura/PanelLayout";
import { IrAPrimeraSeccion, RutaPanel } from "./estructura/RutaPanel";
import { permisosDe } from "./estructura/secciones";

/** Cada sección se descarga al entrar en ella: la web pública no carga el panel ni Recharts. */
const perezosa = <M extends Record<string, ComponentType>>(
  cargar: () => Promise<M>,
  nombre: keyof M,
) => lazy(() => cargar().then((m) => ({ default: m[nombre] })));

const AgendaPage = perezosa(() => import("./agenda/pages/AgendaPage"), "AgendaPage");
const CitasPage = perezosa(() => import("./citas/pages/CitasPage"), "CitasPage");
const ServiciosPage = perezosa(() => import("./servicios/pages/ServiciosPage"), "ServiciosPage");
const DentistasPage = perezosa(() => import("./dentistas/pages/DentistasPage"), "DentistasPage");
const UsuariosPage = perezosa(() => import("./usuarios/pages/UsuariosPage"), "UsuariosPage");
const ReportesPage = perezosa(() => import("./reportes/pages/ReportesPage"), "ReportesPage");

const seccion = (ruta: string, Pagina: ComponentType): RouteObject => ({
  path: ruta,
  element: (
    <RutaPanel permisos={permisosDe(ruta)}>
      <Suspense fallback={<CargandoSeccion />}>
        <Pagina />
      </Suspense>
    </RutaPanel>
  ),
});

export const rutasPanel: RouteObject[] = [
  { path: "/panel/login", element: <LoginPage /> },
  { path: "/panel/recuperar", element: <RecuperarPage /> },
  { path: "/panel/activar/:uid/:token", element: <ActivarPage key="activar" modo="activar" /> },
  {
    path: "/panel/restablecer/:uid/:token",
    element: <ActivarPage key="restablecer" modo="restablecer" />,
  },
  {
    path: "/panel",
    element: <PanelLayout />,
    children: [
      { index: true, element: <IrAPrimeraSeccion /> },
      seccion("agenda", AgendaPage),
      seccion("citas", CitasPage),
      seccion("servicios", ServiciosPage),
      seccion("dentistas", DentistasPage),
      seccion("usuarios", UsuariosPage),
      seccion("reportes", ReportesPage),
      { path: "*", element: <IrAPrimeraSeccion /> },
    ],
  },
];
