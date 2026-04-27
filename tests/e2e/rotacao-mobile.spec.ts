import { test, expect } from '@playwright/test';

test('carta permanece visível após rotação de portrait para landscape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForTimeout(500);

  // Simula a confusão de resizes durante rotação mobile
  await page.setViewportSize({ width: 375, height: 200 });
  await page.waitForTimeout(50);
  await page.setViewportSize({ width: 200, height: 100 });
  await page.waitForTimeout(50);
  await page.setViewportSize({ width: 667, height: 375 });
  await page.waitForTimeout(500);

  const screenshot = await page.screenshot();
  expect(screenshot).toMatchSnapshot('landscape-apos-rotacao.png');
});
