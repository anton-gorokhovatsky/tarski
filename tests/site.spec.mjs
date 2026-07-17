import { expect, test } from '@playwright/test';

const languages = {
  ru: {
    privacyTitle: /Аналитика/,
    menu: 'Меню',
    widget: 'Световой день и тема',
    auto: 'Авто',
    day: 'День',
    night: 'Ночь',
    weather: 'Ясно',
    artistsContext: 'Сеть',
    footerContext: 'Участие',
    footerCta: 'Написать нам',
    designCredit: 'Дизайн и разработка',
    footerRoutes: ['Предложить проект', 'Стать партнёром', 'Задать вопрос']
  },
  en: {
    privacyTitle: /Analytics/,
    menu: 'Menu',
    widget: 'Daylight and theme',
    auto: 'Auto',
    day: 'Day',
    night: 'Night',
    weather: 'Clear',
    artistsContext: 'Network',
    footerContext: 'Participation',
    footerCta: 'Contact us',
    designCredit: 'Design and development',
    footerRoutes: ['Propose a project', 'Become a partner', 'Ask a question']
  },
  ja: {
    privacyTitle: /アクセス解析/,
    menu: 'メニュー',
    widget: '日照時間とテーマ',
    auto: '自動',
    day: '昼',
    night: '夜',
    weather: '晴れ',
    artistsContext: 'ネットワーク',
    footerContext: '参加',
    footerCta: 'お問い合わせ',
    designCredit: 'デザイン・開発',
    footerRoutes: ['プロジェクトを提案', 'パートナーになる', '質問する']
  }
};

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
    await expect(widget.locator('[data-theme-mode="light"]')).toHaveText(copy.day);
    await expect(widget.locator('[data-theme-mode="dark"]')).toHaveText(copy.night);
    await expect(widget.locator('[data-daylight-status]')).toHaveText(copy.weather);
    await expect(widget.locator('[data-weather-temperature]')).toHaveText('13\u202F°C');
    await page.waitForTimeout(560);

    const widgetBounds = await widget.evaluate((element) => {
      const rect = element.closest('[data-mobile-service]').getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: document.documentElement.clientWidth };
    });
    expect(widgetBounds.left).toBeGreaterThanOrEqual(0);
    expect(widgetBounds.right).toBeLessThanOrEqual(widgetBounds.viewport);

    const formattedTimes = await widget.locator('time').allTextContents();
    await expect(widget.locator('.daylight-time__separator')).toHaveCount(0);
    expect(await widget.evaluate((element) => (
      Array.from(element.querySelectorAll('time'))
        .every((time) => time.getAttribute('aria-label') === time.textContent)
    ))).toBe(true);
    if (language === 'en') {
      expect(formattedTimes.every((value) => /\b(?:am|pm)$/i.test(value))).toBe(true);
      expect(formattedTimes.every((value) => !/[\u00a0\u202f]/.test(value))).toBe(true);
    } else {
      expect(formattedTimes.every((value) => !/\b(?:am|pm)$/i.test(value))).toBe(true);
    }

    await expect(page.locator('[data-language-option][title]')).toHaveCount(0);

    await expect(page.locator('[data-footer-cta-label]')).toHaveText(copy.footerCta);
    await expect(page.locator('[data-footer-route] > span:first-child')).toHaveText(copy.footerRoutes);
    await expect(page.locator('[data-footer-route]')).toHaveCount(3);
    await expect(page.locator('[data-design-credit]')).toHaveText(copy.designCredit);
    await expect(page.locator('[data-design-credit]')).toHaveAttribute('href', 'https://anton-gorokhovatsky.github.io/design/');
    await expect(page.locator('[data-design-credit]')).toHaveAttribute('rel', 'author');
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

test('desktop context label follows the artists section into participation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const [language, copy] of Object.entries(languages)) {
    await page.goto(`/?lang=${language}`);
    await page.locator('#artists').scrollIntoViewIfNeeded();
    await expect(page.locator('.main-nav .nav-label')).toHaveText(copy.artistsContext);

    await page.locator('[data-semantic-footer]').scrollIntoViewIfNeeded();
    await expect(page.locator('.main-nav .nav-label')).toHaveText(copy.footerContext);
  }
});

test('footer credits keep the tablet bottom inset', async ({ page }) => {
  await page.setViewportSize({ width: 879, height: 530 });
  await page.goto('/?lang=ru');

  const geometry = await page.locator('.site-footer').evaluate((footer) => {
    const disclaimer = footer.querySelector('.site-footer__disclaimer').getBoundingClientRect();
    const credits = footer.querySelector('.site-footer__credits').getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    return {
      creditsGap: credits.top - disclaimer.bottom,
      bottomInset: footerRect.bottom - credits.bottom,
      leftDelta: Math.abs(credits.left - disclaimer.left)
    };
  });

  expect(geometry.creditsGap).toBeCloseTo(12, 0);
  expect(geometry.bottomInset).toBeCloseTo(32, 0);
  expect(geometry.leftDelta).toBeLessThanOrEqual(0.5);
});

