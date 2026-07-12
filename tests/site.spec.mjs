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
    footerCta: 'Написать нам',
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
    footerCta: 'Contact us',
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
    footerCta: 'お問い合わせ',
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
      compactBackdrop: getComputedStyle(menuRoot.querySelector('.mobile-island-surface')).backdropFilter,
      compactBackground: getComputedStyle(menuRoot.querySelector('.mobile-island-surface')).backgroundImage,
      compactFilter: getComputedStyle(menuRoot.querySelector('.mobile-island-surface')).filter,
      compactDepthFilter: getComputedStyle(menuRoot.querySelector('.mobile-island-depth')).filter,
      compactPseudoContent: getComputedStyle(menuRoot.querySelector('.mobile-island-surface'), '::before').content,
      expandedBackdrop: getComputedStyle(menuRoot, '::after').backdropFilter,
      expandedBackground: getComputedStyle(menuRoot, '::after').backgroundImage,
      expandedFilter: getComputedStyle(menuRoot, '::after').filter,
      serviceDepthFilter: getComputedStyle(menuRoot.querySelector('.mobile-service-depth')).filter,
      menuDepthFilter: getComputedStyle(menuRoot.querySelector('.mobile-menu-expanded-depth')).filter,
      height: serviceRoot.getBoundingClientRect().height,
      serviceMaterialTransform: getComputedStyle(menuRoot, '::after').transform,
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
  expect(serviceSurface.compactPseudoContent).toBe('none');
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
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'auto');

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
  await page.waitForTimeout(900);

  const expandedGeometry = await serviceRoot.evaluate((element) => {
    const menu = element.closest('[data-mobile-menu]');
    const widgetElement = element.querySelector('[data-daylight-widget]');
    const serviceRect = element.getBoundingClientRect();
    const widgetRect = widgetElement.getBoundingClientRect();
    const chartRect = widgetElement.querySelector('.daylight-widget__chart').getBoundingClientRect();
    const chartSvg = widgetElement.querySelector('.daylight-widget__chart svg');
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
      menuHasWidgetState: menu.classList.contains('is-daylight-open'),
      materialRadius: getComputedStyle(menu, '::after').borderRadius,
      ghostShadowContent: getComputedStyle(element, '::after').content,
      widgetInsetLeft: widgetRect.left - serviceRect.left,
      widgetInsetRight: serviceRect.right - widgetRect.right,
      widgetInsetBottom: serviceRect.bottom - widgetRect.bottom,
      chartInsetLeft: chartRect.left - serviceRect.left,
      chartInsetRight: serviceRect.right - chartRect.right,
      chartPreserveAspectRatio: chartSvg.getAttribute('preserveAspectRatio'),
      metaInsetLeft: metaRect.left - serviceRect.left,
      metaInsetRight: serviceRect.right - metaRect.right,
      weatherInsetLeft: weatherRect.left - serviceRect.left,
      weatherInsetRight: serviceRect.right - weatherRect.right,
      modesInsetLeft: modesRect.left - serviceRect.left,
      modesInsetRight: serviceRect.right - modesRect.right,
      motionInsetLeft: motionRect.left - serviceRect.left,
      motionInsetRight: serviceRect.right - motionRect.right,
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
  expect(expandedGeometry.height).toBeGreaterThanOrEqual(372);
  expect(expandedGeometry.height).toBeLessThanOrEqual(380);
  expect(expandedGeometry.menuHasWidgetState).toBe(true);
  expect(expandedGeometry.ghostShadowContent).toBe('none');
  expect(expandedGeometry.widgetInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.widgetInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.widgetInsetBottom).toBeGreaterThanOrEqual(24);
  expect(expandedGeometry.chartInsetLeft).toBeCloseTo(0, 1);
  expect(expandedGeometry.chartInsetRight).toBeCloseTo(0, 1);
  expect(expandedGeometry.chartPreserveAspectRatio).toBe('none');
  expect(expandedGeometry.metaInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.metaInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.weatherInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.weatherInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.modesInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.modesInsetRight).toBeCloseTo(28, 0);
  expect(expandedGeometry.motionInsetLeft).toBeCloseTo(28, 0);
  expect(expandedGeometry.motionInsetRight).toBeCloseTo(28, 0);
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

test('motion preference is available on desktop and shares one state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?lang=ru');

  const desktopGroup = page.locator('.footer-motion-panel');
  const calm = desktopGroup.locator('[data-motion-mode="calm"]');
  await desktopGroup.scrollIntoViewIfNeeded();
  await expect(desktopGroup).toBeVisible();
  await expect(calm).toHaveText('Спокойный');
  await calm.click();

  await expect(page.locator('html')).toHaveAttribute('data-motion-preference', 'calm');
  await expect(calm).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-daylight-widget] [data-motion-mode="calm"]')).toHaveAttribute('aria-pressed', 'true');

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

  const motionAlignment = await page.locator('.site-footer__motion').evaluate((element) => {
    const label = element.querySelector('[data-motion-label]').getBoundingClientRect();
    const control = element.querySelector('.footer-motion-panel').getBoundingClientRect();
    const routes = document.querySelector('.site-footer__routes').getBoundingClientRect();
    return {
      labelLeft: Math.abs(label.left - routes.left),
      rowRight: Math.abs(element.getBoundingClientRect().right - routes.right),
      labelControlGap: control.left - label.right,
    };
  });
  expect(motionAlignment.labelLeft).toBeLessThanOrEqual(1);
  expect(motionAlignment.rowRight).toBeLessThanOrEqual(1);
  expect(motionAlignment.labelControlGap).toBeGreaterThanOrEqual(12);
  expect(motionAlignment.labelControlGap).toBeLessThanOrEqual(20);

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
