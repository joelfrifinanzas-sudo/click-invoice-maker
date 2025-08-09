import { test, expect, Page } from '@playwright/test';

async function failOnConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return {
    assertNoErrors: async () => {
      expect.soft(errors, errors.join('\n')).toHaveLength(0);
    },
  };
}

async function openLauncher(page: Page) {
  await page.getByRole('button', { name: 'Módulos' }).click();
  // Espera a que el grid esté visible
  await expect(page.getByRole('grid', { name: 'Launcher de módulos' })).toBeVisible();
}

async function closeLauncher(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('grid', { name: 'Launcher de módulos' })).toBeHidden({ timeout: 5000 });
}

// --- Tests ---

test.describe('Header launcher & avatar menu', () => {
  test('abre y cierra el launcher (ESC) sin errores de consola', async ({ page }) => {
    const guard = await failOnConsoleErrors(page);
    await page.goto('/inicio');
    await openLauncher(page);
    await closeLauncher(page);
    await guard.assertNoErrors();
  });

  test('navega a 3 módulos desde el launcher', async ({ page }) => {
    const guard = await failOnConsoleErrors(page);
    await page.goto('/inicio');

    // 1) Nueva factura
    await openLauncher(page);
    await page.getByRole('button', { name: 'Nueva factura' }).click();
    await expect(page).toHaveURL(/\/crear-factura$/);

    // 2) Clientes
    await page.goto('/inicio');
    await openLauncher(page);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await expect(page).toHaveURL(/\/clientes$/);

    // 3) Inventario
    await page.goto('/inicio');
    await openLauncher(page);
    await page.getByRole('button', { name: 'Inventario' }).click();
    await expect(page).toHaveURL(/\/inventario$/);

    await guard.assertNoErrors();
  });

  test('filtra módulos por rol: cajero no ve Inventario', async ({ page }) => {
    const guard = await failOnConsoleErrors(page);

    await page.addInitScript(() => {
      window.localStorage.setItem('user-role', 'cajero');
    });

    await page.goto('/inicio');
    await openLauncher(page);

    await expect(page.getByRole('button', { name: 'Pagos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inventario' })).toHaveCount(0);

    await guard.assertNoErrors();
  });

  test('abre menú del avatar y cierra sesión simulada', async ({ page }) => {
    const guard = await failOnConsoleErrors(page);
    await page.goto('/inicio');

    const before = page.url();

    // Abrir menú del avatar
    await page.locator('#testid\\:hdr-user').click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Click en "Cerrar sesión"
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();

    // Menú debe cerrarse y URL mantenerse
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(before);

    await guard.assertNoErrors();
  });
});
