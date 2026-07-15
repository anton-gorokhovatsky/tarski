import { expect, test } from '@playwright/test';

const locales = {
  ru: {
    skip: 'Перейти к содержанию',
    menu: 'Открыть меню',
    service: 'Открыть настройки сайта',
    widget: 'Световой день и тема',
    empathySaved: 'Ответ сохранён только на этом устройстве.'
  },
  en: {
    skip: 'Skip to content',
    menu: 'Open menu',
    service: 'Open site settings',
    widget: 'Daylight and theme',
    empathySaved: 'Your answer is saved only on this device.'
  },
  ja: {
    skip: '本文へ移動',
    menu: 'メニューを開く',
    service: 'サイト設定を開く',
    widget: '日照時間とテーマ',
    empathySaved: '回答はこの端末にのみ保存されました。'
  }
};

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ current: { temperature_2m: 13.2, weather_code: 0 } })
  }));
});

const auditDocument = async (page) => page.evaluate(() => {
  const ids = [...document.querySelectorAll('[id]')].map(({ id }) => id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const headingLevels = [...document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')]
    .map((heading) => Number(heading.tagName.slice(1)));
  const headingJumps = headingLevels
    .slice(1)
    .filter((level, index) => level - headingLevels[index] > 1);
  const imagesWithoutAlt = [...document.querySelectorAll('img:not([alt])')]
    .map((image) => image.currentSrc || image.getAttribute('src') || '<inline>');
  const unnamedGroups = [...document.querySelectorAll('[role="group"]')]
    .filter((group) => !group.hasAttribute('aria-label') && !group.hasAttribute('aria-labelledby'))
    .map((group) => group.className || group.id || group.tagName);
  const visibleInteractive = [...document.querySelectorAll('a[href], button, summary, input, select, textarea')]
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.closest('[hidden], [inert]')
        && style.visibility !== 'hidden'
        && style.display !== 'none'
        && rect.width > 0
        && rect.height > 0;
    });
  const nameFor = (element) => {
    const labelledBy = element.getAttribute('aria-labelledby');
    const referenced = labelledBy
      ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ')
      : '';
    return [
      element.getAttribute('aria-label'),
      referenced,
      element.textContent,
      element.querySelector('img[alt]')?.getAttribute('alt'),
      element.getAttribute('title')
    ].find((value) => value?.trim())?.trim() || '';
  };
  const unnamedInteractive = visibleInteractive
    .filter((element) => !nameFor(element))
    .map((element) => `${element.tagName.toLowerCase()}.${element.className || '-'}`);

  return {
    duplicateIds: [...new Set(duplicateIds)],
    headingJumps,
    imagesWithoutAlt,
    unnamedGroups,
    unnamedInteractive,
    mainCount: document.querySelectorAll('main').length,
    h1Count: document.querySelectorAll('main h1').length,
    footerCount: document.querySelectorAll('footer').length
  };
});

for (const [locale, copy] of Object.entries(locales)) {
  test(`${locale}: semantic release smoke and keyboard menu path`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`/?lang=${locale}`);
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.skip-link')).toHaveText(copy.skip);
    const storageConfirmations = page.locator('[data-empathy-storage-confirmation]');
    await expect(storageConfirmations).toHaveText([copy.empathySaved, copy.empathySaved]);
    await expect(page.locator('[data-empathy-storage-confirmation]:visible')).toHaveCount(0);
    await expect(page.getByRole('button', { name: copy.menu })).toHaveCount(1);
    await expect(page.getByRole('button', { name: copy.service })).toHaveCount(1);

    const audit = await auditDocument(page);
    expect(audit.duplicateIds).toEqual([]);
    expect(audit.headingJumps).toEqual([]);
    expect(audit.imagesWithoutAlt).toEqual([]);
    expect(audit.unnamedGroups).toEqual([]);
    expect(audit.unnamedInteractive).toEqual([]);
    expect(audit.mainCount).toBe(1);
    expect(audit.h1Count).toBe(1);
    expect(audit.footerCount).toBe(1);

    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const focusIndicator = await page.locator('.skip-link').evaluate((element) => {
      const style = getComputedStyle(element);
      return { outline: style.outlineStyle, shadow: style.boxShadow };
    });
    expect(focusIndicator.outline !== 'none' || focusIndicator.shadow !== 'none').toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.locator('#about')).toBeFocused();

    const menuToggle = page.getByRole('button', { name: copy.menu });
    await menuToggle.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    for (let index = 0; index < 9; index += 1) await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(menuToggle).toBeFocused();

    const serviceToggle = page.getByRole('button', { name: copy.service });
    await serviceToggle.click();
    await page.locator('[data-daylight-toggle]').click();
    const widget = page.locator('[data-daylight-widget]');
    await expect(widget).toHaveAttribute('aria-label', copy.widget);
    await expect(widget.locator('[aria-live="polite"]')).toHaveCount(2);
    await expect(widget.locator('[data-empathy-panel]')).toHaveClass(/ym-hide-content/);
    await expect(widget.locator('[data-empathy-panel]')).toHaveClass(/ym-disable-clickmap/);
  });
}

test('reduced-motion preference reaches the shared motion system', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  await expect(page.locator('html')).toHaveAttribute('data-motion-preference', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'calm');
  await expect(page.locator('[data-motion-mode="system"]').first()).toHaveAttribute('aria-pressed', 'true');
});

test('320 CSS-pixel reflow keeps reading order and fixed controls inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/?lang=ru');

  const initialOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(initialOverflow).toBeLessThanOrEqual(0);

  await page.locator('[data-mobile-service-toggle]').click();
  await page.locator('[data-daylight-toggle]').click();
  await page.waitForTimeout(900);

  const widgetGeometry = await page.locator('[data-mobile-service]').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  expect(widgetGeometry.left).toBeGreaterThanOrEqual(0);
  expect(widgetGeometry.right).toBeLessThanOrEqual(widgetGeometry.viewport);
  expect(widgetGeometry.width).toBeLessThanOrEqual(widgetGeometry.viewport);
  expect(widgetGeometry.scrollWidth).toBeLessThanOrEqual(widgetGeometry.viewport);
});
