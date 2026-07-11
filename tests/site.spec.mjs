import { expect, test } from '@playwright/test';

const languages = {
  ru: {
    privacyTitle: /Аналитика/,
    menu: 'Меню',
    widget: 'Световой день и тема',
    auto: 'Авто'
  },
  en: {
    privacyTitle: /Analytics/,
    menu: 'Menu',
    widget: 'Daylight and theme',
    auto: 'Auto'
  },
  ja: {
    privacyTitle: /アクセス解析/,
    menu: 'メニュー',
    widget: '日照時間とテーマ',
    auto: '自動'
  }
};

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
});

for (const [language, copy] of Object.entries(languages)) {
  test(`${language}: mobile layout reflows without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`/?lang=${language}`);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('[data-mobile-menu-toggle-label]')).toHaveText(copy.menu);

    const dimensions = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = Array.from(document.querySelectorAll('body *'))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return style.display !== 'none' && style.position !== 'fixed' && (rect.left < -0.5 || rect.right > viewport + 0.5);
        })
        .slice(0, 12)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return `${element.tagName.toLowerCase()}.${element.className || '-'} (${Math.round(rect.left)}…${Math.round(rect.right)})`;
        });

      return {
        viewport,
        content: document.documentElement.scrollWidth,
        offenders
      };
    });
    expect(dimensions.content, dimensions.offenders.join('\n')).toBeLessThanOrEqual(dimensions.viewport);

    await page.locator('[data-mobile-service-toggle]').click();
    await page.locator('[data-daylight-toggle]').click();
    const widget = page.locator('[data-daylight-widget]');
    await expect(widget).toHaveAttribute('aria-label', copy.widget);
    await expect(widget.locator('[data-theme-mode="auto"]')).toHaveText(copy.auto);
    await page.waitForTimeout(560);

    const widgetBounds = await widget.evaluate((element) => {
      const rect = element.closest('[data-mobile-service]').getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: document.documentElement.clientWidth };
    });
    expect(widgetBounds.left).toBeGreaterThanOrEqual(0);
    expect(widgetBounds.right).toBeLessThanOrEqual(widgetBounds.viewport);
  });

  test(`${language}: privacy page is localized and canonical`, async ({ page }) => {
    await page.goto(`/privacy.html?lang=${language}`);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('#privacy-title')).toContainText(copy.privacyTitle);

    const expectedCanonical = language === 'ru'
      ? 'https://tarski.ru/privacy.html'
      : `https://tarski.ru/privacy.html?lang=${language}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedCanonical);
    await expect(page.locator('[data-privacy-back]')).toHaveAttribute(
      'href',
      language === 'ru' ? '/' : `/?lang=${language}`
    );
  });
}

test('mobile menu and service panel preserve state, Escape, and focus return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  const menuToggle = page.locator('[data-mobile-menu-toggle]');
  const menu = page.locator('#mobile-menu-expanded');
  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menuToggle).toBeFocused();
  await page.waitForTimeout(120);
  const menuClosingFrame = await menuToggle.evaluate(() => {
    const panel = document.querySelector('#mobile-menu-expanded');
    return {
      panelStillMounted: !panel.hidden,
      panelMaterialTransform: getComputedStyle(panel).transform,
      generatedCollapseDot: getComputedStyle(document.querySelector('[data-mobile-menu-toggle]'), '::after').content
    };
  });
  expect(menuClosingFrame.panelStillMounted).toBe(true);
  expect(menuClosingFrame.panelMaterialTransform).toBe('none');
  expect(menuClosingFrame.generatedCollapseDot).toBe('none');
  await expect(menu).toBeHidden();

  const serviceToggle = page.locator('[data-mobile-service-toggle]');
  const serviceRoot = page.locator('[data-mobile-service]');
  const servicePanel = page.locator('[data-mobile-service-panel]');
  await serviceToggle.click();
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(servicePanel).toHaveAttribute('aria-hidden', 'false');
  await expect(serviceRoot).toHaveClass(/is-open/);
  const serviceSurface = await page.evaluate(() => {
    const menuRoot = document.querySelector('[data-mobile-menu]');
    const serviceRoot = document.querySelector('[data-mobile-service]');
    const expandedMenu = document.querySelector('#mobile-menu-expanded');
    return {
      compactBackdrop: getComputedStyle(menuRoot.querySelector('.mobile-island-surface'), '::before').backdropFilter,
      compactBackground: getComputedStyle(menuRoot.querySelector('.mobile-island-surface'), '::before').backgroundImage,
      expandedBackdrop: getComputedStyle(menuRoot, '::after').backdropFilter,
      expandedBackground: getComputedStyle(menuRoot, '::after').backgroundImage,
      height: serviceRoot.getBoundingClientRect().height,
      serviceMaterialTransform: getComputedStyle(menuRoot, '::after').transform,
      menuBackdrop: getComputedStyle(expandedMenu).backdropFilter,
      menuMaterialTransform: getComputedStyle(expandedMenu).transform
    };
  });
  expect(serviceSurface.expandedBackdrop).toBe(serviceSurface.compactBackdrop);
  expect(serviceSurface.compactBackground).toBe(serviceSurface.expandedBackground);
  expect(serviceSurface.compactBackground.match(/linear-gradient/g)).toHaveLength(1);
  expect(serviceSurface.compactBackground).toContain('0.98');
  expect(serviceSurface.menuBackdrop).toBe(serviceSurface.compactBackdrop);
  expect(serviceSurface.height).toBeGreaterThanOrEqual(50);
  expect(serviceSurface.height).toBeLessThanOrEqual(54);
  expect(serviceSurface.serviceMaterialTransform).toBe('none');
  expect(serviceSurface.menuMaterialTransform).toBe('none');
  await page.keyboard.press('Escape');
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(serviceToggle).toBeFocused();
  await expect(servicePanel).toBeHidden();
});

