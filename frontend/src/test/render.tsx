import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Providers } from "../app/providers";
import { rutas } from "../app/router";

export function clientePrueba() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
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
