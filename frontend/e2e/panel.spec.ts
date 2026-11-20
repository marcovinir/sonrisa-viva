import { expect, type Page, test } from "@playwright/test";

// La clave de los usuarios de demostración (manage.py sembrar).
const CLAVE = process.env.SEMILLA_ADMIN_PASSWORD ?? "Demo-Sonrisa-2026";

async function entrar(page: Page, correo: string, destino = "/panel") {
  await page.goto(destino);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("login del panel y recarga de ruta profunda", async ({ page }) => {
  await entrar(page, "admin@sonrisaviva.test");
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Panel" })
    .getByRole("link", { name: "Citas" })
    .click();
  await expect(page).toHaveURL(/\/panel\/citas$/);
  // Recargar una ruta del panel no debe dar 404 (fallback de la SPA) ni perder la sesión.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Citas", level: 1 })).toBeVisible();
});

test("el dentista solo ve su agenda", async ({ page }) => {
  await entrar(page, "laura.vargas@sonrisaviva.test");
  await expect(page.getByRole("heading", { name: "Mi agenda", level: 1 })).toBeVisible();
  const enlaces = page.getByRole("navigation", { name: "Panel" }).getByRole("link");
  await expect(enlaces).toHaveText(["Mi agenda", "Mis citas"]);
});
