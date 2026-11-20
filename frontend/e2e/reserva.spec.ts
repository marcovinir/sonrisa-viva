import { expect, test } from "@playwright/test";

test("reserva completa de principio a fin", async ({ page }) => {
  const correo = `e2e+${Date.now()}@sonrisaviva.test`;
  await page.goto("/reservar");

  await page.getByRole("button", { name: "Elegir Limpieza dental" }).click();
  await page.getByText("Cualquiera disponible").click();

  // Primer día con horas libres; si este mes ya no tiene, el siguiente.
  const libres = page.locator("button[data-dia]:not([aria-disabled])");
  await page.locator("button[data-dia]").first().waitFor();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  if ((await libres.count()) === 0) {
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  }
  await libres.first().click();

  const hora = page.locator('[role="group"] button[aria-pressed="false"]').filter({
    hasText: /\d:\d\d [ap]\. m\./,
  });
  await hora.first().click();

  await page.getByLabel("Nombre").fill("Prueba");
  await page.getByLabel("Apellidos").fill("Extremo a Extremo");
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Teléfono").fill("8888-8888");
  await page.getByRole("button", { name: "Confirmar la cita" }).click();

  await expect(page).toHaveURL(/\/reservar\/confirmada/);
  await expect(page.getByRole("heading", { name: "¡Listo, Prueba! Te esperamos." })).toBeVisible();
  await expect(page.getByText(correo)).toBeVisible();
});