test('mobile menu and service panel preserve state, Escape, and focus return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => window.localStorage.setItem('tarski-theme', 'light'));
  await page.goto('/?lang=ru');

  const menuToggle = page.locator('[data-mobile-menu-toggle]');
  const menuRoot = page.locator('[data-mobile-menu]');
  const menu = page.locator('#mobile-menu-expanded');
  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await expect(menuRoot).toHaveClass(/is-menu-settled/);
  expect(await menu.evaluate((element) => getComputedStyle(element).clipPath)).toContain('inset(0px');
  await page.evaluate(() => {
    const root = document.querySelector('[data-mobile-menu]');
    const panel = document.querySelector('#mobile-menu-expanded');
    window.__tarskiMenuClosePhases = [];
    window.__tarskiMenuCloseObserver = new MutationObserver(() => {
      window.__tarskiMenuClosePhases.push({
        className: root.className,
        clipPath: getComputedStyle(panel).clipPath
      });
    });
    window.__tarskiMenuCloseObserver.observe(root, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
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
  const closePhases = await page.evaluate(() => {
    window.__tarskiMenuCloseObserver.disconnect();
    return window.__tarskiMenuClosePhases;
  });
  const contentOutPhaseIndex = closePhases.findIndex(({ className }) => (
    className.includes('is-menu-open')
    && className.includes('is-menu-closing')
    && !className.includes('is-menu-compacting')
  ));
  const compactingPhaseIndex = closePhases.findIndex(({ className }) => (
    className.includes('is-menu-closing')
    && className.includes('is-menu-compacting')
    && !className.includes('is-menu-open')
  ));
  expect(contentOutPhaseIndex).toBeGreaterThanOrEqual(0);
  expect(closePhases[contentOutPhaseIndex].clipPath).not.toBe('none');
  expect(closePhases[contentOutPhaseIndex].clipPath).toContain('inset(0px');
  expect(compactingPhaseIndex).toBeGreaterThan(contentOutPhaseIndex);

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
    const serviceMaterial = menuRoot.querySelector('.mobile-service-surface');
    return {
      compactBackdrop: getComputedStyle(menuRoot.querySelector('.mobile-island-surface')).backdropFilter,
      compactBackground: getComputedStyle(menuRoot.querySelector('.mobile-island-surface')).backgroundImage,
      compactFilter: getComputedStyle(menuRoot.querySelector('.mobile-island-surface')).filter,
      compactDepthFilter: getComputedStyle(menuRoot.querySelector('.mobile-island-depth')).filter,
      compactDepthFill: getComputedStyle(menuRoot.querySelector('.mobile-island-depth'), '::before').backgroundColor,
      compactPseudoContent: getComputedStyle(menuRoot.querySelector('.mobile-island-surface'), '::before').content,
      expandedBackdrop: getComputedStyle(serviceMaterial).backdropFilter,
      expandedBackground: getComputedStyle(serviceMaterial).backgroundImage,
      expandedFilter: getComputedStyle(serviceMaterial).filter,
      serviceDepthFilter: getComputedStyle(menuRoot.querySelector('.mobile-service-depth')).filter,
      serviceDepthFill: getComputedStyle(menuRoot.querySelector('.mobile-service-depth'), '::before').backgroundColor,
      menuDepthFilter: getComputedStyle(menuRoot.querySelector('.mobile-menu-expanded-depth')).filter,
      menuDepthFill: getComputedStyle(menuRoot.querySelector('.mobile-menu-expanded-depth'), '::before').backgroundColor,
      pageBackground: getComputedStyle(document.body).backgroundColor,
      menuBorderWidth: getComputedStyle(expandedMenu).borderTopWidth,
      height: serviceRoot.getBoundingClientRect().height,
      serviceMaterialTransform: getComputedStyle(serviceMaterial).transform,
      menuBackdrop: getComputedStyle(expandedMenu).backdropFilter,
      menuMaterialTransform: getComputedStyle(expandedMenu).transform
    };
  });
  expect(serviceSurface.expandedBackdrop).toBe(serviceSurface.compactBackdrop);
  expect(serviceSurface.compactBackground).toBe(serviceSurface.expandedBackground);
  expect(serviceSurface.compactFilter).toBe(serviceSurface.expandedFilter);
  expect(serviceSurface.compactDepthFilter).toBe(serviceSurface.serviceDepthFilter);
  expect(serviceSurface.compactDepthFilter).toBe(serviceSurface.menuDepthFilter);
  expect(serviceSurface.compactDepthFilter).toContain('drop-shadow');
  expect(serviceSurface.serviceDepthFill).toBe(serviceSurface.compactDepthFill);
  expect(serviceSurface.menuDepthFill).toBe(serviceSurface.compactDepthFill);
  expect(serviceSurface.compactDepthFill).toMatch(/^rgba\(/);
  expect(Number(serviceSurface.compactDepthFill.match(/[\d.]+(?=\)$)/)?.[0])).toBeLessThanOrEqual(0.1);
  expect(serviceSurface.menuBorderWidth).toBe('0px');
  expect(serviceSurface.compactPseudoContent).toBe('none');
  expect(serviceSurface.compactBackground.match(/linear-gradient/g)).toHaveLength(1);
  expect(serviceSurface.compactBackground).toContain('0.58');
  expect(serviceSurface.compactBackground).toContain('0.34');
  expect(serviceSurface.menuBackdrop).toBe(serviceSurface.compactBackdrop);
  expect(serviceSurface.height).toBeGreaterThanOrEqual(50);
  expect(serviceSurface.height).toBeLessThanOrEqual(54);
  expect(serviceSurface.serviceMaterialTransform).toBe('none');
  expect(serviceSurface.menuMaterialTransform).toBe('none');
  await page.keyboard.press('Escape');
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(serviceRoot).toHaveClass(/is-closing/);
  expect(await serviceToggle.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none');
  await expect(serviceToggle).toBeFocused();
  await expect(servicePanel).toBeHidden();
  await expect.poll(() => serviceToggle.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('mobile island transitions reverse without leaving stale phases', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  const menuRoot = page.locator('[data-mobile-menu]');
  const menuToggle = page.locator('[data-mobile-menu-toggle]');
  const menuPanel = page.locator('#mobile-menu-expanded');

  await menuToggle.click();
  await page.waitForTimeout(80);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('[data-mobile-menu-toggle]').click());
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menuRoot).toHaveClass(/is-menu-settled/);
  await expect(menuRoot).not.toHaveClass(/is-menu-closing|is-menu-compacting/);
  await expect.poll(() => menuRoot.getAttribute('data-menu-motion-phase')).toBeNull();
  await expect(menuPanel).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menuPanel).toBeHidden();

  const serviceToggle = page.locator('[data-mobile-service-toggle]');
  const serviceRoot = page.locator('[data-mobile-service]');
  await serviceToggle.click();
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('[data-mobile-service-toggle]').click());
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('[data-mobile-service-toggle]').click());
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(serviceRoot).toHaveClass(/is-open/);
  await expect(menuRoot).not.toHaveClass(/is-service-closing/);
  await expect.poll(() => menuRoot.getAttribute('data-service-motion-phase')).toBeNull();

  const daylightToggle = page.locator('[data-daylight-toggle]');
  const daylightWidget = page.locator('[data-daylight-widget]');
  await daylightToggle.click();
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('[data-daylight-toggle]').click());
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('[data-daylight-toggle]').click());
  await expect(daylightToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(daylightWidget).toBeVisible();
  await expect(menuRoot).not.toHaveClass(/is-daylight-transitioning|is-daylight-closing/);
  await expect(menuRoot).toHaveClass(/is-daylight-open/);
  await expect.poll(() => menuRoot.getAttribute('data-daylight-motion-phase')).toBeNull();
});

test('menu surfaces share one stable matte material without loading the Water experiment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  await expect(page.locator('[data-water-surface], [data-water-controls]')).toHaveCount(0);
  await expect(page.locator('script[src*="material.js"], script[src*="water-runtime"]')).toHaveCount(0);
  await expect(page.locator('canvas:not(.cursor-trail-canvas)')).toHaveCount(0);

  const materialState = await page.evaluate(() => {
    const compact = document.querySelector('.mobile-island-surface');
    const service = document.querySelector('.mobile-service-surface');
    const expanded = document.querySelector('.mobile-menu-expanded');
    const desktop = document.querySelector('.main-nav');
    return {
      compactBackground: getComputedStyle(compact).backgroundImage,
      serviceBackground: getComputedStyle(service).backgroundImage,
      expandedBackground: getComputedStyle(expanded).backgroundImage,
      expandedBackgroundColor: getComputedStyle(expanded).backgroundColor,
      desktopBackground: getComputedStyle(desktop, '::after').backgroundImage,
      compactBackdrop: getComputedStyle(compact).backdropFilter,
      serviceBackdrop: getComputedStyle(service).backdropFilter,
      expandedBackdrop: getComputedStyle(expanded).backdropFilter,
      desktopBackdrop: getComputedStyle(desktop, '::after').backdropFilter
    };
  });

  expect(materialState.compactBackground).toBe(materialState.serviceBackground);
  expect(materialState.compactBackground).toBe(materialState.desktopBackground);
  expect(materialState.expandedBackground).toBe('none');
  expect(materialState.expandedBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(materialState.compactBackdrop).toBe(materialState.serviceBackdrop);
  expect(materialState.compactBackdrop).toBe(materialState.expandedBackdrop);
  expect(materialState.compactBackdrop).toBe(materialState.desktopBackdrop);
});

