import { expect, test } from '@playwright/test';

const storageKey = 'tarski-empathy-v1';
const dates = [
  ['2026-07-14T12:00:00+03:00', 'Какой у вас сегодня внутренний ритм?'],
  ['2026-07-15T12:00:00+03:00', 'Что вы замечаете в своём состоянии сегодня?'],
  ['2026-07-16T12:00:00+03:00', 'Как вы сегодня?']
];

const freezeDate = async (page, date) => {
  await page.addInitScript((value) => {
    const NativeDate = Date;
    const frozenTime = new NativeDate(value).getTime();
    class FrozenDate extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [frozenTime]));
      }
      static now() {
        return frozenTime;
      }
    }
    window.Date = FrozenDate;
  }, date);
};

const openWidget = async (page) => {
  await page.locator('[data-mobile-service-toggle]').click();
  await page.locator('[data-daylight-toggle]').click();
  const widget = page.locator('[data-daylight-widget]');
  await expect(widget).toBeVisible();
  return widget;
};

test.beforeEach(async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ current: { temperature_2m: 13.2, weather_code: 0 } })
  }));
  await page.setViewportSize({ width: 390, height: 844 });
});

for (const [date, expectedQuestion] of dates) {
  test(`daily question is deterministic on ${date.slice(0, 10)}`, async ({ page }) => {
    await freezeDate(page, date);
    await page.goto('/?lang=ru&empathy=preview');
    const widget = await openWidget(page);
    await expect(widget.locator('[data-empathy-question]')).toHaveText(expectedQuestion);

    const geometry = await widget.locator('[data-empathy-question-state]').evaluate((element) => {
      const panelRect = element.getBoundingClientRect();
      const copyRect = element.querySelector('.daylight-widget__empathy-copy').getBoundingClientRect();
      const optionsRect = element.querySelector('[data-empathy-options]').getBoundingClientRect();
      const buttons = [...element.querySelectorAll('[data-empathy-answer]')].map((button) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          textAlign: style.textAlign,
        };
      });
      return {
        copyBottom: copyRect.bottom,
        optionsTop: optionsRect.top,
        optionsBottom: optionsRect.bottom,
        panelBottom: panelRect.bottom,
        buttonWidths: buttons.map(({ width }) => width),
        buttonHeights: buttons.map(({ height }) => height),
        buttonTextAlignments: buttons.map(({ textAlign }) => textAlign),
        secondRowInsetLeft: buttons[3].left - buttons[0].left,
        secondRowInsetRight: buttons[2].right - buttons[4].right,
        buttonsInsideOptions: buttons.every(({ top, bottom }) => (
          top >= optionsRect.top && bottom <= optionsRect.bottom
        ))
      };
    });
    expect(geometry.copyBottom).toBeLessThanOrEqual(geometry.optionsTop);
    expect(geometry.optionsBottom).toBeLessThanOrEqual(geometry.panelBottom);
    expect(geometry.buttonHeights.every((height) => height === 32)).toBe(true);
    expect(geometry.buttonTextAlignments.every((alignment) => alignment === 'center')).toBe(true);
    expect(Math.max(...geometry.buttonWidths) - Math.min(...geometry.buttonWidths)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.secondRowInsetLeft - geometry.secondRowInsetRight)).toBeLessThanOrEqual(1);
    expect(geometry.secondRowInsetLeft).toBeGreaterThan(0);
    expect(geometry.buttonsInsideOptions).toBe(true);

    await widget.locator('[data-empathy-answer="skip"]').click();
    await expect(widget.locator('[data-empathy-feedback]')).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  });
}

