const focusWithoutScroll = (element) => {
  if (!(element instanceof HTMLElement)) return;

  try {
    element.focus({ preventScroll: true });
  } catch (error) {
    element.focus();
  }
};

const getVisibleFocusableElements = (root) => {
  if (!root) return [];

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  return Array.from(root.querySelectorAll(focusableSelector)).filter((element) => (
    element instanceof HTMLElement
    && !element.hidden
    && !element.closest('[hidden]')
    && element.offsetParent !== null
  ));
};

const prefersCalmMotion = () => (
  window.tarskiMotion?.isCalm?.()
  || window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const createMobileIslandMotionCoordinator = () => {
  const generations = new Map();

  const begin = (channel) => {
    const generation = (generations.get(channel) || 0) + 1;
    generations.set(channel, generation);
    return { channel, generation };
  };

  const isCurrent = (ticket) => (
    ticket
    && generations.get(ticket.channel) === ticket.generation
  );

  const collectAnimations = (elements) => {
    const animations = new Set();

    elements.filter(Boolean).forEach((element) => {
      if (typeof element.getAnimations !== 'function') return;
      element.getAnimations().forEach((animation) => {
        if (animation.playState === 'running' || animation.playState === 'pending') {
          animations.add(animation);
        }
      });
    });

    return [...animations];
  };

  const parseTimes = (value) => value.split(',').map((part) => {
    const time = Number.parseFloat(part);
    if (!Number.isFinite(time)) return 0;
    return part.trim().endsWith('ms') ? time : time * 1000;
  });

  const getLongestStyleMotion = (element) => {
    const style = window.getComputedStyle(element);
    const getLongestTrack = (durationValue, delayValue) => {
      const durations = parseTimes(durationValue);
      const delays = parseTimes(delayValue);
      const trackCount = Math.max(durations.length, delays.length);

      return Math.max(0, ...Array.from({ length: trackCount }, (_, index) => (
        durations[index % durations.length] + delays[index % delays.length]
      )));
    };

    return Math.max(
      getLongestTrack(style.transitionDuration, style.transitionDelay),
      getLongestTrack(style.animationDuration, style.animationDelay)
    );
  };

  const wait = async (ticket, elements) => {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    if (!isCurrent(ticket)) return false;

    const animations = collectAnimations(elements);
    if (animations.length) {
      await Promise.allSettled(animations.map((animation) => animation.finished));
    } else {
      const fallbackDuration = Math.max(0, ...elements.filter(Boolean).map(getLongestStyleMotion));
      if (fallbackDuration > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, fallbackDuration));
      }
    }

    return isCurrent(ticket);
  };

  return { begin, isCurrent, wait };
};

window.tarskiMobileIslandMotion = createMobileIslandMotionCoordinator();

