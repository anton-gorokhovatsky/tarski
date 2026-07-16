(() => {
  const widget = document.querySelector('[data-daylight-widget]');
  const toggle = document.querySelector('[data-daylight-toggle]');
  const service = widget?.closest('[data-mobile-service]');
  const serviceToggle = service?.querySelector('[data-mobile-service-toggle]');
  const menu = service?.closest('[data-mobile-menu]');
  const marker = widget?.querySelector('[data-daylight-marker]');
  const markerHalo = widget?.querySelector('[data-daylight-marker-halo]');
  const status = widget?.querySelector('[data-daylight-status]');
  const nowLabel = widget?.querySelector('[data-daylight-now]');
  const sunriseLabel = widget?.querySelector('[data-daylight-sunrise]');
  const sunsetLabel = widget?.querySelector('[data-daylight-sunset]');
  const temperatureLabel = widget?.querySelector('[data-weather-temperature]');
  const settingsWeatherStatus = document.querySelector('[data-settings-weather-status]');
  const settingsTemperatureLabel = document.querySelector('[data-settings-weather-temperature]');
  const settingsDaylightChart = document.querySelector('[data-settings-daylight-chart]');
  const settingsMarker = document.querySelector('[data-settings-daylight-marker]');
  const settingsMarkerHalo = document.querySelector('[data-settings-daylight-marker-halo]');
  const settingsSunriseLabel = document.querySelector('[data-settings-daylight-sunrise]');
  const settingsSunsetLabel = document.querySelector('[data-settings-daylight-sunset]');
  const launchers = Array.from(document.querySelectorAll('[data-daylight-launcher]'));

  if (!widget || !toggle || !service || !serviceToggle || !menu || !marker || !markerHalo || !temperatureLabel) return;

  const getLabel = (path, fallback) => window.tarskiI18n?.t(path) || fallback;
  const formatTime = (date, timeZone) => {
    const language = window.tarskiI18n?.getLanguage?.() || 'ru';
    const locales = { ru: 'ru-RU', en: 'en-US', ja: 'ja-JP' };
    const formatted = new Intl.DateTimeFormat(locales[language] || locales.ru, {
      hour: language === 'en' ? 'numeric' : '2-digit',
      minute: '2-digit',
      timeZone
    }).format(date);

    return language === 'en'
      ? formatted.replace(/\s*(AM|PM)$/i, (_, dayPeriod) => ` ${dayPeriod.toLowerCase()}`)
      : formatted;
  };
  const renderTime = (element, date, timeZone) => {
    if (!element) return;
    const value = formatTime(date, timeZone);
    element.textContent = value;
    element.setAttribute('aria-label', value);
  };
  const motion = window.tarskiMobileIslandMotion;
  const motionTargets = [
    service,
    service.querySelector('.mobile-service-panel'),
    toggle,
    widget,
    menu.querySelector('.mobile-service-depth'),
    menu.querySelector('.mobile-service-surface')
  ].filter(Boolean);

  let openFrame = null;
  let markerFrame = null;
  let weatherRequest = null;
  let cachedWeather = null;
  let weatherFetchedAt = 0;

  const getWeatherKey = (code) => {
    if (code === 0) return 'clear';
    if (code === 1 || code === 2) return 'partlyCloudy';
    if (code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
    if ([61, 63, 65, 66, 67].includes(code)) return 'rain';
    if ([80, 81, 82].includes(code)) return 'showers';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if ([95, 96, 99].includes(code)) return 'thunderstorm';
    return 'cloudy';
  };

  const weatherFallbacks = {
    clear: 'Clear',
    partlyCloudy: 'Partly cloudy',
    cloudy: 'Cloudy',
    fog: 'Fog',
    drizzle: 'Drizzle',
    rain: 'Rain',
    showers: 'Showers',
    snow: 'Snow',
    thunderstorm: 'Thunderstorm'
  };

  const syncWeather = (fallbackStatus) => {
    if (!cachedWeather) {
      status.textContent = fallbackStatus;
      temperatureLabel.textContent = '—\u202F°C';
      if (settingsWeatherStatus) {
        settingsWeatherStatus.textContent = getLabel('ui.settings.weatherLoading', 'Погода загружается…');
        delete settingsWeatherStatus.dataset.weatherKey;
      }
      if (settingsTemperatureLabel) settingsTemperatureLabel.textContent = '—\u202F°C';
      delete widget.dataset.weatherKey;
      delete widget.dataset.weatherTemperature;
      return;
    }

    const weatherKey = getWeatherKey(cachedWeather.code);
    const weatherLabel = getLabel(`ui.weather.${weatherKey}`, weatherFallbacks[weatherKey]);
    const temperature = `${Math.round(cachedWeather.temperature)}\u202F°C`;
    status.textContent = weatherLabel;
    temperatureLabel.textContent = temperature;
    if (settingsWeatherStatus) {
      settingsWeatherStatus.textContent = weatherLabel;
      settingsWeatherStatus.dataset.weatherKey = weatherKey;
    }
    if (settingsTemperatureLabel) settingsTemperatureLabel.textContent = temperature;
    widget.dataset.weatherKey = weatherKey;
    widget.dataset.weatherTemperature = String(cachedWeather.temperature);
    window.dispatchEvent(new CustomEvent('tarski:weatherchange', {
      detail: { weatherKey, temperature: cachedWeather.temperature }
    }));
  };

  const loadWeather = async () => {
    if (cachedWeather && Date.now() - weatherFetchedAt < 15 * 60 * 1000) {
      return cachedWeather;
    }
    if (weatherRequest) return weatherRequest;

    const position = window.tarskiTheme?.getSolarPosition?.();
    if (!position) return null;

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(position.latitude),
      longitude: String(position.longitude),
      current: 'temperature_2m,weather_code',
      temperature_unit: 'celsius',
      timezone: position.timeZone
    }).toString();

    weatherRequest = fetch(url, { mode: 'cors' })
      .then((response) => {
        if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const temperature = Number(data.current?.temperature_2m);
        const code = Number(data.current?.weather_code);
        if (!Number.isFinite(temperature) || !Number.isFinite(code)) return null;

        cachedWeather = { temperature, code };
        weatherFetchedAt = Date.now();
        syncWidget();
        return cachedWeather;
      })
      .catch(() => null)
      .finally(() => {
        weatherRequest = null;
      });

    return weatherRequest;
  };

  const setMarkerProgress = (progress) => {
    const markerX = 6 + (220 * progress);
    const markerY = 46.5 - (39.5 * Math.sin(Math.PI * progress));

    [marker, settingsMarker].forEach((target) => {
      if (!target) return;
      target.setAttribute('cx', markerX.toFixed(2));
      target.setAttribute('cy', markerY.toFixed(2));
    });
    [markerHalo, settingsMarkerHalo].forEach((target) => {
      if (!target) return;
      target.setAttribute('cx', markerX.toFixed(2));
      target.setAttribute('cy', markerY.toFixed(2));
    });
  };

  const animateMarker = (targetProgress) => {
    window.cancelAnimationFrame(markerFrame);

    if (prefersCalmMotion()) {
      setMarkerProgress(targetProgress);
      return;
    }

    const startedAt = performance.now();
    const duration = 820;
    widget.classList.remove('is-marker-arriving');
    settingsDaylightChart?.classList.remove('is-marker-arriving');
    widget.getBoundingClientRect();
    widget.classList.add('is-marker-arriving');
    settingsDaylightChart?.classList.add('is-marker-arriving');

    const tick = (now) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setMarkerProgress(targetProgress * eased);

      if (elapsed < 1) {
        markerFrame = window.requestAnimationFrame(tick);
      } else {
        markerFrame = null;
        widget.classList.remove('is-marker-arriving');
        settingsDaylightChart?.classList.remove('is-marker-arriving');
      }
    };

    setMarkerProgress(0);
    markerFrame = window.requestAnimationFrame(tick);
  };

  const updateViewportInset = () => {
    const viewport = window.visualViewport;
    const coveredBottom = viewport
      ? Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)
      : 0;
    menu.style.setProperty('--mobile-visual-bottom-inset', `${coveredBottom}px`);
  };

  const syncWidget = (options = {}) => {
    const daylight = window.tarskiTheme?.getDaylightState?.();
    if (!daylight) return;

    const progress = Math.min(1, Math.max(0, daylight.progress));
    const statusLabel = daylight.isDay
      ? getLabel('ui.daylightDay', 'Световой день')
      : getLabel('ui.daylightNight', 'Ночь');

    if (options.animateMarker) animateMarker(progress);
    else setMarkerProgress(progress);
    syncWeather(statusLabel);
    renderTime(nowLabel, daylight.now, daylight.timeZone);
    nowLabel.setAttribute('datetime', daylight.now.toISOString());
    renderTime(sunriseLabel, daylight.sunrise, daylight.timeZone);
    sunriseLabel.setAttribute('datetime', daylight.sunrise.toISOString());
    renderTime(sunsetLabel, daylight.sunset, daylight.timeZone);
    sunsetLabel.setAttribute('datetime', daylight.sunset.toISOString());
    renderTime(settingsSunriseLabel, daylight.sunrise, daylight.timeZone);
    settingsSunriseLabel?.setAttribute('datetime', daylight.sunrise.toISOString());
    renderTime(settingsSunsetLabel, daylight.sunset, daylight.timeZone);
    settingsSunsetLabel?.setAttribute('datetime', daylight.sunset.toISOString());
    widget.dataset.phase = daylight.isDay ? 'day' : 'night';
  };

  const syncToggleLabel = () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    const label = isOpen
      ? getLabel('ui.themeSettingsClose', 'Закрыть настройки темы')
      : getLabel('ui.themeSettingsOpen', 'Открыть настройки темы');
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  };

  const setOpen = (isOpen, options = {}) => {
    const motionTicket = motion.begin('daylight');
    window.cancelAnimationFrame(openFrame);
    openFrame = null;

    if (isOpen) {
      updateViewportInset();
      widget.hidden = false;
      widget.setAttribute('aria-hidden', 'false');
      syncWidget({ animateMarker: true });
      loadWeather();
      toggle.setAttribute('aria-expanded', 'true');
      menu.classList.remove('is-daylight-closing');
      menu.classList.add('is-daylight-transitioning');
      menu.getBoundingClientRect();
      openFrame = window.requestAnimationFrame(() => {
        openFrame = null;
        if (!motion.isCurrent(motionTicket) || toggle.getAttribute('aria-expanded') !== 'true') return;
        menu.classList.add('is-daylight-open');
        service.classList.add('is-daylight-open');
        widget.classList.add('is-visible');

        motion.wait(motionTicket, motionTargets).then((isCurrent) => {
          if (!isCurrent || toggle.getAttribute('aria-expanded') !== 'true') return;
          menu.classList.remove('is-daylight-transitioning');
          if (options.focusToggle) focusWithoutScroll(toggle);
        });
      });
      syncToggleLabel();
      return;
    }

    window.cancelAnimationFrame(markerFrame);
    markerFrame = null;
    widget.classList.remove('is-marker-arriving');
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-daylight-transitioning');
    menu.classList.add('is-daylight-closing');
    menu.classList.remove('is-daylight-open');
    service.classList.remove('is-daylight-open');
    widget.classList.remove('is-visible');
    widget.setAttribute('aria-hidden', 'true');
    syncToggleLabel();

    motion.wait(motionTicket, motionTargets).then((isCurrent) => {
      if (!isCurrent || toggle.getAttribute('aria-expanded') === 'true') return;
      menu.classList.remove('is-daylight-closing');
      widget.hidden = true;
    });

    if (options.restoreFocus) {
      window.requestAnimationFrame(() => focusWithoutScroll(toggle));
    }
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    if (event.detail > 0) toggle.blur();
  });

  launchers.forEach((launcher) => {
    launcher.addEventListener('click', (event) => {
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('tarski:daylightrequest'));
      if (event.detail > 0) launcher.blur();
    });
  });

  serviceToggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  }, { capture: true });

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(false, { restoreFocus: true });
  }, { capture: true });

  window.addEventListener('tarski:daylightclose', () => setOpen(false));
  window.addEventListener('tarski:daylightrequest', () => {
    window.dispatchEvent(new CustomEvent('tarski:mobileserviceopenrequest'));
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setOpen(true, { focusToggle: true }));
    });
  });
  window.addEventListener('tarski:themechange', syncWidget);
  window.addEventListener('tarski:languagechange', () => {
    syncWidget();
    syncToggleLabel();
  });
  window.addEventListener('resize', updateViewportInset);
  window.visualViewport?.addEventListener('resize', updateViewportInset);
  window.visualViewport?.addEventListener('scroll', updateViewportInset);

  updateViewportInset();
  syncWidget();
  syncToggleLabel();
  setOpen(false);

  window.tarskiDaylight = {
    refresh: (options = {}) => {
      syncWidget(options);
      return loadWeather();
    }
  };
})();