test('every answer produces one clear, reversible response', async ({ page }) => {
  await freezeDate(page, dates[0][0]);
  const answers = [
    ['calm', 'full', false],
    ['tired', 'calm', true],
    ['tense', 'calm', true],
    ['curious', 'full', false],
    ['skip', 'full', false]
  ];

  for (const [answer, motion, canUndo] of answers) {
    await page.goto('/?lang=ru&empathy=preview');
    const widget = await openWidget(page);
    await widget.locator(`[data-empathy-answer="${answer}"]`).click();
    await expect(widget.locator('[data-empathy-feedback]')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-effective-motion', motion);
    if (canUndo) await expect(widget.locator('[data-empathy-undo]')).toBeVisible();
    else await expect(widget.locator('[data-empathy-undo]')).toBeHidden();
    await expect(widget.locator('[data-empathy-feedback]')).toBeFocused();
    await expect(widget.locator('[data-empathy-settings]')).toBeVisible();
    await expect(widget.locator('[data-empathy-settings]')).not.toHaveAttribute('inert', '');
    await expect(widget.locator(`[data-motion-mode="${canUndo ? 'calm' : 'system'}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(widget.locator('[data-theme-mode="auto"]')).toHaveAttribute('aria-pressed', 'true');
  }
});

test('desktop Today keeps the same optional check-in and balanced answer geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await freezeDate(page, dates[1][0]);
  await page.goto('/?lang=ru&empathy=preview');

  const settingsButton = page.locator('.nav-settings-toggle');
  await settingsButton.click();

  const settings = page.locator('[data-site-settings]');
  await settings.locator('[data-site-settings-panel]').evaluate(async (panel) => {
    await Promise.all(panel.getAnimations().map((animation) => animation.finished));
  });
  const today = settings.locator('[data-settings-today]');
  await expect(today).toBeVisible();
  await expect(today.locator('[data-empathy-question]')).toHaveText(dates[1][1]);

  const geometry = await today.locator('[data-empathy-options]').evaluate((element) => {
    const optionsRect = element.getBoundingClientRect();
    const buttons = [...element.querySelectorAll('[data-empathy-answer]')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, width: rect.width, height: rect.height };
    });
    return {
      optionsLeft: optionsRect.left,
      optionsRight: optionsRect.right,
      widths: buttons.map(({ width }) => width),
      heights: buttons.map(({ height }) => height),
      secondRowInsetLeft: buttons[3].left - optionsRect.left,
      secondRowInsetRight: optionsRect.right - buttons[4].right,
      rowCount: new Set(buttons.map(({ top }) => Math.round(top))).size
    };
  });
  expect(Math.max(...geometry.widths) - Math.min(...geometry.widths)).toBeLessThanOrEqual(1);
  expect(Math.max(...geometry.heights) - Math.min(...geometry.heights)).toBeLessThanOrEqual(0.1);
  expect(Math.abs(geometry.secondRowInsetLeft - geometry.secondRowInsetRight)).toBeLessThanOrEqual(1);
  expect(geometry.secondRowInsetLeft).toBeGreaterThan(0);
  expect(geometry.rowCount).toBe(2);

  await today.locator('[data-empathy-answer="curious"]').click();
  await expect(today.locator('[data-empathy-feedback]')).toBeVisible();
  await expect(today.locator('[data-empathy-feedback-text]')).toContainText('Исследуйте в своём ритме');
  await expect(today.locator('[data-empathy-storage-confirmation]')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'full');
  await expect(today.locator('[data-empathy-undo]')).toBeHidden();
});

test('today record is restored, while stale and malformed records are discarded', async ({ page }) => {
  await freezeDate(page, dates[0][0]);
  await page.addInitScript(({ storageKey }) => {
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify({
        date: '2026-07-14',
        answer: 'tired',
        motionAdapted: true
      }));
    }
  }, { storageKey });
  await page.goto('/?lang=ru');
  let widget = await openWidget(page);
  await expect(widget.locator('[data-empathy-panel]')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'calm');

  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      date: '2026-07-13',
      answer: 'tired',
      motionAdapted: true
    }));
  }, storageKey);
  await page.reload();
  widget = await openWidget(page);
  await expect(widget.locator('[data-empathy-panel]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-effective-motion', 'full');
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();

  await page.evaluate((key) => localStorage.setItem(key, '{not-json'), storageKey);
  await page.reload();
  widget = await openWidget(page);
  await expect(widget.locator('[data-empathy-panel]')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});
