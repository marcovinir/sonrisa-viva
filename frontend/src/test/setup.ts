import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { servidor } from "./servidor";

// Las secciones del panel se cargan con React.lazy: la primera prueba de cada archivo espera
// ese import dinámico, que en un equipo cargado puede pasar del segundo por defecto.
configure({ asyncUtilTimeout: 3000 });

// jsdom no implementa <dialog>: lo justo para showModal/close y el evento cancel con Esc.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.hasAttribute("open")) {
        this.dispatchEvent(new Event("cancel", { cancelable: true }));
      }
    };
    document.addEventListener("keydown", alTeclado);
    (this as unknown as { _quitar: () => void })._quitar = () =>
      document.removeEventListener("keydown", alTeclado);
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    (this as unknown as { _quitar?: () => void })._quitar?.();
    this.dispatchEvent(new Event("close"));
  };
}

beforeAll(() => servidor.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  try {
    window.sessionStorage.clear();
  } catch {
    /* sin almacenamiento */
  }
});
afterAll(() => servidor.close());