test('daylight widget expands the service material and keeps theme modes accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  await expect(page.locator('.mobile-island-rim')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'auto');

  const serviceToggle = page.locator('[data-mobile-service-toggle]');
  const serviceRoot = page.locator('[data-mobile-service]');
  const daylightToggle = page.locator('[data-daylight-toggle]');
  const widget = page.locator('[data-daylight-widget]');

  await serviceToggle.click();
  await daylightToggle.click();
  await expect(daylightToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-mobile-menu]')).toHaveClass(/is-daylight-transitioning/);
  const daylightHandoff = await page.locator('[data-mobile-menu]').evaluate((element) => {
    const material = getComputedStyle(element.querySelector('.mobile-service-surface'));
    const depthMask = getComputedStyle(element.querySelector('.mobile-service-depth'), '::before');
    return {
      materialRadius: parseFloat(material.borderRadius),
      materialClip: material.clipPath,
      materialBackground: material.backgroundImage,
      materialBackgroundColor: material.backgroundColor,
      depthClip: depthMask.clipPath
    };
  });
  expect(daylightHandoff.materialRadius).toBeLessThanOrEqual(36);
  expect(daylightHandoff.materialClip).toContain('inset');
  expect(daylightHandoff.materialBackground).toBe('none');
  expect(daylightHandoff.materialBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(daylightHandoff.depthClip).toContain('inset');
  await expect(widget).toHaveAttribute('aria-hidden', 'false');
  await expect(widget).toBeVisible();
  await expect(widget.locator('.daylight-widget__all-settings')).toHaveCount(0);
  await expect(widget.locator('time')).toHaveCount(3);
  await expect(widget.locator('[data-empathy-panel]')).toBeVisible();
  await expect(widget.locator('[data-weather-care]')).toBeVisible();
  await expect(page.locator('[data-mobile-menu]')).not.toHaveClass(/is-daylight-transitioning/);
  const weatherGrouping = await widget.evaluate((element) => {
    const service = element.closest('[data-mobile-service]');
    const serviceRect = service.getBoundingClientRect();
    const surfaceRect = document.querySelector('.mobile-service-surface').getBoundingClientRect();
    const servicePanelRect = service.querySelector('.mobile-service-panel').getBoundingClientRect();
    const serviceToggleRect = service.querySelector('.mobile-service-toggle').getBoundingClientRect();
    const languageRect = service.querySelector('.language-switcher').getBoundingClientRect();
    const themeToggleRect = service.querySelector('.theme-toggle').getBoundingClientRect();
    const widgetRect = element.getBoundingClientRect();
    const weatherRect = element.querySelector('.daylight-widget__weather').getBoundingClientRect();
    const temperatureRect = element.querySelector('[data-weather-temperature]').getBoundingClientRect();
    const careRect = element.querySelector('[data-weather-care]').getBoundingClientRect();
    const copyRect = element.querySelector('.daylight-widget__empathy-copy').getBoundingClientRect();
    const questionRect = element.querySelector('[data-empathy-question]').getBoundingClientRect();
    const optionsRect = element.querySelector('[data-empathy-options]').getBoundingClientRect();
    const modesRect = element.querySelector('.daylight-widget__modes').getBoundingClientRect();
    const dividerTop = parseFloat(getComputedStyle(service, '::before').top);
    const headerCenters = [serviceToggleRect, languageRect, themeToggleRect]
      .map((rect) => rect.top + rect.height / 2);
    return {
      headerHeight: servicePanelRect.height,
      headerToDivider: dividerTop - servicePanelRect.height,
      dividerToWidget: widgetRect.top - serviceRect.top - dividerTop,
      headerToWidget: widgetRect.top - servicePanelRect.bottom,
      headerCenterDelta: Math.max(...headerCenters) - Math.min(...headerCenters),
      topDelta: Math.abs(temperatureRect.top - careRect.top),
      inlineGap: careRect.left - temperatureRect.right,
      careTextAlign: getComputedStyle(element.querySelector('[data-weather-care]')).textAlign,
      weatherToCheckIn: copyRect.top - weatherRect.bottom,
      questionToAnswers: optionsRect.top - questionRect.bottom,
      answersToTheme: modesRect.top - optionsRect.bottom,
      themeToSurface: surfaceRect.bottom - modesRect.bottom
    };
  });
  expect(weatherGrouping.headerHeight).toBeCloseTo(64, 1);
  expect(weatherGrouping.headerToDivider).toBeCloseTo(0, 1);
  expect(weatherGrouping.dividerToWidget).toBeCloseTo(12, 1);
  expect(weatherGrouping.headerToWidget).toBeCloseTo(12, 1);
  expect(weatherGrouping.headerCenterDelta).toBeLessThanOrEqual(0.1);
  expect(weatherGrouping.topDelta).toBeLessThanOrEqual(0.5);
  expect(weatherGrouping.inlineGap).toBeGreaterThanOrEqual(15);
  expect(weatherGrouping.inlineGap).toBeLessThanOrEqual(17);
  expect(weatherGrouping.careTextAlign).toBe('left');
  expect(weatherGrouping.weatherToCheckIn).toBeCloseTo(20, 1);
  expect(weatherGrouping.questionToAnswers).toBeCloseTo(12, 1);
  expect(weatherGrouping.answersToTheme).toBeCloseTo(16, 1);
  expect(weatherGrouping.themeToSurface).toBeCloseTo(28, 1);
  await widget.locator('[data-empathy-answer="skip"]').click();
  await expect(widget.locator('[data-empathy-feedback]')).toBeVisible();
  await expect(widget.locator('[data-empathy-panel]')).toBeVisible();
  await expect(widget.locator('[data-empathy-settings]')).toBeVisible();
  await expect(widget.locator('[data-empathy-settings]')).not.toHaveAttribute('inert', '');
  await expect.poll(() => serviceRoot.evaluate((element) => {
    const menu = element.closest('[data-mobile-menu]');
    const targetHeight = Number.parseFloat(
      getComputedStyle(menu).getPropertyValue('--island-daylight-height')
    );
    return Math.abs(element.getBoundingClientRect().height - targetHeight);
  })).toBeLessThanOrEqual(0.5);

  const expandedGeometry = await serviceRoot.evaluate((element) => {
    const menu = element.closest('[data-mobile-menu]');
    const widgetElement = element.querySelector('[data-daylight-widget]');
    const serviceRect = element.getBoundingClientRect();
    const widgetRect = widgetElement.getBoundingClientRect();
    const chartRect = widgetElement.querySelector('.daylight-widget__chart').getBoundingClientRect();
    const chartSvg = widgetElement.querySelector('.daylight-widget__chart svg');
    const chartMarkerRects = Array.from(chartSvg.querySelectorAll(
      '[data-daylight-marker], [data-daylight-marker-halo]'
    )).map((marker) => marker.getBoundingClientRect());
    const metaRect = widgetElement.querySelector('.daylight-widget__meta').getBoundingClientRect();
    const weatherRect = widgetElement.querySelector('.daylight-widget__weather').getBoundingClientRect();
    const modesRect = widgetElement.querySelector('.daylight-widget__modes').getBoundingClientRect();
    const motionRect = widgetElement.querySelector('.daylight-widget__motion').getBoundingClientRect();
    const modesElement = widgetElement.querySelector('.daylight-widget__modes');
    const motionElement = widgetElement.querySelector('.daylight-widget__motion-options');
    const motionTrackRect = motionElement.getBoundingClientRect();
    const modeButtonCenters = Array.from(modesElement.querySelectorAll('button'))
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
    const modeSliderStyle = getComputedStyle(modesElement, '::before');
    const motionSliderStyle = getComputedStyle(motionElement, '::before');

    return {
      height: serviceRect.height,
      tokenHeight: parseFloat(getComputedStyle(menu).getPropertyValue('--island-daylight-height')),
      menuHasWidgetState: menu.classList.contains('is-daylight-open'),
      materialRadius: getComputedStyle(menu.querySelector('.mobile-service-surface')).borderRadius,
      ghostShadowContent: getComputedStyle(element, '::after').content,
      widgetInsetLeft: widgetRect.left - serviceRect.left,
      widgetInsetRight: serviceRect.right - widgetRect.right,
      widgetInsetBottom: serviceRect.bottom - widgetRect.bottom,
      chartInsetLeft: chartRect.left - serviceRect.left,
      chartInsetRight: serviceRect.right - chartRect.right,
      chartPreserveAspectRatio: chartSvg.getAttribute('preserveAspectRatio'),
      chartMarkerAspectDeltas: chartMarkerRects.map((rect) => Math.abs(rect.width - rect.height)),
      metaInsetLeft: metaRect.left - serviceRect.left,
      metaInsetRight: serviceRect.right - metaRect.right,
      weatherInsetLeft: weatherRect.left - serviceRect.left,
      weatherInsetRight: serviceRect.right - weatherRect.right,
      modesInsetLeft: modesRect.left - serviceRect.left,
      modesInsetRight: serviceRect.right - modesRect.right,
      motionInsetLeft: motionRect.left - serviceRect.left,
      motionInsetRight: serviceRect.right - motionRect.right,
      motionBottomGap: serviceRect.bottom - motionRect.bottom,
      modesPadding: parseFloat(getComputedStyle(modesElement).paddingLeft),
      themeTrackHeight: modesRect.height,
      motionTrackHeight: motionTrackRect.height,
      modeSliderTop: parseFloat(modeSliderStyle.top),
      modeSliderHeight: parseFloat(modeSliderStyle.height),
      motionSliderHeight: parseFloat(motionSliderStyle.height),
      themeSliderBackground: modeSliderStyle.backgroundColor,
      motionSliderBackground: motionSliderStyle.backgroundColor,
      themeSliderBorder: modeSliderStyle.borderColor,
      motionSliderBorder: motionSliderStyle.borderColor,
      themeSliderShadow: modeSliderStyle.boxShadow,
      motionSliderShadow: motionSliderStyle.boxShadow,
      modeButtonCenterDelta: Math.max(...modeButtonCenters) - Math.min(...modeButtonCenters),
      chartBottom: widgetElement.querySelector('svg').getBoundingClientRect().bottom,
      axisTop: widgetElement.querySelector('.daylight-widget__axis').getBoundingClientRect().top,
      chartBottomToWeather: widgetElement.querySelector('.daylight-widget__weather').getBoundingClientRect().top
        - widgetElement.querySelector('.daylight-widget__chart').getBoundingClientRect().bottom,
      timeFont: getComputedStyle(widgetElement.querySelector('time')).fontFamily,
      statusFont: getComputedStyle(widgetElement.querySelector('[data-daylight-status]')).fontFamily,
      temperatureFont: getComputedStyle(widgetElement.querySelector('[data-weather-temperature]')).fontFamily,
      temperatureFontSize: parseFloat(getComputedStyle(widgetElement.querySelector('[data-weather-temperature]')).fontSize)
    };
  });
  expect(expandedGeometry.height).toBeCloseTo(expandedGeometry.tokenHeight, 0);
  expect(expandedGeometry.menuHasWidgetState).toBe(true);
  expect(expandedGeometry.ghostShadowContent).toBe('none');
  expect(expandedGeometry.widgetInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.widgetInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.widgetInsetBottom).toBeCloseTo(28, 0);
  expect(expandedGeometry.chartInsetLeft).toBeCloseTo(0, 1);
  expect(expandedGeometry.chartInsetRight).toBeCloseTo(0, 1);
  expect(expandedGeometry.chartPreserveAspectRatio).toBe('xMidYMid slice');
  expect(expandedGeometry.chartMarkerAspectDeltas.every((delta) => delta <= 0.5)).toBe(true);
  expect(expandedGeometry.metaInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.metaInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.weatherInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.weatherInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.modesInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.modesInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.motionInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.motionInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.motionBottomGap).toBeGreaterThanOrEqual(25);
  expect(expandedGeometry.motionBottomGap).toBeLessThanOrEqual(29);
  expect(expandedGeometry.modesPadding).toBeCloseTo(4, 1);
  expect(expandedGeometry.motionTrackHeight).toBeCloseTo(expandedGeometry.themeTrackHeight, 1);
  expect(expandedGeometry.modeSliderTop).toBeCloseTo(4, 1);
  expect(expandedGeometry.modeSliderHeight).toBeGreaterThanOrEqual(30);
  expect(expandedGeometry.modeSliderHeight).toBeLessThanOrEqual(32);
  expect(expandedGeometry.motionSliderHeight).toBeCloseTo(expandedGeometry.modeSliderHeight, 1);
  expect(expandedGeometry.motionSliderBackground).toBe(expandedGeometry.themeSliderBackground);
  expect(expandedGeometry.motionSliderBorder).toBe(expandedGeometry.themeSliderBorder);
  expect(expandedGeometry.motionSliderShadow).toBe(expandedGeometry.themeSliderShadow);
  expect(expandedGeometry.modeButtonCenterDelta).toBeLessThanOrEqual(0.1);
  expect(expandedGeometry.chartBottom).toBeLessThanOrEqual(expandedGeometry.axisTop);
  expect(expandedGeometry.chartBottomToWeather).toBeGreaterThanOrEqual(15);
  expect(expandedGeometry.timeFont).toContain('Arial');
  expect(expandedGeometry.statusFont).toContain('Arial');
  expect(expandedGeometry.temperatureFont).toContain('Arial');
  expect(expandedGeometry.temperatureFontSize).toBeCloseTo(22, 0);

  const motionSystem = widget.locator('[data-motion-mode="system"]');
  const motionCalm = widget.locator('[data-motion-mode="calm"]');
  await expect(motionSystem).toHaveAttribute('aria-pressed', 'true');
  await motionCalm.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion-preference', 'calm');
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'calm');
  await expect(motionCalm).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cursor-trail-canvas')).toHaveCount(0);

  const darkMode = widget.locator('[data-theme-mode="dark"]');
  const autoMode = widget.locator('[data-theme-mode="auto"]');
  await darkMode.click();
  await expect(page.locator('html')).toHaveAttribute('data-effective-theme', 'dark');
  await expect(darkMode).toHaveAttribute('aria-pressed', 'true');
  await expect(widget.locator('[data-theme-mode-group]')).toHaveCSS('--theme-mode-index', '2');
  const darkEdgeState = await serviceRoot.evaluate((element) => ({
    compactFilter: getComputedStyle(element.closest('[data-mobile-menu]').querySelector('.mobile-island-surface')).filter,
    compactDepthFill: getComputedStyle(element.closest('[data-mobile-menu]').querySelector('.mobile-island-depth'), '::before').backgroundColor
  }));
  expect(darkEdgeState.compactFilter).not.toBe('none');
  expect(darkEdgeState.compactDepthFill).toBe('rgba(0, 0, 0, 0.09)');
  await page.waitForTimeout(1000);
  const sliderEndGaps = await widget.locator('[data-theme-mode-group]').evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    const matrixValues = style.transform === 'none'
      ? []
      : style.transform.replace('matrix(', '').replace(')', '').split(',').map(Number);
    const translateX = matrixValues.length === 6 ? matrixValues[4] : 0;
    const left = parseFloat(style.left) + translateX;
    const outerWidth = parseFloat(style.width)
      + parseFloat(style.borderLeftWidth)
      + parseFloat(style.borderRightWidth);
    return {
      left: parseFloat(style.left),
      right: element.getBoundingClientRect().width - left - outerWidth
    };
  });
  expect(Math.abs(sliderEndGaps.left - sliderEndGaps.right)).toBeLessThanOrEqual(0.25);
  await autoMode.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'auto');
  await expect(autoMode).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(() => {
    const home = document.querySelector('[data-mobile-menu-home]');
    window.scrollTo(0, home.offsetTop + home.offsetHeight + 80);
  });
  await expect(page.locator('[data-mobile-menu]')).toHaveClass(/is-visible/);
  await expect(page.locator('[data-mobile-menu]')).not.toHaveClass(/is-docking/);
  const fixedBottomGap = await serviceRoot.evaluate((element) => (
    window.innerHeight - element.getBoundingClientRect().bottom
  ));
  expect(fixedBottomGap).toBeGreaterThanOrEqual(11);

  await page.keyboard.press('Escape');
  await expect(daylightToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(serviceToggle).toHaveAttribute('aria-expanded', 'false');
});

