import { expect, test } from '@playwright/test';

const locales = {
  ru: {
    home: '/?lang=ru#artists',
    catalog: '/artists/',
    profile: '/artists/anastasia-dahl/',
    name: 'Анастасия Даль',
    title: 'Художники'
  },
  en: {
    home: '/?lang=en#artists',
    catalog: '/artists/en/',
    profile: '/artists/anastasia-dahl/en/',
    name: 'Anastasia Dahl',
    title: 'Artists'
  },
  ja: {
    home: '/?lang=ja#artists',
    catalog: '/artists/ja/',
    profile: '/artists/anastasia-dahl/ja/',
    name: 'アナスタシア・ダール',
    title: 'アーティスト'
  }
};

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', (route) => route.abort());
});

test('artist registry drives localized homepage copy and preview metadata', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const [locale, copy] of Object.entries(locales)) {
    await page.goto(copy.home);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.artist-card')).toHaveCount(7);
    await expect(page.locator('.artist-index__link')).toHaveCount(7);
    await expect(page.locator('#artist-anastasia-dahl .artist-card__detail-trigger')).toHaveText(copy.name);

    const firstLink = page.locator('.artist-index__link').first();
    await firstLink.focus();
    await expect(firstLink).toHaveAttribute('data-preview-src', /artist-index/);
    await expect(page.locator('.artist-index')).toHaveCSS('--artist-index-preview', /url/);

    await page.locator('.artist-index__link[href="#artist-alina-kugush"]').click();
    const galleryImages = page.locator('[data-artist-dossier-gallery] img');
    await expect(galleryImages).toHaveCount(7);
    const galleryAlts = await galleryImages.evaluateAll((images) => (
      images.map((image) => image.getAttribute('alt'))
    ));
    expect(galleryAlts.every((alt) => Boolean(alt?.trim()))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-artist-dossier]')).toHaveAttribute('aria-hidden', 'true');
  }
});

test('static artist catalog and profile pages stay localized, semantic, and reflow-safe', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });

  for (const [locale, copy] of Object.entries(locales)) {
    await page.goto(copy.catalog);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveText(copy.title);
    await expect(page.locator('.artist-directory__item')).toHaveCount(7);
    await expect(page.locator('.artist-directory__link').first()).toHaveAttribute('href', copy.profile);
    const catalogOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(catalogOverflow).toBeLessThanOrEqual(0);

    await page.goto(copy.profile);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveText(copy.name);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://tarski.ru${copy.profile}`
    );

    const audit = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(({ id }) => id);
      return {
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        missingAlt: document.querySelectorAll('img:not([alt])').length,
        h1Count: document.querySelectorAll('main h1').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        rootMetrics: {
          htmlClient: document.documentElement.clientWidth,
          htmlScroll: document.documentElement.scrollWidth,
          bodyClient: document.body.clientWidth,
          bodyScroll: document.body.scrollWidth
        },
        offenders: [...document.querySelectorAll('body *')]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return style.display !== 'none'
              && style.position !== 'fixed'
              && (rect.left < -0.5 || rect.right > document.documentElement.clientWidth + 0.5);
          })
          .slice(0, 8)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return `${element.tagName.toLowerCase()}.${element.className || '-'} (${Math.round(rect.left)}…${Math.round(rect.right)})`;
          }),
        scrollOffenders: [...document.querySelectorAll('body, body *')]
          .filter((element) => element.scrollWidth > element.clientWidth + 0.5)
          .slice(0, 8)
          .map((element) => `${element.tagName.toLowerCase()}.${element.className || '-'} (${element.clientWidth}→${element.scrollWidth})`)
      };
    });
    expect(audit.duplicateIds).toEqual([]);
    expect(audit.missingAlt).toBe(0);
    expect(audit.h1Count).toBe(1);
    const overflowDetails = [...audit.offenders, ...audit.scrollOffenders].join('\n');
    expect(audit.overflow, overflowDetails).toBeLessThanOrEqual(0);

    await page.keyboard.press('Tab');
    await expect(page.locator('.artist-page__skip')).toBeFocused();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(locales.ru.catalog);
  const desktopOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(desktopOverflow).toBeLessThanOrEqual(0);
});
