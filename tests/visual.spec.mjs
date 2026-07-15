import { expect, test } from '@playwright/test';

const languages = ['ru', 'en', 'ja'];
const themes = ['light', 'dark'];
const frozenDate = '2026-07-14T12:00:00+03:00';

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

const freezePageState = async (page, theme, options = {}) => {
  const date = options.date || frozenDate;
  const empathyAnswer = Object.hasOwn(options, 'empathyAnswer') ? options.empathyAnswer : 'skip';
  await page.addInitScript(({ date, theme, empathyAnswer }) => {
    const NativeDate = Date;
    const frozenTime = new NativeDate(date).getTime();

    class FrozenDate extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [frozenTime]));
      }

      static now() {
        return frozenTime;
      }
    }

    window.Date = FrozenDate;
    window.localStorage.setItem('tarski-theme', theme);
    if (empathyAnswer) {
      window.localStorage.setItem('tarski-empathy-v1', JSON.stringify({
        date: date.slice(0, 10),
        answer: empathyAnswer,
        motionAdapted: false
      }));
    } else {
      window.localStorage.removeItem('tarski-empathy-v1');
    }
  }, { date, empathyAnswer, theme });
};

const settlePage = async (page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.documentElement.dataset.visualRegression = 'true';
  });
};

const snapshot = async (page, name) => {
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.008,
    scale: 'css'
  });
};

for (const language of languages) {
  for (const theme of themes) {
    test(`visual matrix: ${language} ${theme} mobile menu states`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await freezePageState(page, theme);
      await page.goto(`/?lang=${language}&review=visual-matrix`);
      await settlePage(page);

      const menuRoot = page.locator('[data-mobile-menu]');
      const serviceRoot = page.locator('[data-mobile-service]');

      await snapshot(page, `mobile-${language}-${theme}-compact.png`);

      await page.locator('[data-mobile-service-toggle]').click();
      await expect(serviceRoot).toHaveClass(/is-open/);
      await snapshot(page, `mobile-${language}-${theme}-service.png`);

      await page.locator('[data-daylight-toggle]').click();
      await expect(page.locator('[data-daylight-widget]')).toBeVisible();
      await page.waitForTimeout(900);
      await expect(serviceRoot).toHaveClass(/is-daylight-open/);
      await snapshot(page, `mobile-${language}-${theme}-widget.png`);

      await page.keyboard.press('Escape');
      await expect(page.locator('[data-daylight-widget]')).toBeHidden();
      await page.keyboard.press('Escape');
      await expect(serviceRoot).not.toHaveClass(/is-open/);

      await page.locator('[data-mobile-menu-toggle]').click();
      await expect(menuRoot).toHaveClass(/is-menu-settled/);
      await snapshot(page, `mobile-${language}-${theme}-menu.png`);
    });
  }
}

for (const language of languages) {
  for (const theme of themes) {
    test(`visual matrix: ${language} ${theme} desktop footer`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await freezePageState(page, theme);
      await page.goto(`/?lang=${language}&review=visual-footer`);
      await settlePage(page);

      const footer = page.locator('[data-semantic-footer]');
      await footer.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await snapshot(page, `desktop-${language}-${theme}-footer.png`);
    });
  }
}

for (const language of languages) {
  for (const theme of themes) {
    test(`visual matrix: ${language} ${theme} desktop settings today`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await freezePageState(page, theme, {
        date: '2026-07-15T12:00:00+03:00',
        empathyAnswer: null
      });
      await page.goto(`/?lang=${language}&review=visual-settings-today`);
      await settlePage(page);

      const settingsButton = page.locator('.nav-settings-toggle');
      await settingsButton.click();

      const settings = page.locator('[data-site-settings]');
      await expect(settings).toHaveClass(/is-open/);
      await expect(settings.locator('[data-settings-today]')).toBeVisible();
      await expect(settings.locator('[data-settings-weather-temperature]')).toHaveText('13\u202F°C');
      await expect(settings.locator('[data-empathy-question-state]')).toBeVisible();
      await snapshot(page, `desktop-${language}-${theme}-settings-today.png`);
    });
  }
}

for (const language of languages) {
  for (const theme of themes) {
    test(`visual matrix: ${language} ${theme} empathy question`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await freezePageState(page, theme, {
        date: '2026-07-15T12:00:00+03:00',
        empathyAnswer: null
      });
      await page.goto(`/?lang=${language}&review=visual-empathy&empathy=preview`);
      await settlePage(page);

      await page.locator('[data-mobile-service-toggle]').click();
      await page.locator('[data-daylight-toggle]').click();
      await expect(page.locator('[data-empathy-panel]')).toBeVisible();
      await snapshot(page, `mobile-${language}-${theme}-empathy.png`);
    });
  }
}

for (const language of languages) {
  for (const theme of themes) {
    test(`visual matrix: ${language} ${theme} desktop menu`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await freezePageState(page, theme);
      await page.goto(`/?lang=${language}&review=visual-matrix`);
      await settlePage(page);

      await snapshot(page, `desktop-${language}-${theme}-menu.png`);
    });
  }
}
