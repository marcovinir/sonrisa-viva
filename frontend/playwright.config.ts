import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de Sonrisa Viva.
 * - Local y CI: levanta el backend (runserver 8000) y `vite preview` (4173, con /api → 8000).
 * - Producción: `E2E_URL=https://sonrisa.marcovinir.dev npm run e2e -- panel.spec.ts`.
 */
const remoto = process.env.E2E_URL;
const python = process.env.E2E_PYTHON ?? "python";

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: remoto ?? "http://localhost:4173",
    locale: "es-CR",
    timezoneId: "America/Costa_Rica",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: remoto
    ? undefined
    : [
        {
          command: `${python} -X utf8 manage.py runserver 8000 --noreload`,
          cwd: "../backend",
          url: "http://localhost:8000/api/v1/salud/",
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: "npm run build && npm run preview -- --port 4173 --strictPort",
          url: "http://localhost:4173",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