test('stored mobile settings keep the final control row on the global bottom inset', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');

    window.localStorage.setItem('tarski-empathy-v1', JSON.stringify({
      date,
      answer: 'calm',
      motionAdapted: false
    }));
  });
  await page.goto('/?lang=ru');

  await page.locator('[data-mobile-service-toggle]').click();
  await page.locator('[data-daylight-toggle]').click();

  const service = page.locator('[data-mobile-service]');
  const menu = page.locator('[data-mobile-menu]');
  const widget = page.locator('[data-daylight-widget]');
  await expect(widget).toBeVisible();
  await expect(widget.locator('[data-empathy-panel]')).toBeHidden();
  await expect(widget.locator('[data-motion-mode-group]')).toBeVisible();
  await expect(menu).toHaveClass(/is-daylight-open/);
  await expect(menu).not.toHaveClass(/is-daylight-transitioning/);
  await expect.poll(() => service.evaluate((element) => {
    const root = element.closest('[data-mobile-menu]');
    const targetHeight = Number.parseFloat(
      getComputedStyle(root).getPropertyValue('--island-daylight-height')
    );
    return Math.abs(element.getBoundingClientRect().height - targetHeight);
  })).toBeLessThanOrEqual(0.5);

  const spacing = await service.evaluate((element) => {
    const menu = element.closest('[data-mobile-menu]');
    const surfaceRect = element.getBoundingClientRect();
    const finalRowRect = element.querySelector('.daylight-widget__motion').getBoundingClientRect();
    return {
      actual: surfaceRect.bottom - finalRowRect.bottom,
      token: Number.parseFloat(
        getComputedStyle(menu).getPropertyValue('--island-daylight-bottom-inset')
      )
    };
  });

  expect(spacing.actual).toBeCloseTo(spacing.token, 0);
});

