import { expect, test } from '@playwright/test';

const localOrigin = 'http://127.0.0.1:4183';

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      current: {
        temperature_2m: 13.2,
        weather_code: 0
      }
    })
  }));
});

test('initial route keeps critical code within budget and defers dossier media', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?lang=ru&review=performance', { waitUntil: 'networkidle' });

  const metrics = await page.evaluate((origin) => {
    const resources = performance.getEntriesByType('resource')
      .filter((entry) => entry.name.startsWith(origin));
    const criticalTypes = new Set(['script', 'link']);
    const criticalBytes = resources
      .filter((entry) => criticalTypes.has(entry.initiatorType))
      .reduce((sum, entry) => sum + entry.encodedBodySize, 0);
    const galleryMedia = resources
      .map((entry) => new URL(entry.name).pathname)
      .filter((pathname) => pathname.startsWith('/assets/artist-index/'));

    return {
      criticalBytes,
      galleryMedia,
      canvases: document.querySelectorAll('canvas').length
    };
  }, localOrigin);

  expect(metrics.criticalBytes).toBeLessThan(360_000);
  expect(metrics.galleryMedia).toEqual([]);
  expect(metrics.canvases).toBe(0);
});

test('cursor trail allocates lazily and respects the calm-motion gate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?lang=ru&review=performance');

  await expect(page.locator('.cursor-trail-canvas')).toHaveCount(0);
  await page.mouse.move(240, 180);
  await expect(page.locator('.cursor-trail-canvas')).toHaveCount(1);

  const canvasBudget = await page.locator('.cursor-trail-canvas').evaluate((canvas) => ({
    width: canvas.width,
    height: canvas.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  }));
  expect(canvasBudget.width).toBeLessThanOrEqual(Math.ceil(canvasBudget.viewportWidth * 1.6));
  expect(canvasBudget.height).toBeLessThanOrEqual(Math.ceil(canvasBudget.viewportHeight * 1.6));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.cursor-trail-canvas')).toHaveCount(0);
  await page.mouse.move(360, 260);
  await expect(page.locator('.cursor-trail-canvas')).toHaveCount(0);
});

test.describe('touch device', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('mobile route does not allocate desktop-only drawing surfaces', async ({ page }) => {
    await page.goto('/?lang=ja&review=performance');

    await page.touchscreen.tap(180, 240);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('[data-mobile-menu]')).toBeVisible();
  });
});