test('daylight widget expands the service material and keeps theme modes accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  await expect(page.locator('.mobile-island-rim')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'auto');

  const serviceToggle = page.locator('[data-mobile-service-toggle]');
  const serviceRoot = page.locator('[data-mobile-service]');
  const daylightToggle = page.locator('[data-daylight-toggle]');
  const widget = page.locator('[data-daylight-widget]');

  await serviceToggle.click();
  await daylightToggle.click();
  await expect(daylightToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(widget).toHaveAttribute('aria-hidden', 'false');
  await expect(widget).toBeVisible();
  await expect(widget.locator('time')).toHaveCount(3);
  await page.waitForTimeout(560);

  const expandedGeometry = await serviceRoot.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    menuHasWidgetState: element.closest('[data-mobile-menu]').classList.contains('is-daylight-open')
  }));
  expect(expandedGeometry.height).toBeGreaterThanOrEqual(168);
  expect(expandedGeometry.height).toBeLessThanOrEqual(176);
  expect(expandedGeometry.menuHasWidgetState).toBe(true);

  const darkMode = widget.locator('[data-theme-mode="dark"]');
  const autoMode = widget.locator('[data-theme-mode="auto"]');
  await darkMode.click();
  await expect(page.locator('html')).toHaveAttribute('data-effective-theme', 'dark');
  await expect(darkMode).toHaveAttribute('aria-pressed', 'true');
  await autoMode.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'auto');
  await expect(autoMode).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Escape');
  await expect(daylightToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'false');
});

test('mobile archipelago enters vertically at both scroll placements', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  const menu = page.locator('[data-mobile-menu]');
  const threshold = await page.locator('[data-mobile-menu-home]').evaluate((element) => (
    element.getBoundingClientRect().bottom + window.scrollY + 2
  ));

  await page.evaluate((top) => window.scrollTo(0, top), threshold);
  await expect(menu).toHaveClass(/is-visible/);
  await expect(menu).toHaveClass(/is-docking/);

  const dockingMotion = await menu.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      name: getComputedStyle(element).animationName,
      keyframes: animation?.effect?.getKeyframes().map(({ translate, transform }) => ({
        translate,
        transform
      })) || []
    };
  });

  expect(dockingMotion.name).toBe('mobile-island-dock-in');
  expect(dockingMotion.keyframes[0].translate).toBe('0px 24px');
  expect(dockingMotion.keyframes.at(-1).translate).toBe('0px');
  expect(dockingMotion.keyframes.every(({ transform }) => !transform || transform === 'none')).toBe(true);

  await expect(menu).not.toHaveClass(/is-docking/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(menu).not.toHaveClass(/is-visible/);
  await expect(menu).toHaveClass(/is-returning-home/);

  const homeMotion = await menu.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      name: getComputedStyle(element).animationName,
      keyframes: animation?.effect?.getKeyframes().map(({ translate, transform }) => ({
        translate,
        transform
      })) || []
    };
  });

  expect(homeMotion.name).toBe('mobile-island-home-in');
  expect(homeMotion.keyframes[0].translate).toBe('0px -24px');
  expect(homeMotion.keyframes.at(-1).translate).toBe('0px');
  expect(homeMotion.keyframes.every(({ transform }) => !transform || transform === 'none')).toBe(true);
});

test('artist names remain headings with one keyboard trigger each', async ({ page }) => {
  await page.goto('/?lang=ru#artists');

  const cards = page.locator('.artist-card');
  await expect(cards).toHaveCount(7);
  await expect(page.locator('.artist-card__name')).toHaveCount(7);
  await expect(page.locator('.artist-card__detail-trigger')).toHaveCount(7);
  await expect(page.locator('.artist-card__image[role="button"], .artist-card__image[tabindex]')).toHaveCount(0);

  const listView = page.locator('[data-artists-view-option="list"]');
  await listView.click();
  const trigger = page.locator('#artist-anastasia-dahl .artist-card__detail-trigger');
  await trigger.click();
  await expect(page.locator('#artist-dossier-panel')).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('artist gallery prefers responsive AVIF and defers distant media', async ({ page }) => {
  const galleryRequests = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.includes('/assets/artist-index/anastasia-dahl/')) galleryRequests.push(path);
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru#artists');
  await page.locator('[data-artists-view-option="list"]').click();
  await page.locator('#artist-anastasia-dahl .artist-card__detail-trigger').click();
  await expect(page.locator('[data-artist-dossier-gallery] picture')).toHaveCount(7);
  await expect.poll(() => galleryRequests.some((path) => path.endsWith('.avif'))).toBe(true);

  const originalGalleryRequests = galleryRequests.filter((path) => /\.(?:jpe?g|png|webp)$/i.test(path));
  expect(originalGalleryRequests).toEqual([]);
  expect(galleryRequests.filter((path) => path.endsWith('.avif')).length).toBeLessThan(7);
});