test('daily empathy check-in stays local and exposes reversible motion adaptation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  await page.locator('[data-mobile-service-toggle]').click();
  await page.locator('[data-daylight-toggle]').click();
  const widget = page.locator('[data-daylight-widget]');
  const panel = widget.locator('[data-empathy-panel]');
  await expect(panel).toBeVisible();
  await expect(widget.locator('[data-empathy-settings]')).not.toHaveAttribute('inert', '');
  await expect(widget.locator('[data-theme-mode-group]')).toBeVisible();
  await expect(widget.locator('[data-motion-mode-group]')).toBeHidden();
  expect([
    'Как вы сегодня?',
    'Какой у вас сегодня внутренний ритм?',
    'Что вы замечаете в своём состоянии сегодня?'
  ]).toContain(await panel.locator('[data-empathy-question]').textContent());
  await expect(panel.locator('[data-empathy-storage-confirmation]')).toBeHidden();

  const questionGeometry = async () => panel.locator('[data-empathy-question-state]').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const question = element.querySelector('[data-empathy-question]');
    const options = element.querySelector('[data-empathy-options]');
    const optionsRect = options.getBoundingClientRect();
    const buttons = [...options.querySelectorAll('button')].map((button) => {
      const buttonRect = button.getBoundingClientRect();
      return { top: buttonRect.top - rect.top, height: buttonRect.height };
    });
    return {
      height: rect.height,
      questionFont: getComputedStyle(question).fontFamily,
      optionsTop: optionsRect.top - rect.top,
      bottomGap: rect.bottom - optionsRect.bottom,
      buttons
    };
  });
  const ruQuestionGeometry = await questionGeometry();
  expect(ruQuestionGeometry.questionFont).toContain('Arial');
  expect(ruQuestionGeometry.bottomGap).toBeGreaterThanOrEqual(-0.5);
  expect(ruQuestionGeometry.bottomGap).toBeLessThanOrEqual(1);
  await page.locator('[data-mobile-service-panel] [data-language-option="en"]').click();
  const enQuestionGeometry = await questionGeometry();
  await page.locator('[data-mobile-service-panel] [data-language-option="ja"]').click();
  const jaQuestionGeometry = await questionGeometry();
  for (const geometry of [enQuestionGeometry, jaQuestionGeometry]) {
    expect(geometry.height).toBeCloseTo(ruQuestionGeometry.height, 1);
    expect(geometry.optionsTop).toBeCloseTo(ruQuestionGeometry.optionsTop, 1);
    expect(geometry.bottomGap).toBeCloseTo(ruQuestionGeometry.bottomGap, 1);
    expect(geometry.buttons.map(({ height }) => height)).toEqual(ruQuestionGeometry.buttons.map(({ height }) => height));
  }
  await page.locator('[data-mobile-service-panel] [data-language-option="ru"]').click();

  await panel.locator('[data-empathy-answer="tired"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion-preference', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'calm');
  await expect(panel.locator('[data-empathy-question-state]')).toBeHidden();
  await expect(panel.locator('[data-empathy-feedback]')).toBeVisible();
  await expect(panel.locator('[data-empathy-feedback-text]')).toContainText('движение спокойнее');
  await expect(panel.locator('[data-empathy-storage-confirmation]')).toHaveText('Ответ сохранён только на этом устройстве.');
  await expect(panel.locator('[data-empathy-storage-confirmation]')).toBeVisible();
  await expect.poll(() => panel.locator('[data-empathy-feedback-text]').evaluate((element) => (
    getComputedStyle(element).fontFamily
  ))).toContain('Arial');
  const storedCheckIn = await page.evaluate(() => JSON.parse(localStorage.getItem('tarski-empathy-v1')));
  expect(storedCheckIn.answer).toBe('tired');
  expect(storedCheckIn.motionAdapted).toBe(true);
  await expect(panel).toHaveClass(/ym-hide-content/);
  await expect(panel).toHaveClass(/ym-disable-clickmap/);

  const feedbackActionGeometry = async () => panel.locator('[data-empathy-actions]').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const widget = element.closest('[data-daylight-widget]');
    const widgetRect = widget.getBoundingClientRect();
    const panelRect = element.closest('[data-empathy-panel]').getBoundingClientRect();
    const surfaceRect = document.querySelector('.mobile-service-surface').getBoundingClientRect();
    const copyRect = element.previousElementSibling.getBoundingClientRect();
    const buttons = [...element.querySelectorAll('button')].map((button) => {
      const buttonRect = button.getBoundingClientRect();
      return { top: buttonRect.top, height: buttonRect.height };
    });
    return {
      top: rect.top - widgetRect.top,
      widgetHeight: widgetRect.height,
      panelTop: panelRect.top - widgetRect.top,
      panelHeight: panelRect.height,
      surfaceTop: surfaceRect.top,
      surfaceBottom: surfaceRect.bottom,
      feedbackTop: copyRect.top,
      actionsBottom: rect.bottom,
      copyTop: copyRect.top - widgetRect.top,
      copyHeight: copyRect.height,
      buttons
    };
  });
  const ruGeometry = await feedbackActionGeometry();
  expect(ruGeometry.feedbackTop).toBeGreaterThanOrEqual(ruGeometry.surfaceTop);
  expect(ruGeometry.actionsBottom).toBeLessThanOrEqual(ruGeometry.surfaceBottom);
  await page.locator('[data-mobile-service-panel] [data-language-option="en"]').click();
  await expect(panel.locator('[data-empathy-feedback-text]')).toContainText('motion calmer');
  const enGeometry = await feedbackActionGeometry();
  await page.locator('[data-mobile-service-panel] [data-language-option="ja"]').click();
  const jaGeometry = await feedbackActionGeometry();
  for (const geometry of [enGeometry, jaGeometry]) {
    expect(Math.abs(geometry.top - ruGeometry.top)).toBeLessThanOrEqual(1);
    expect(geometry.buttons.map(({ height }) => height)).toEqual(ruGeometry.buttons.map(({ height }) => height));
  }
  await page.locator('[data-mobile-service-panel] [data-language-option="ru"]').click();

  await panel.locator('[data-empathy-undo]').click();
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'full');
  await expect(panel.locator('[data-empathy-feedback-text]')).toContainText('прежние настройки');
  await expect(panel).toBeVisible();
  await expect(widget.locator('[data-empathy-settings]')).toBeVisible();
  await expect(widget.locator('[data-empathy-settings]')).not.toHaveAttribute('inert', '');
  await expect(widget.locator('[data-motion-mode="system"]')).toHaveAttribute('aria-pressed', 'true');

  const setWeatherState = (weatherKey, temperature = 18) => page.evaluate(({ key, value }) => {
    const daylight = document.querySelector('[data-daylight-widget]');
    daylight.dataset.weatherKey = key;
    daylight.dataset.weatherTemperature = String(value);
    window.dispatchEvent(new CustomEvent('tarski:weatherchange', {
      detail: { weatherKey: key, temperature: value }
    }));
  }, { key: weatherKey, value: temperature });

  await setWeatherState('rain');
  await expect(widget.locator('[data-weather-care]')).toContainText('зонт может пригодиться');

  await setWeatherState('thunderstorm');
  const weatherCare = widget.locator('[data-weather-care]');
  const expectWeatherCareToFit = async () => {
    const overflow = await weatherCare.evaluate((element) => ({
      horizontal: element.scrollWidth - element.clientWidth,
      vertical: element.scrollHeight - element.clientHeight
    }));
    expect(overflow.horizontal).toBeLessThanOrEqual(1);
    expect(overflow.vertical).toBeLessThanOrEqual(1);
  };
  await expect(weatherCare).toHaveText('В грозу оставайтесь в помещении, вдали от окон.');
  await expectWeatherCareToFit();
  await page.locator('[data-mobile-service-panel] [data-language-option="en"]').click();
  await setWeatherState('thunderstorm');
  await expect(weatherCare).toHaveText('Thunderstorm: stay indoors, away from windows.');
  await expectWeatherCareToFit();
  await page.locator('[data-mobile-service-panel] [data-language-option="ja"]').click();
  await setWeatherState('thunderstorm');
  await expect(weatherCare).toHaveText('雷雨時は屋内に入り、窓から離れてください。');
  await expectWeatherCareToFit();
});

