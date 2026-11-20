import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { crearQueryClient } from "./queryClient";

export function Providers({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [qc] = useState(() => client ?? crearQueryClient());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
