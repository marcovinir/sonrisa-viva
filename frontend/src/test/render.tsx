import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Providers } from "../app/providers";
import { crearQueryClient } from "../app/queryClient";
import { rutas } from "../app/router";

export function clientePrueba() {
  return crearQueryClient({ pruebas: true });
}

/** Renderiza la app completa en la ruta indicada (con todas las rutas reales). */
export function renderEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const utils = render(
    <Providers client={clientePrueba()}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...utils, router };
}