test('text controls stay vertically centered across mobile and desktop settings', async ({ page }) => {
  const measureVisibleTextControls = async (selector) => page.locator(selector).evaluateAll((controls) => (
    controls.flatMap((control) => {
      if (!control.getClientRects().length || !control.textContent.trim()) return [];
      const range = document.createRange();
      range.selectNodeContents(control);
      const labelRect = range.getBoundingClientRect();
      if (!labelRect.width || !labelRect.height) return [];
      const rect = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      return [{
        label: control.textContent.trim(),
        paddingDelta: Math.abs(parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)),
        centerDelta: Math.abs(
          (rect.top + rect.height / 2)
          - (labelRect.top + labelRect.height / 2)
        )
      }];
    })
  ));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru&empathy=preview');
  await page.locator('[data-mobile-service-toggle]').click();
  await page.locator('[data-daylight-toggle]').click();
  await page.locator('[data-daylight-widget] [data-empathy-answer="tired"]').click();
  const mobileControls = await measureVisibleTextControls('[data-mobile-menu] button');
  expect(mobileControls.length).toBeGreaterThan(10);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?lang=ru&empathy=preview');
  await page.locator('.nav-settings-toggle').click();
  const desktopControls = await measureVisibleTextControls('[data-site-settings] button, .artists-view-switch__button');
  expect(desktopControls.length).toBeGreaterThan(10);

  for (const control of [...mobileControls, ...desktopControls]) {
    expect(control.paddingDelta, `${control.label}: vertical padding`).toBeLessThanOrEqual(0.01);
    expect(control.centerDelta, `${control.label}: optical center`).toBeLessThanOrEqual(1);
  }
});

