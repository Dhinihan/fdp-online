import { test, expect } from '@playwright/test';

test('smoke test visual — quadrado verde no canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page).toHaveScreenshot('smoke.png');
});
