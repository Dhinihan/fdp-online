import { expect, test } from '@playwright/test';

test('vira a carta placeholder ao clicar e mantém o verso ao final', async ({ page }) => {
  await page.goto('/');

  const quadro = page.locator('canvas');
  await expect(quadro).toBeVisible();

  await expect(quadro).toHaveScreenshot('carta-placeholder-inicial.png');

  const caixa = await quadro.boundingBox();
  if (!caixa) throw new Error('Canvas não encontrado para interação.');

  await page.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  await page.waitForTimeout(400);

  await expect(quadro).toHaveScreenshot('carta-placeholder-virada.png');
});
