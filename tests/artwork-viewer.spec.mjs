import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', (route) => route.abort());
});

const panelSelector = '#artist-dossier-panel';
const viewerSelector = '[data-artwork-viewer]';

for (const theme of ['light', 'dark']) {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    test(`artwork viewer preserves the work and keyboard return: ${theme} ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((theme) => localStorage.setItem('tarski-theme', theme), theme);
      await page.goto('/?lang=ru#artist-anastasia-dahl');
      const panel = page.locator(panelSelector);
      const trigger = page.locator('.artist-dossier__gallery-open').nth(1);
      const viewer = page.locator(viewerSelector);
      await trigger.focus();
      await trigger.scrollIntoViewIfNeeded();
      const position = await panel.evaluate((element) => element.scrollTop);
      const thumbnail = await trigger.locator('img').boundingBox();
      await page.keyboard.press('Enter');
      await expect(viewer).toBeVisible();
      await expect(viewer).toHaveAttribute('data-state', 'ready');
      await expect(page).toHaveURL(/#artist-anastasia-dahl$/);
      const back = viewer.getByRole('button', { name: 'К работам' });
      await expect(back).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(back).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(back).toBeFocused();
      const image = viewer.locator('img');
      await expect(image).toHaveAttribute('alt', 'Групповая перформативная композиция с Анастасией Даль');
      const geometry = await image.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height, ratio: element.naturalWidth / element.naturalHeight, top: rect.top, bottom: rect.bottom, right: rect.right };
      });
      expect(geometry.width / geometry.height).toBeCloseTo(geometry.ratio, 2);
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(viewport.height);
      expect(geometry.right).toBeLessThanOrEqual(viewport.width);
      if (viewport.width > 720) expect(geometry.width).toBeGreaterThan(thumbnail.width * 1.3);
      await page.keyboard.press('Escape');
      await expect(viewer).not.toBeVisible();
      await expect(panel).toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await panel.evaluate((element) => element.scrollTop)).toBeCloseTo(position, 0);

      // The other close path is reversible too, including a rapid repeat.
      await page.keyboard.press('Space');
      await expect(viewer).toBeVisible();
      await back.click();
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(viewer).toBeVisible();
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-artist-dossier]')).toHaveAttribute('aria-hidden', 'true');
      await expect(page).toHaveURL(/#artists$/);
    });
  }
}

for (const [language, backLabel] of [['ru', 'К работам'], ['en', 'Back to works'], ['ja', '作品に戻る']]) {
  test(`artwork viewer keeps paired documentation, credits and 200% reflow: ${language}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?lang=${language}#artist-alina-kugush`);
    const trigger = page.locator('.artist-dossier__gallery-open').nth(2);
    await trigger.click();
    const viewer = page.locator(viewerSelector);
    await expect(viewer).toHaveAttribute('data-state', 'ready');
    await expect(viewer.getByRole('button', { name: backLabel })).toBeFocused();
    await expect(viewer.locator('[data-artwork-credit]')).not.toBeEmpty();
    await expect(viewer.locator('[data-artwork-caption]')).not.toBeEmpty();
    await page.addStyleTag({ content: '.artwork-viewer { --type-body: 40px; --type-meta: 26px; }' });
    const bounds = await viewer.evaluate((element) => {
      const image = element.querySelector('img');
      const close = element.querySelector('button');
      return {
        overflow: element.scrollWidth - element.clientWidth,
        closeRight: close.getBoundingClientRect().right,
        closeBottom: close.getBoundingClientRect().bottom,
        imageBottom: image.getBoundingClientRect().bottom
      };
    });
    expect(bounds.overflow).toBeLessThanOrEqual(1);
    expect(bounds.closeRight).toBeLessThanOrEqual(320);
    expect(bounds.closeBottom).toBeLessThan(700);
    expect(bounds.imageBottom).toBeLessThanOrEqual(700);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
}

test('failed artwork load leaves a readable way back to the same work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?lang=ru#artist-anastasia-dahl');
  const trigger = page.locator('.artist-dossier__gallery-open').nth(1);
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger.locator('img')).toHaveJSProperty('complete', true);
  await page.route('**/assets/artist-index/anastasia-dahl/**', (route) => route.abort());
  await trigger.click();
  const viewer = page.locator(viewerSelector);
  await expect(viewer).toHaveAttribute('data-state', 'error');
  await expect(viewer.getByRole('status')).toContainText('Не удалось загрузить изображение');
  await viewer.getByRole('button', { name: 'К работам' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator(panelSelector)).toBeVisible();
});

test('history navigation closes the enlarged view without leaving an inert page', async ({ page }) => {
  await page.goto('/?lang=ru#artists');
  await page.locator('.artist-index__link[href="#artist-anastasia-dahl"]').click();
  await page.locator('.artist-dossier__gallery-open').first().click();
  await expect(page.locator(viewerSelector)).toBeVisible();
  await page.goBack();
  await expect(page.locator(viewerSelector)).not.toBeVisible();
  await expect(page.locator('[data-artist-dossier]')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.page')).not.toHaveAttribute('inert');
});