test('motion preference is available on desktop and shares one state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?lang=ru');

  const settingsButton = page.locator('.nav-settings-toggle');
  await expect(settingsButton).toBeVisible();
  await expect(settingsButton).toHaveText('Настройки сайта');
  await settingsButton.click();

  const siteSettings = page.locator('[data-site-settings]');
  await expect(siteSettings).toHaveClass(/is-open/);
  await siteSettings.locator('[data-site-settings-panel]').evaluate(async (panel) => {
    await Promise.all(panel.getAnimations().map((animation) => animation.finished));
  });
  const settingsMaterial = await siteSettings.locator('[data-site-settings-panel]').evaluate((panel) => {
    const style = getComputedStyle(panel);
    return {
      backgroundImage: style.backgroundImage,
      backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
    };
  });
  expect(settingsMaterial.backgroundImage).toBe('none');
  expect(settingsMaterial.backdropFilter).toContain('blur');
  await expect(siteSettings.locator('[data-settings-today]')).toBeVisible();
  await expect(siteSettings.locator('[data-settings-eyebrow]')).toHaveCount(0);
  await expect(siteSettings.locator('[data-settings-weather-status]')).toHaveText('Ясно');
  await expect(siteSettings.locator('[data-settings-weather-temperature]')).toHaveText('13\u202F°C');
  await expect(siteSettings.locator('[data-empathy-question]')).toBeVisible();

  const daylightChart = siteSettings.locator('[data-settings-daylight-chart]');
  await expect(daylightChart).toBeVisible();
  await expect(daylightChart.locator('[data-settings-daylight-sunrise]')).not.toHaveText('—:—');
  await expect(daylightChart.locator('[data-settings-daylight-sunset]')).not.toHaveText('—:—');
  const daylightGeometry = await daylightChart.evaluate((element) => {
    const svg = element.querySelector('svg');
    const paths = Array.from(svg.querySelectorAll('path'));
    const marker = element.querySelector('[data-settings-daylight-marker]');
    const box = svg.getBoundingClientRect();
    const markerBox = marker.getBoundingClientRect();
    const toScreenX = (path, point) => {
      const matrix = path.getScreenCTM();
      return new DOMPoint(point.x, point.y).matrixTransform(matrix).x;
    };
    return {
      svgHeight: box.height,
      markerWidth: markerBox.width,
      markerHeight: markerBox.height,
      edges: paths.map((path) => {
        const length = path.getTotalLength();
        return {
          leftInset: Math.abs(toScreenX(path, path.getPointAtLength(0)) - box.left),
          rightInset: Math.abs(box.right - toScreenX(path, path.getPointAtLength(length))),
        };
      }),
    };
  });
  expect(daylightGeometry.svgHeight).toBeGreaterThan(100);
  expect(Math.abs(daylightGeometry.markerWidth - daylightGeometry.markerHeight)).toBeLessThanOrEqual(0.5);
  daylightGeometry.edges.forEach(({ leftInset, rightInset }) => {
    expect(leftInset).toBeLessThanOrEqual(1.5);
    expect(rightInset).toBeLessThanOrEqual(1.5);
  });

  const closeButton = siteSettings.locator('.site-settings__close');
  const closeResting = await closeButton.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      width: rect.width,
      height: rect.height,
    };
  });
  expect(closeResting.width).toBeGreaterThanOrEqual(44);
  expect(closeResting.height).toBeGreaterThanOrEqual(44);
  await closeButton.hover();
  const closeHoverState = () => closeButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, border: style.borderTopColor };
  });
  await expect.poll(async () => (await closeHoverState()).background).not.toBe(closeResting.background);
  await expect.poll(async () => (await closeHoverState()).border).not.toBe(closeResting.border);
  const closeHovered = await closeHoverState();
  expect(closeHovered.background).not.toBe(closeResting.background);
  expect(closeHovered.border).not.toBe(closeResting.border);
  await page.mouse.down();
  await expect.poll(() => closeButton.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(siteSettings).toHaveClass(/is-open/);
  await siteSettings.locator('[data-site-settings-panel]').focus();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  const closeFocused = await closeButton.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(closeFocused).not.toBe('none');

  const settingsLanguages = siteSettings.locator('.site-settings__segmented--language');
  await expect(settingsLanguages).toBeVisible();
  await expect(settingsLanguages.locator('[data-language-option="ru"]')).toHaveAttribute('aria-pressed', 'true');
  const questionIndex = [
    'Как вы сегодня?',
    'Какой у вас сегодня внутренний ритм?',
    'Что вы замечаете в своём состоянии сегодня?',
  ].indexOf(await siteSettings.locator('[data-empathy-question]').innerText());
  expect(questionIndex).toBeGreaterThanOrEqual(0);
  await settingsLanguages.locator('[data-language-option="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(siteSettings.locator('[data-settings-language-title]')).toHaveText('Language');
  await expect(siteSettings.locator('[data-empathy-question]')).toHaveText([
    'How are you today?',
    'What is your inner rhythm today?',
    'What do you notice about how you feel today?',
  ][questionIndex]);
  await settingsLanguages.locator('[data-language-option="ja"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(siteSettings.locator('[data-settings-language-title]')).toHaveText('言語');
  await expect(siteSettings.locator('[data-empathy-question]')).toHaveText([
    '今日はどんな調子ですか？',
    '今日の心のリズムはどんな感じですか？',
    '今日の自分の状態に何を感じますか？',
  ][questionIndex]);
  await settingsLanguages.locator('[data-language-option="ru"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  const answerAlignment = await siteSettings.locator('[data-empathy-answer]').evaluateAll((buttons) => (
    buttons.map((button) => {
      const style = getComputedStyle(button);
      return {
        display: style.display,
        placeItems: style.placeItems,
        textAlign: style.textAlign,
      };
    })
  ));
  answerAlignment.forEach((alignment) => {
    expect(alignment.display).toBe('grid');
    expect(alignment.placeItems).toBe('center');
    expect(alignment.textAlign).toBe('center');
  });

  const desktopGroup = siteSettings.locator('[data-motion-mode-group]');
  const calm = desktopGroup.locator('[data-motion-mode="calm"]');
  await expect(desktopGroup).toBeVisible();
  await expect(calm).toHaveText('Спокойный');
  await calm.click();

  await expect(page.locator('html')).toHaveAttribute('data-motion-preference', 'calm');
  await expect(calm).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-daylight-widget] [data-motion-mode="calm"]')).toHaveAttribute('aria-pressed', 'true');
  await siteSettings.locator('[data-settings-close]').last().click();
  await expect(siteSettings).toBeHidden();
  await expect(settingsButton).toBeFocused();

  const ctaAlignment = await page.locator('.site-footer__cta').evaluate((element) => {
    const label = element.querySelector('[data-footer-cta-label]').getBoundingClientRect();
    const arrow = element.querySelector('.site-footer__cta-arrow').getBoundingClientRect();
    return {
      top: Math.abs(label.top - arrow.top),
      gap: arrow.left - label.right,
    };
  });
  expect(ctaAlignment.top).toBeLessThanOrEqual(3);
  expect(ctaAlignment.gap).toBeGreaterThanOrEqual(12);
  expect(ctaAlignment.gap).toBeLessThanOrEqual(24);

  const footerGeometry = await page.locator('.site-footer').evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollHeight: element.scrollHeight,
    viewportHeight: window.innerHeight,
    routeDecorationCount: element.querySelectorAll('.site-footer__routes [aria-hidden="true"]').length,
  }));
  expect(footerGeometry.height).toBeLessThanOrEqual(footerGeometry.viewportHeight);
  expect(footerGeometry.scrollHeight).toBeLessThanOrEqual(footerGeometry.viewportHeight + 1);
  expect(footerGeometry.routeDecorationCount).toBe(0);

  await expect(page.locator('.footer-motion-panel, .site-footer__motion, .site-footer__settings')).toHaveCount(0);
  const settingsMetaGeometry = await settingsButton.evaluate((element) => ({
    parentClass: element.parentElement?.className,
    borderWidth: getComputedStyle(element).borderTopWidth,
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
  }));
  expect(settingsMetaGeometry.parentClass).toContain('nav-service-panel');
  expect(settingsMetaGeometry.borderWidth).toBe('0px');
  expect(settingsMetaGeometry.width).toBeCloseTo(20, 0);
  expect(settingsMetaGeometry.height).toBeCloseTo(20, 0);

  const serviceGeometry = await page.locator('.nav-service-panel').evaluate((element) => {
    const panel = element.getBoundingClientRect();
    const theme = element.querySelector('[data-theme-toggle]').getBoundingClientRect();
    const settings = element.querySelector('[data-settings-open]').getBoundingClientRect();
    const themeStroke = parseFloat(getComputedStyle(element.querySelector('.theme-toggle__icon')).borderTopWidth);
    const settingsStroke = parseFloat(getComputedStyle(element.querySelector('.nav-settings-toggle svg')).strokeWidth);
    return {
      themeContained: theme.left >= panel.left && theme.right <= panel.right,
      settingsContained: settings.left >= panel.left && settings.right <= panel.right,
      gap: settings.left - theme.right,
      rightInset: panel.right - settings.right,
      centerDelta: Math.abs((theme.top + theme.height / 2) - (settings.top + settings.height / 2)),
      strokeDelta: Math.abs(themeStroke - settingsStroke),
    };
  });
  expect(serviceGeometry.themeContained).toBe(true);
  expect(serviceGeometry.settingsContained).toBe(true);
  expect(serviceGeometry.gap).toBeGreaterThanOrEqual(3);
  expect(serviceGeometry.gap).toBeLessThanOrEqual(10);
  expect(serviceGeometry.rightInset).toBeGreaterThanOrEqual(10);
  expect(serviceGeometry.centerDelta).toBeLessThanOrEqual(1);
  expect(serviceGeometry.strokeDelta).toBeLessThanOrEqual(0.5);

  const firstRoute = page.locator('[data-footer-route]').first();
  const routeState = async () => firstRoute.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    border: getComputedStyle(element).borderBottomColor,
    labelTransform: getComputedStyle(element.querySelector('span')).transform,
  }));
  const routeDefault = await routeState();
  await firstRoute.hover();
  await expect.poll(async () => (await routeState()).border).not.toBe(routeDefault.border);
  const routeHover = await routeState();
  expect(routeHover.background).toBe(routeDefault.background);
  expect(routeHover.labelTransform).not.toBe(routeDefault.labelTransform);

  const settingsColor = async () => settingsButton.evaluate((element) => getComputedStyle(element).color);
  const settingsColorDefault = await settingsColor();
  await settingsButton.hover();
  await expect.poll(settingsColor).not.toBe(settingsColorDefault);

  const footerMetaLink = page.locator('.site-footer__privacy');
  await footerMetaLink.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect.poll(() => footerMetaLink.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');

  const desktopLensMaterial = await page.locator('.main-nav').evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return { filter: style.filter, shadow: style.boxShadow };
  });
  expect(desktopLensMaterial.filter).toContain('drop-shadow');
  expect(desktopLensMaterial.shadow).not.toBe('none');
});

test('main mobile menu launches the existing daylight widget', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  await page.locator('[data-mobile-menu-toggle]').click();
  await expect(page.locator('#mobile-menu-expanded')).toBeVisible();
  await page.locator('[data-daylight-launcher]').click();

  await expect(page.locator('[data-mobile-menu-toggle]')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-mobile-service-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-daylight-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-daylight-widget]')).toBeVisible();
  await expect(page.locator('[data-daylight-widget]')).toHaveCount(1);
});

