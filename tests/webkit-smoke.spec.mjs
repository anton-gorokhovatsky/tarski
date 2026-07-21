import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ current: { temperature_2m: 13.2, weather_code: 0 } })
  }));
});

test('mobile WebKit keeps the menu and settings surface usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/?lang=ru');
  await page.evaluate(() => document.fonts.ready);

  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'calm');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );

  const menuToggle = page.getByRole('button', { name: 'Открыть меню' });
  await menuToggle.focus();
  await expect(menuToggle).toBeFocused();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('dialog');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-modal', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(menuToggle).toBeFocused();

  await page.getByRole('button', { name: 'Открыть настройки сайта' }).click();
  await page.locator('[data-daylight-toggle]').click();
  const service = page.locator('[data-mobile-service]');
  await expect(page.locator('[data-daylight-widget]')).toBeVisible();

  const geometry = await service.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  });

  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  await expect(service.locator('[data-theme-mode="auto"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(service.locator('[data-motion-mode="system"]')).toHaveAttribute('aria-pressed', 'true');
});