(() => {
  const iconLink = document.querySelector('link[rel~="icon"]');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const version = '20260701-caps-favicon';
  const frames = [
    'assets/favicon.svg',
    'assets/favicon-a.svg',
    'assets/favicon-r.svg',
    'assets/favicon-s.svg',
    'assets/favicon-k.svg',
    'assets/favicon-i.svg'
  ];

  if (!iconLink) return;

  let frameIndex = 0;
  let timer = null;

  const frameUrl = (path) => new URL(`${path}?v=${version}`, document.baseURI).href;

  const setFrame = (index) => {
    iconLink.href = frameUrl(frames[index]);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }

    frameIndex = 0;
    setFrame(frameIndex);
  };

  const start = () => {
    stop();

    if (prefersCalmMotion()) return;

    timer = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      setFrame(frameIndex);
    }, 800);
  };

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', start);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(start);
  }

  window.addEventListener('tarski:motionchange', start);

  start();
})();
(() => {
  const storageKey = 'tarski-theme';
  const themeToggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const themeModeControls = Array.from(document.querySelectorAll('[data-theme-mode]'));
  const themeModeGroups = Array.from(document.querySelectorAll('[data-theme-mode-group]'));
  const themeColors = {
    light: '#f2f2f2',
    dark: '#101010'
  };
  const solarPosition = {
    latitude: 55.7558,
    longitude: 37.6173,
    timeZone: 'Europe/Moscow'
  };

  const getLabel = (path, fallback) => window.tarskiI18n?.t(path) || fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normalizeDegrees = (value) => ((value % 360) + 360) % 360;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const toDegrees = (radians) => radians * (180 / Math.PI);

  const getZonedDateParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: solarPosition.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day)
    };
  };

  const getDayOfYear = ({ year, month, day }) => {
    const start = Date.UTC(year, 0, 0);
    const current = Date.UTC(year, month - 1, day);
    return Math.floor((current - start) / 86400000);
  };

  const getSolarEventUtcHours = (dayOfYear, isSunrise) => {
    const longitudeHour = solarPosition.longitude / 15;
    const approximateTime = dayOfYear + (((isSunrise ? 6 : 18) - longitudeHour) / 24);
    const meanAnomaly = (0.9856 * approximateTime) - 3.289;
    const trueLongitude = normalizeDegrees(
      meanAnomaly
      + (1.916 * Math.sin(toRadians(meanAnomaly)))
      + (0.02 * Math.sin(toRadians(2 * meanAnomaly)))
      + 282.634
    );
    let rightAscension = normalizeDegrees(toDegrees(Math.atan(0.91764 * Math.tan(toRadians(trueLongitude)))));
    const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
    const rightAscensionQuadrant = Math.floor(rightAscension / 90) * 90;
    rightAscension = (rightAscension + longitudeQuadrant - rightAscensionQuadrant) / 15;

    const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
    const cosDeclination = Math.cos(Math.asin(sinDeclination));
    const cosHourAngle = (
      Math.cos(toRadians(90.833))
      - (sinDeclination * Math.sin(toRadians(solarPosition.latitude)))
    ) / (cosDeclination * Math.cos(toRadians(solarPosition.latitude)));

    if (cosHourAngle > 1 || cosHourAngle < -1) return isSunrise ? 6 : 18;

    const hourAngle = (
      isSunrise
        ? 360 - toDegrees(Math.acos(cosHourAngle))
        : toDegrees(Math.acos(cosHourAngle))
    ) / 15;
    const localMeanTime = hourAngle + rightAscension - (0.06571 * approximateTime) - 6.622;
    return ((localMeanTime - longitudeHour) % 24 + 24) % 24;
  };

  const getDaylightState = (now = new Date()) => {
    const dateParts = getZonedDateParts(now);
    const dayOfYear = getDayOfYear(dateParts);
    const utcMidnight = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day);
    const sunrise = new Date(utcMidnight + (getSolarEventUtcHours(dayOfYear, true) * 3600000));
    const sunset = new Date(utcMidnight + (getSolarEventUtcHours(dayOfYear, false) * 3600000));
    const isDay = now >= sunrise && now < sunset;
    const progress = clamp((now - sunrise) / Math.max(1, sunset - sunrise), 0, 1);

    return { now, sunrise, sunset, isDay, progress, timeZone: solarPosition.timeZone };
  };

  const getStoredMode = () => {
    try {
      const mode = window.localStorage.getItem(storageKey);
      return mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'auto';
    } catch (error) {
      return 'auto';
    }
  };

  const setStoredMode = (mode) => {
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch (error) {
      // The toggle still works for the current page when storage is unavailable.
    }
  };

  const getEffectiveTheme = (mode = getStoredMode(), daylight = getDaylightState()) => {
    if (mode === 'dark' || mode === 'light') return mode;
    return daylight.isDay ? 'light' : 'dark';
  };

  const updateThemeColor = (theme) => {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', themeColors[theme]));
  };

  const syncThemeControls = (theme, mode = getStoredMode()) => {
    const isDark = theme === 'dark';
    const label = isDark
      ? getLabel('ui.themeLight', 'Включить светлую тему')
      : getLabel('ui.themeDark', 'Включить темную тему');

    themeToggles.forEach((toggle) => {
      toggle.setAttribute('aria-pressed', String(isDark));

      if (toggle.matches('[data-daylight-toggle], [data-daylight-launcher]')) {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        const settingsLabel = isOpen
          ? getLabel('ui.themeSettingsClose', 'Закрыть настройки темы')
          : getLabel('ui.themeSettingsOpen', 'Открыть настройки темы');
        toggle.setAttribute('aria-label', settingsLabel);
        toggle.setAttribute('title', settingsLabel);
      } else {
        toggle.setAttribute('aria-label', label);
        toggle.setAttribute('title', label);
      }
    });

    themeModeControls.forEach((control) => {
      control.setAttribute('aria-pressed', String(control.dataset.themeMode === mode));
    });

    const modeIndex = Math.max(0, ['auto', 'light', 'dark'].indexOf(mode));
    themeModeGroups.forEach((group) => {
      group.style.setProperty('--theme-mode-index', String(modeIndex));
    });
  };

  const applyTheme = (mode = getStoredMode()) => {
    const daylight = getDaylightState();
    const effectiveTheme = getEffectiveTheme(mode, daylight);

    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.themePreference = mode;
    document.documentElement.dataset.effectiveTheme = effectiveTheme;
    updateThemeColor(effectiveTheme);
    syncThemeControls(effectiveTheme, mode);
    window.dispatchEvent(new CustomEvent('tarski:themechange', {
      detail: { theme: effectiveTheme, mode, daylight }
    }));
  };

  const setMode = (mode) => {
    const nextMode = mode === 'light' || mode === 'dark' ? mode : 'auto';
    setStoredMode(nextMode);
    applyTheme(nextMode);
  };

  themeToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      if (toggle.matches('[data-daylight-toggle], [data-daylight-launcher]')) return;
      const nextTheme = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
      setMode(nextTheme);
    });
  });

  themeModeControls.forEach((control) => {
    control.addEventListener('click', () => setMode(control.dataset.themeMode));
  });

  const refreshAutoTheme = () => {
    if (getStoredMode() === 'auto') {
      applyTheme('auto');
    } else {
      syncThemeControls(getEffectiveTheme(), getStoredMode());
    }
  };

  let minuteTimer = window.setInterval(refreshAutoTheme, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshAutoTheme();
  });
  window.addEventListener('pagehide', () => window.clearInterval(minuteTimer), { once: true });
  window.addEventListener('tarski:languagechange', refreshAutoTheme);

  window.tarskiTheme = {
    applyTheme,
    getDaylightState,
    getEffectiveTheme,
    getMode: getStoredMode,
    getSolarPosition: () => ({ ...solarPosition }),
    setMode
  };

  applyTheme();
})();