test('widget language switching preserves the live page and preview URL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru&preview=mobile-lens-cluster&review=locale-switch');

  const service = page.locator('[data-mobile-service]');
  const widget = page.locator('[data-daylight-widget]');
  await page.locator('[data-mobile-service-toggle]').click();
  await page.locator('[data-daylight-toggle]').click();
  await expect(widget).toBeVisible();

  await service.locator('[data-language-option="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(service).toBeVisible();
  await expect(widget).toBeVisible();
  const englishParams = await page.evaluate(() => Object.fromEntries(new URLSearchParams(window.location.search)));
  expect(englishParams).toMatchObject({
    lang: 'en',
    preview: 'mobile-lens-cluster',
    review: 'locale-switch'
  });
  await expect(widget.locator('[data-theme-mode="light"]')).toHaveText('Day');
  await expect(widget.locator('[data-theme-mode="dark"]')).toHaveText('Night');

  await service.locator('[data-language-option="ja"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(service).toBeVisible();
  await expect(widget).toBeVisible();
  const japaneseParams = await page.evaluate(() => Object.fromEntries(new URLSearchParams(window.location.search)));
  expect(japaneseParams).toMatchObject({
    lang: 'ja',
    preview: 'mobile-lens-cluster',
    review: 'locale-switch'
  });
  await expect(widget.locator('[data-theme-mode="light"]')).toHaveText('昼');
  await expect(widget.locator('[data-theme-mode="dark"]')).toHaveText('夜');
});

test('mobile archipelago stays opaque while entering at both scroll placements', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ru');

  const menu = page.locator('[data-mobile-menu]');
  await expect(menu).toHaveClass(/is-home-arriving/);
  await expect(menu).toHaveAttribute('data-placement-motion-phase', 'initial-home');

  const initialMotion = await menu.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      name: getComputedStyle(element).animationName,
      keyframes: animation?.effect?.getKeyframes().map(({ opacity, translate, transform }) => ({
        opacity,
        translate,
        transform
      })) || []
    };
  });

  expect(initialMotion.name).toBe('mobile-island-home-arrival');
  expect(initialMotion.keyframes.every(({ opacity }) => !opacity || opacity === '1')).toBe(true);
  expect(initialMotion.keyframes[0].translate).toBe('0px -20px');
  expect(initialMotion.keyframes.at(-1).translate).toBe('0px');
  await expect(menu).toHaveCSS('opacity', '1');
  await expect(menu).not.toHaveClass(/is-home-arriving/);
  await expect.poll(() => menu.getAttribute('data-placement-motion-phase')).toBeNull();

  const pendingPresentation = await menu.evaluate((element) => {
    element.classList.add('is-placement-pending');
    const style = getComputedStyle(element);
    const presentation = {
      opacity: style.opacity,
      visibility: style.visibility,
      translate: style.translate
    };
    element.classList.remove('is-placement-pending');
    return presentation;
  });
  expect(pendingPresentation).toEqual({
    opacity: '1',
    visibility: 'visible',
    translate: '0px -20px'
  });

  const threshold = await page.locator('[data-mobile-menu-home]').evaluate((element) => (
    element.getBoundingClientRect().bottom + window.scrollY + 12
  ));

  await page.evaluate((top) => window.scrollTo(0, top), threshold);
  await expect.poll(() => menu.evaluate((element) => ({
    visible: element.classList.contains('is-visible'),
    moving: element.classList.contains('is-docking'),
    phase: element.dataset.placementMotionPhase || null
  }))).toEqual({ visible: true, moving: true, phase: 'dock' });

  const dockingMotion = await menu.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      name: getComputedStyle(element).animationName,
      keyframes: animation?.effect?.getKeyframes().map(({ opacity, translate, transform }) => ({
        opacity,
        translate,
        transform
      })) || []
    };
  });

  expect(dockingMotion.name).toBe('mobile-island-dock-in');
  expect(dockingMotion.keyframes.every(({ opacity }) => !opacity || opacity === '1')).toBe(true);
  expect(dockingMotion.keyframes[0].translate).toBe('0px 100%');
  expect(dockingMotion.keyframes.at(-1).translate).toBe('0px');
  expect(dockingMotion.keyframes.every(({ transform }) => !transform || transform === 'none')).toBe(true);
  await expect(menu).toHaveCSS('opacity', '1');

  await expect(menu).not.toHaveClass(/is-docking/);
  await expect.poll(() => menu.getAttribute('data-placement-motion-phase')).toBeNull();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => menu.evaluate((element) => ({
    visible: element.classList.contains('is-visible'),
    moving: element.classList.contains('is-returning-home'),
    phase: element.dataset.placementMotionPhase || null
  }))).toEqual({ visible: false, moving: true, phase: 'return-home' });

  const homeMotion = await menu.evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      name: getComputedStyle(element).animationName,
      keyframes: animation?.effect?.getKeyframes().map(({ opacity, translate, transform }) => ({
        opacity,
        translate,
        transform
      })) || []
    };
  });

  expect(homeMotion.name).toBe('mobile-island-home-in');
  expect(homeMotion.keyframes.every(({ opacity }) => !opacity || opacity === '1')).toBe(true);
  expect(homeMotion.keyframes[0].translate).toBe('0px -18px');
  expect(homeMotion.keyframes.at(-1).translate).toBe('0px');
  expect(homeMotion.keyframes.every(({ transform }) => !transform || transform === 'none')).toBe(true);
  await expect(menu).toHaveCSS('opacity', '1');
  await expect(menu).not.toHaveClass(/is-returning-home/);
  await expect.poll(() => menu.getAttribute('data-placement-motion-phase')).toBeNull();
});

test('artist names remain headings with one keyboard trigger each', async ({ page }) => {
  await page.goto('/?lang=ru#artists');

  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('#artists-title')).toHaveJSProperty('tagName', 'H2');
  const cards = page.locator('.artist-card');
  await expect(cards).toHaveCount(7);
  await expect(page.locator('.artist-card__name')).toHaveCount(7);
  expect(await page.locator('.artist-card__name').evaluateAll((headings) => (
    headings.every((heading) => heading.tagName === 'H3')
  ))).toBe(true);
  await expect(page.locator('.artist-card__detail-trigger')).toHaveCount(7);
  await expect(page.locator('.artist-card__image[role="button"], .artist-card__image[tabindex]')).toHaveCount(0);

  const viewSwitch = page.locator('[data-artists-view-switch]');
  await expect(viewSwitch).toHaveCSS('height', '40px');
  const trackGeometry = await viewSwitch.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      radius: parseFloat(style.borderTopLeftRadius),
      clip: style.clipPath,
      height: rect.height
    };
  });
  expect(trackGeometry.radius).toBeGreaterThanOrEqual(trackGeometry.height / 2);
  expect(trackGeometry.clip).toContain('round 999px');
  const cloudView = page.locator('[data-artists-view-option="cloud"]');
  const listView = page.locator('[data-artists-view-option="list"]');
  await cloudView.focus();
  await page.keyboard.press('ArrowRight');
  await expect(listView).toBeFocused();
  await expect(listView).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Home');
  await expect(cloudView).toBeFocused();
  await expect(cloudView).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('End');
  await expect(listView).toBeFocused();
  await expect(listView).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => viewSwitch.evaluate((element) => (
    element.style.getPropertyValue('--artists-view-index')
  ))).toBe('1');
  await expect.poll(() => viewSwitch.evaluate((element) => {
    const transform = getComputedStyle(element, '::before').transform;
    const values = transform.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number) || [];
    return values[4] || 0;
  })).toBeGreaterThan(60);
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
