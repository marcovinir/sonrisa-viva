import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { servidor } from "./servidor";

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
