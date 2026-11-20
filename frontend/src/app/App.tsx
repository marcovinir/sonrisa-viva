import { useState } from "react";
import { RouterProvider } from "react-router";
import { Providers } from "./providers";
import { crearRouter } from "./router";

export function App() {
  const [router] = useState(crearRouter);
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
