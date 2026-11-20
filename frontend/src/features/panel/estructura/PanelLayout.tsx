import { useEffect } from "react";
import { Outlet } from "react-router";
import { AvisosProvider } from "../ui/Avisos";
import { BarraLateral } from "./BarraLateral";
import { RutaPanel } from "./RutaPanel";

export function PanelLayout() {
  useEffect(() => {
    document.title = "Panel · Sonrisa Viva";
  }, []);
  return (
    <RutaPanel>
      <AvisosProvider>
        <div className="flex min-h-screen flex-col bg-panel font-sans text-tinta lg:flex-row">
          <BarraLateral />
          <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-7">
            <Outlet />
          </main>
        </div>
      </AvisosProvider>
    </RutaPanel>
  );
}
