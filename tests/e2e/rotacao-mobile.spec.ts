import { test, expect, type Page } from '@playwright/test';

interface EstadoCena {
  scaleW: number;
  scaleH: number;
  cartaX: number;
  cartaY: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __jogoPhaser: any;
  }
}

function lerEstadoJogoScene(page: Page): Promise<EstadoCena> {
  return page.evaluate(() => {
    const g = window.__jogoPhaser;
    const s = g.scene.scenes.find((x: { scene: { key: string } }) => x.scene.key === 'JogoScene');
    const t = s.children.list.find((x: { type: string }) => x.type === 'Text');
    return {
      scaleW: s.scale.width,
      scaleH: s.scale.height,
      cartaX: t ? t.x : -999,
      cartaY: t ? t.y : -999,
    };
  });
}

function irParaJogoScene(page: Page): Promise<void> {
  return page.evaluate(() => {
    window.__jogoPhaser.scene.start('JogoScene');
  });
}

function forcarRefreshPhaser(page: Page): Promise<void> {
  return page.evaluate(() => {
    window.__jogoPhaser.scale.refresh();
  });
}

test('carta permanece centralizada após rotação mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForTimeout(500);

  await irParaJogoScene(page);
  await page.waitForTimeout(300);

  const antes = await lerEstadoJogoScene(page);
  expect(antes.scaleW).toBe(375);
  expect(antes.scaleH).toBe(667);
  expect(antes.cartaX).toBeCloseTo(187.5, 0);
  expect(antes.cartaY).toBeCloseTo(333.5, 0);

  await page.setViewportSize({ width: 667, height: 375 });
  await forcarRefreshPhaser(page);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('orientationchange'));
  });
  await page.waitForTimeout(600);

  const depois = await lerEstadoJogoScene(page);
  expect(depois.scaleW).toBe(667);
  expect(depois.scaleH).toBe(375);
  expect(depois.cartaX).toBeCloseTo(333.5, 0);
  expect(depois.cartaY).toBeCloseTo(187.5, 0);
});

test('carta sobrevive a dimensões intermediárias mínimas durante rotação', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForTimeout(500);

  await irParaJogoScene(page);
  await page.waitForTimeout(300);

  await page.setViewportSize({ width: 1, height: 1 });
  await forcarRefreshPhaser(page);
  await page.waitForTimeout(150);

  await page.setViewportSize({ width: 667, height: 375 });
  await page.waitForTimeout(100);
  await forcarRefreshPhaser(page);
  await page.waitForTimeout(600);

  const depois = await lerEstadoJogoScene(page);
  expect(depois.scaleW).toBe(667);
  expect(depois.scaleH).toBe(375);
  expect(depois.cartaX).toBeCloseTo(333.5, 0);
  expect(depois.cartaY).toBeCloseTo(187.5, 0);
});
