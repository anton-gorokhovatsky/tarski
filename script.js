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

    if (reduceMotionQuery.matches) return;

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

  start();
})();

(() => {
  const storageKey = 'tarski-theme';
  const themeToggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const themeColors = {
    light: '#f2f2f2',
    dark: '#101010'
  };

  const getLabel = (path, fallback) => window.tarskiI18n?.t(path) || fallback;

  const getStoredTheme = () => {
    try {
      const theme = window.localStorage.getItem(storageKey);
      return theme === 'dark' || theme === 'light' ? theme : null;
    } catch (error) {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {
      // The toggle still works for the current page when storage is unavailable.
    }
  };

  const getEffectiveTheme = (theme = getStoredTheme()) => {
    if (theme === 'dark' || theme === 'light') return theme;
    return systemThemeQuery.matches ? 'dark' : 'light';
  };

  const updateThemeColor = (theme) => {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', themeColors[theme]));
  };

  const syncThemeControls = (theme) => {
    const isDark = theme === 'dark';
    const label = isDark
      ? getLabel('ui.themeLight', 'Включить светлую тему')
      : getLabel('ui.themeDark', 'Включить темную тему');

    themeToggles.forEach((toggle) => {
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.setAttribute('title', label);
    });
  };

  const applyTheme = (theme = getStoredTheme()) => {
    const effectiveTheme = getEffectiveTheme(theme);

    if (theme === 'dark' || theme === 'light') {
      document.documentElement.dataset.theme = theme;
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    document.documentElement.dataset.effectiveTheme = effectiveTheme;
    updateThemeColor(effectiveTheme);
    syncThemeControls(effectiveTheme);
    window.dispatchEvent(new CustomEvent('tarski:themechange', {
      detail: { theme: effectiveTheme }
    }));
  };

  themeToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const nextTheme = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
      setStoredTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });

  systemThemeQuery.addEventListener('change', () => {
    if (!getStoredTheme()) {
      applyTheme(null);
    }
  });

  window.addEventListener('tarski:languagechange', () => syncThemeControls(getEffectiveTheme()));

  applyTheme();
})();

(() => {
  const service = document.querySelector('[data-mobile-service]');
  const menu = service?.closest('[data-mobile-menu]');
  const toggle = service?.querySelector('[data-mobile-service-toggle]');
  const panel = service?.querySelector('[data-mobile-service-panel]');
  const code = service?.querySelector('[data-mobile-service-code]');
  const languageCodes = {
    ru: 'RU',
    en: 'EN',
    ja: 'JP'
  };

  if (!service || !toggle || !panel || !code) return;

  const getLabel = (isOpen) => {
    const path = isOpen ? 'ui.serviceClose' : 'ui.serviceOpen';
    const fallback = isOpen ? 'Закрыть настройки сайта' : 'Открыть настройки сайта';
    return window.tarskiI18n?.t(path) || fallback;
  };

  const syncLanguageCode = () => {
    const language = window.tarskiI18n?.getLanguage?.() || 'ru';
    code.textContent = languageCodes[language] || language.toUpperCase();
  };

  let hidePanelTimer = null;
  let collapseTimer = null;
  let handoffTimer = null;
  let returningTimer = null;
  let activeTrigger = null;

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setToggleState = (isOpen) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', getLabel(isOpen));
    toggle.setAttribute('title', getLabel(isOpen));
  };

  const updateServiceShellWidth = () => {
    if (!menu) return;

    const wasHidden = panel.hidden;
    const wasOpen = service.classList.contains('is-open');
    const wasClosing = service.classList.contains('is-closing');
    const wasMenuOpen = menu.classList.contains('is-service-open');

    panel.hidden = false;
    menu.classList.add('is-service-open');
    service.classList.remove('is-closing');
    service.classList.add('is-open');

    const menuStyle = window.getComputedStyle(menu);
    const panelWidth = panel.getBoundingClientRect().width;
    const gap = Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-open-gap')) || 0;
    const padX = (Number.parseFloat(menuStyle.paddingLeft) || 0)
      + (Number.parseFloat(menuStyle.paddingRight) || 0);
    const toggleWidth = Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-toggle-open-size'))
      || toggle.getBoundingClientRect().height;
    const minShellWidth = Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-shell-min-width')) || 0;
    const shellWidth = Math.ceil(Math.max(minShellWidth, panelWidth + gap + toggleWidth + padX));

    menu.style.setProperty('--mobile-service-shell-width', `${shellWidth}px`);

    menu.classList.toggle('is-service-open', wasMenuOpen);
    service.classList.toggle('is-open', wasOpen);
    service.classList.toggle('is-closing', wasClosing);
    panel.hidden = wasHidden;
  };

  const setPanelHiddenState = (isHidden) => {
    panel.hidden = isHidden;
    panel.setAttribute('aria-hidden', String(isHidden));
  };

  const setOpen = (isOpen, options = {}) => {
    window.clearTimeout(hidePanelTimer);
    window.clearTimeout(collapseTimer);
    window.clearTimeout(handoffTimer);
    window.clearTimeout(returningTimer);

    const isActive = service.classList.contains('is-open')
      || service.classList.contains('is-closing')
      || menu?.classList.contains('is-service-open')
      || menu?.classList.contains('is-service-handoff')
      || menu?.classList.contains('is-service-returning')
      || toggle.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      if (!isActive) {
        activeTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      }
      window.dispatchEvent(new CustomEvent('tarski:mobileserviceopen'));
    }

    if (!isOpen && !isActive) {
      setToggleState(false);
      setPanelHiddenState(true);
      service.classList.remove('is-open', 'is-closing');
      menu?.classList.remove('is-service-open', 'is-service-handoff', 'is-service-returning');
      activeTrigger = null;
      return;
    }

    if (isOpen) {
      updateServiceShellWidth();
      setPanelHiddenState(false);
      service.classList.remove('is-closing');
      menu?.classList.remove('is-service-returning');

      if (service.classList.contains('is-open') || menu?.classList.contains('is-service-open')) {
        setToggleState(true);
        service.classList.add('is-open');
        menu?.classList.add('is-service-open');
        menu?.classList.remove('is-service-handoff');
        return;
      }

      menu?.classList.add('is-service-handoff');
    }

    window.requestAnimationFrame(() => {
      const handoffDelay = prefersReducedMotion() ? 0 : 160;
      const returningDelay = prefersReducedMotion() ? 0 : 400;

      setToggleState(isOpen);

      if (isOpen) {
        handoffTimer = window.setTimeout(() => {
          service.classList.add('is-open');
          menu?.classList.add('is-service-open');
          menu?.classList.remove('is-service-handoff');
        }, handoffDelay);
        return;
      }

      service.classList.add('is-closing');
      collapseTimer = window.setTimeout(() => {
        service.classList.remove('is-open', 'is-closing');
        menu?.classList.remove('is-service-open', 'is-service-handoff');
        menu?.classList.add('is-service-returning');
        window.dispatchEvent(new CustomEvent('tarski:mobileislandresize'));
        returningTimer = window.setTimeout(() => {
          menu?.classList.remove('is-service-returning');
        }, returningDelay);
      }, handoffDelay);
    });

    if (!isOpen) {
      const shouldRestoreFocus = options.restoreFocus !== false;
      if (shouldRestoreFocus && activeTrigger instanceof HTMLElement && service.contains(document.activeElement)) {
        const triggerToRestore = activeTrigger;
        window.setTimeout(() => focusWithoutScroll(triggerToRestore), 0);
      }

      activeTrigger = null;

      hidePanelTimer = window.setTimeout(() => {
        if (!service.classList.contains('is-open')) {
          setPanelHiddenState(true);
          service.classList.remove('is-closing');
        }
      }, prefersReducedMotion() ? 0 : 720);
    }
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    if (event.detail > 0) {
      toggle.blur();
    }
  });

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('click', (event) => {
    if (!service.contains(event.target)) {
      setOpen(false, { restoreFocus: false });
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
      }
      setOpen(false);
    }
  });

  window.addEventListener('tarski:languagechange', () => {
    syncLanguageCode();
    updateServiceShellWidth();
    if (toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(true);
    }
  });

  window.addEventListener('resize', updateServiceShellWidth);
  window.addEventListener('tarski:mobilemenuopen', () => setOpen(false));
  document.fonts?.ready?.then(updateServiceShellWidth);

  syncLanguageCode();
  updateServiceShellWidth();
  setOpen(false);
})();

(() => {
  const menu = document.querySelector('[data-mobile-menu]');
  const toggle = document.querySelector('[data-mobile-menu-toggle]');
  const drawer = document.querySelector('[data-mobile-menu-drawer]');
  const panel = menu?.querySelector('.mobile-menu-expanded');
  const closeControls = Array.from(document.querySelectorAll('[data-mobile-menu-close]'));

  if (!menu || !toggle || !drawer || !panel) return;

  let hideTimer = null;
  let returnTimer = null;
  let activeTrigger = null;

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const getLabel = (isOpen) => {
    const path = isOpen ? 'ui.menuClose' : 'ui.menuOpen';
    const fallback = isOpen ? 'Закрыть меню' : 'Открыть меню';
    return window.tarskiI18n?.t(path) || fallback;
  };

  const syncToggleState = (isOpen) => {
    const label = getLabel(isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  };

  const setOpen = (isOpen, options = {}) => {
    window.clearTimeout(hideTimer);
    window.clearTimeout(returnTimer);

    if (isOpen) {
      activeTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      window.dispatchEvent(new CustomEvent('tarski:mobilemenuopen'));
      drawer.hidden = false;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      menu.classList.remove('is-menu-returning');
      syncToggleState(true);
      panel.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        menu.classList.add('is-menu-open');
        drawer.classList.add('is-open');
        window.dispatchEvent(new CustomEvent('tarski:mobileislandresize'));
        if (options.focus) {
          window.setTimeout(() => panel.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 220);
        }
      });
      return;
    }

    const shouldRestoreFocus = options.restoreFocus !== false;
    drawer.classList.remove('is-open');
    menu.classList.add('is-menu-returning');
    menu.classList.remove('is-menu-open');
    panel.setAttribute('aria-hidden', 'true');
    syncToggleState(false);
    window.dispatchEvent(new CustomEvent('tarski:mobileislandresize'));

    if (shouldRestoreFocus && activeTrigger instanceof HTMLElement) {
      window.setTimeout(() => focusWithoutScroll(activeTrigger), 0);
    }

    activeTrigger = null;

    returnTimer = window.setTimeout(() => {
      menu.classList.remove('is-menu-returning');
    }, prefersReducedMotion() ? 0 : 520);

    hideTimer = window.setTimeout(() => {
      if (!drawer.classList.contains('is-open')) {
        drawer.hidden = true;
        panel.hidden = true;
      }
    }, prefersReducedMotion() ? 0 : 520);
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(toggle.getAttribute('aria-expanded') !== 'true', { focus: event.detail > 0 });
    if (event.detail > 0) {
      toggle.blur();
    }
  });

  closeControls.forEach((control) => {
    control.addEventListener('click', () => setOpen(false));
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false, { restoreFocus: false });
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (menu.classList.contains('is-menu-open')) {
        event.preventDefault();
      }
      setOpen(false);
      return;
    }

    if (event.key !== 'Tab' || !menu.classList.contains('is-menu-open')) {
      return;
    }

    const focusableElements = getVisibleFocusableElements(panel);
    if (!focusableElements.length) {
      event.preventDefault();
      focusWithoutScroll(panel);
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!panel.contains(document.activeElement)) {
      event.preventDefault();
      focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    } else if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      focusWithoutScroll(lastElement);
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      focusWithoutScroll(firstElement);
    }
  });

  window.addEventListener('tarski:mobileserviceopen', () => setOpen(false));
  window.addEventListener('tarski:languagechange', () => {
    syncToggleState(toggle.getAttribute('aria-expanded') === 'true');
  });

  syncToggleState(false);
})();

(() => {
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"], .mobile-menu-expanded a[href^="#"]'));
  const primaryNavLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  const sections = primaryNavLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const mainNav = document.querySelector('.main-nav');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const mobileMenuHome = document.querySelector('[data-mobile-menu-home]');
  const mobileToggle = mobileMenu?.querySelector('[data-mobile-menu-toggle]');
  const mobileMail = mobileMenu?.querySelector('.mobile-mail-pill');
  const mobileService = mobileMenu?.querySelector('.mobile-service');
  const navLabel = mainNav?.querySelector('.nav-label');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  const fallbackSceneLabels = {
    cover: 'Меню',
    about: 'Среда',
    artists: 'Сеть'
  };
  const getSceneLabels = () => window.tarskiI18n?.getSceneLabels?.() || fallbackSceneLabels;
  const getLabelSources = () => Array.from(document.querySelectorAll('.section-intro, .editorial-block'));

  const getSourceLabel = (source) => {
    if (source.matches('.section-intro')) {
      return source.dataset.sectionLabel?.trim();
    }

    return source.querySelector('.editorial-block__marker')?.textContent.trim();
  };

  const getCurrentContextLabel = () => {
    if (currentScene === 'cover') {
      const sceneLabels = getSceneLabels();
      return sceneLabels.cover || fallbackSceneLabels.cover;
    }

    const sceneRoot = document.getElementById(currentScene);
    const sceneIntro = Array.from(sceneRoot?.children || []).find((element) => element.classList?.contains('section-intro'));
    if (sceneIntro) {
      const rect = sceneIntro.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight * 0.65) {
        const introLabel = getSourceLabel(sceneIntro);
        if (introLabel) return introLabel;
      }
    }

    const anchor = window.innerHeight * 0.42;
    let currentSource = null;
    let closestDistance = Infinity;

    getLabelSources().forEach((source) => {
      const rect = source.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (rect.top <= anchor && rect.bottom >= anchor) {
        currentSource = source;
        closestDistance = 0;
        return;
      }

      const distance = Math.min(Math.abs(rect.top - anchor), Math.abs(rect.bottom - anchor));
      if (distance < closestDistance) {
        closestDistance = distance;
        currentSource = source;
      }
    });

    const sourceLabel = currentSource ? getSourceLabel(currentSource) : null;
    if (sourceLabel) return sourceLabel;

    const sceneLabels = getSceneLabels();
    return sceneLabels[currentScene] || sceneLabels.cover || fallbackSceneLabels.cover;
  };

  const updateNavLabel = () => {
    if (!navLabel) return;
    navLabel.textContent = getCurrentContextLabel();
  };

  let currentActiveId = null;
  let currentScene = document.documentElement.dataset.scene || 'cover';
  let mobileIslandWidthTimer = null;
  const indicatorTimers = new WeakMap();
  const pulseIndicator = (container) => {
    if (!container) return;

    window.clearTimeout(indicatorTimers.get(container));
    container.classList.add('is-indicator-moving');
    indicatorTimers.set(container, window.setTimeout(() => {
      container.classList.remove('is-indicator-moving');
    }, 280));
  };

  const setScene = (id) => {
    const scene = id || 'cover';
    if (currentScene === scene) return;

    currentScene = scene;
    document.documentElement.dataset.scene = scene;

    updateNavLabel();

    window.dispatchEvent(new CustomEvent('tarski:scenechange', {
      detail: { scene }
    }));
  };

  const updateDesktopIndicator = (animate = false) => {
    if (!mainNav) return;

    const activeLink = mainNav.querySelector('a.is-active[href^="#"]');
    mainNav.classList.toggle('is-cover-state', !activeLink);

    const indicatorTarget = activeLink || navLabel;

    if (!indicatorTarget) {
      mainNav.style.setProperty('--nav-indicator-opacity', '0');
      return;
    }

    const navRect = mainNav.getBoundingClientRect();
    const targetRect = indicatorTarget.getBoundingClientRect();
    const indicatorY = targetRect.top - navRect.top + targetRect.height / 2;

    mainNav.style.setProperty('--nav-indicator-y', `${indicatorY.toFixed(2)}px`);
    mainNav.style.setProperty('--nav-indicator-opacity', '1');

    if (activeLink && animate) {
      pulseIndicator(mainNav);
    }
  };

  const updateMenuIndicators = (animate = false) => {
    updateDesktopIndicator(animate);
  };

  const updateMobileIslandWidth = () => {
    if (!mobileMenu || !mobileMail || !mobileService || !mobileQuery.matches) return;
    if (mobileMenu.classList.contains('is-service-open') || mobileMenu.classList.contains('is-menu-open')) return;
    if (!mobileToggle) return;

    const toPx = (value) => Number.parseFloat(value) || 0;
    const menuStyle = window.getComputedStyle(mobileMenu);
    const padX = toPx(menuStyle.paddingLeft) + toPx(menuStyle.paddingRight);
    const shellGap = toPx(menuStyle.gap);
    const shellWidth = Math.ceil(
      toPx(window.getComputedStyle(mobileToggle).width)
      + toPx(window.getComputedStyle(mobileMail).width)
      + toPx(window.getComputedStyle(mobileService).width)
      + shellGap * 2
      + padX
    );

    mobileMenu.style.setProperty('--mobile-island-shell-width', `${shellWidth}px`);
  };

  const scheduleMobileIslandWidth = () => {
    updateMobileIslandWidth();
    window.clearTimeout(mobileIslandWidthTimer);
    mobileIslandWidthTimer = window.setTimeout(updateMobileIslandWidth, 260);
  };

  const setActive = (id) => {
    const previousActiveId = currentActiveId;
    const hasChanged = previousActiveId !== id;
    currentActiveId = id;
    setScene(id);

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (hasChanged) {
      updateMenuIndicators(previousActiveId !== null);
    } else {
      updateMenuIndicators(false);
    }

    scheduleMobileIslandWidth();
  };

  const updateActive = () => {
    if (!sections.length) return;

    if (window.location.hash.slice(1).startsWith('artist-')) {
      setActive('artists');
      updateNavLabel();
      return;
    }

    const marker = window.scrollY + window.innerHeight * 0.52;
    const firstSection = sections[0];
    const coverExitOffset = firstSection.offsetTop - window.innerHeight * 0.06;

    if (marker < coverExitOffset) {
      setActive(null);
      return;
    }

    let current = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= marker) {
        current = section;
      }
    });

    setActive(current.id);
    updateNavLabel();
  };

  const updateMobileMenuVisibility = () => {
    if (!mobileMenu) return;

    if (!mobileQuery.matches) {
      mobileMenu.classList.remove('is-visible');
      return;
    }

    const mainNav = document.querySelector('.main-nav');
    const mobileHomeBottom = mobileMenuHome ? mobileMenuHome.getBoundingClientRect().bottom : null;
    const navBottom = mainNav ? mainNav.getBoundingClientRect().bottom : 0;
    const shouldShow = mobileHomeBottom !== null ? mobileHomeBottom < 0 : navBottom < 0;

    mobileMenu.classList.toggle('is-visible', shouldShow);

    if (shouldShow) {
      scheduleMobileIslandWidth();
    }
  };

  updateActive();
  updateMenuIndicators(false);
  scheduleMobileIslandWidth();
  updateMobileMenuVisibility();

  window.addEventListener('scroll', () => {
    updateActive();
    updateNavLabel();
    updateMobileMenuVisibility();
    scheduleMobileIslandWidth();
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateActive();
    updateNavLabel();
    updateMenuIndicators(false);
    scheduleMobileIslandWidth();
    updateMobileMenuVisibility();
  });

  window.addEventListener('tarski:languagechange', () => {
    updateActive();
    updateNavLabel();
    updateMenuIndicators(false);
    window.setTimeout(() => {
      scheduleMobileIslandWidth();
      updateMobileMenuVisibility();
    }, 40);
  });

  window.addEventListener('tarski:mobileislandresize', scheduleMobileIslandWidth);
  document.fonts?.ready?.then(scheduleMobileIslandWidth);
})();

(() => {
  const section = document.querySelector('.artists-section');
  const switcher = section?.querySelector('[data-artists-view-switch]');
  const buttons = Array.from(section?.querySelectorAll('[data-artists-view-option]') || []);
  const artistIndex = section?.querySelector('.artist-index');
  const artistsList = section?.querySelector('.artists-list');
  const viewModes = new Set(['cloud', 'list']);

  if (!section || !switcher || !buttons.length || !artistIndex || !artistsList) return;

  const setView = (view) => {
    const nextView = viewModes.has(view) ? view : 'cloud';
    document.documentElement.dataset.artistsView = nextView;
    section.dataset.artistsView = nextView;
    artistIndex.setAttribute('aria-hidden', String(nextView === 'list'));
    artistsList.setAttribute('aria-hidden', String(nextView === 'cloud'));

    buttons.forEach((button) => {
      const isActive = button.dataset.artistsViewOption === nextView;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    window.dispatchEvent(new CustomEvent('tarski:artistsviewchange', {
      detail: { view: nextView }
    }));
  };

  const moveViewFocus = (currentIndex, step) => {
    const nextIndex = (currentIndex + step + buttons.length) % buttons.length;
    const nextButton = buttons[nextIndex];
    if (!nextButton) return;

    setView(nextButton.dataset.artistsViewOption);
    focusWithoutScroll(nextButton);
  };

  switcher.hidden = false;
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => setView(button.dataset.artistsViewOption));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveViewFocus(index, -1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveViewFocus(index, 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setView(buttons[0].dataset.artistsViewOption);
        focusWithoutScroll(buttons[0]);
      } else if (event.key === 'End') {
        const lastButton = buttons[buttons.length - 1];
        event.preventDefault();
        setView(lastButton.dataset.artistsViewOption);
        focusWithoutScroll(lastButton);
      }
    });
  });

  setView('cloud');
})();

(() => {
  const standaloneTextItems = Array.from(document.querySelectorAll('main.content h1, main.content h2, main.content h3, main.content p, main.content ul, main.content .editorial-disclosure'))
    .filter((item) => (
      !item.closest('.artist-card') &&
      (!item.closest('.editorial-disclosure') || item.matches('.editorial-disclosure'))
    ));
  const artistCards = Array.from(document.querySelectorAll('main.content .artist-card'));
  const groupedTextItems = new Set();

  const makeFocusUnit = (elements, rectElements = elements) => ({
    anchor: elements[0],
    elements,
    getRect() {
      return rectElements
        .filter((element) => element.offsetParent !== null)
        .reduce((bounds, element) => {
          const rect = element.getBoundingClientRect();

          if (!bounds) {
            return {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left
            };
          }

          return {
            top: Math.min(bounds.top, rect.top),
            right: Math.max(bounds.right, rect.right),
            bottom: Math.max(bounds.bottom, rect.bottom),
            left: Math.min(bounds.left, rect.left)
          };
        }, null);
    }
  });

  const textUnits = standaloneTextItems
    .map((item) => {
      if (groupedTextItems.has(item)) return null;

      if (item.matches('.section-intro h1')) {
        const intro = item.closest('.section-intro');
        const elements = Array.from(intro?.querySelectorAll('h1, .lead') || [item]);

        elements.slice(1).forEach((element) => groupedTextItems.add(element));
        return makeFocusUnit(elements, intro ? [intro] : elements);
      }

      if (item.matches('h3')) {
        const elements = [item];
        let sibling = item.nextElementSibling;

        while (
          sibling?.matches('p, ul') &&
          !sibling.closest('.artist-card') &&
          !sibling.classList.contains('lead-spaced')
        ) {
          elements.push(sibling);
          groupedTextItems.add(sibling);
          sibling = sibling.nextElementSibling;
        }

        return makeFocusUnit(elements);
      }

      if (item.matches('p') && item.nextElementSibling?.matches('ul')) {
        groupedTextItems.add(item.nextElementSibling);
        return makeFocusUnit([item, item.nextElementSibling]);
      }

      return makeFocusUnit([item]);
    })
    .filter(Boolean);

  const artistFocusUnits = artistCards.map((card) => makeFocusUnit([card], [card.querySelector('.artist-card__body') || card]));
  const artistFocusUnitsById = new Map(artistFocusUnits.map((item) => [item.anchor.id, item]));
  const focusUnits = [
    ...textUnits,
    ...artistFocusUnits
  ].sort((first, second) => {
    if (first.anchor === second.anchor) return 0;
    return first.anchor.compareDocumentPosition(second.anchor) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });

  if (!focusUnits.length) return;

  let activeItem = null;
  let frameId = null;

  const setActiveText = (item) => {
    if (activeItem === item) return;

    activeItem?.elements.forEach((element) => element.classList.remove('is-text-focus-active'));
    activeItem = item;
    activeItem?.elements.forEach((element) => element.classList.add('is-text-focus-active'));
  };

  const updateTextFocus = () => {
    frameId = null;

    const focusY = window.innerHeight * (window.innerWidth <= 720 ? 0.46 : 0.52);
    const visibilityPadding = window.innerHeight * 0.18;
    let closestItem = null;
    let closestDistance = Infinity;

    focusUnits.forEach((item) => {
      const rect = item.getRect();
      if (!rect) return;
      if (rect.bottom < -visibilityPadding || rect.top > window.innerHeight + visibilityPadding) return;

      const itemCenter = rect.top + (rect.bottom - rect.top) / 2;
      const distance = Math.abs(itemCenter - focusY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestItem = item;
      }
    });

    setActiveText(closestItem);
  };

  const scheduleTextFocusUpdate = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(updateTextFocus);
    }
  };

  const scrollArtistLinkToFocus = (event) => {
    if (event.currentTarget.classList.contains('artist-index__link')) return;

    const hash = event.currentTarget.getAttribute('href');
    if (!hash?.startsWith('#')) return;

    const card = document.querySelector(hash);
    const focusUnit = card ? artistFocusUnitsById.get(card.id) : null;
    if (!card || !focusUnit) return;

    event.preventDefault();

    const target = card.querySelector('.artist-card__body') || card;
    const rect = target.getBoundingClientRect();
    const focusY = window.innerHeight * (window.innerWidth <= 720 ? 0.46 : 0.52);
    const scrollTop = window.scrollY + rect.top - Math.max(24, focusY - rect.height / 2);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.history.pushState(null, '', hash);
    setActiveText(focusUnit);
    window.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });

    window.setTimeout(scheduleTextFocusUpdate, reducedMotion ? 0 : 420);
    window.setTimeout(scheduleTextFocusUpdate, reducedMotion ? 0 : 760);
  };

  focusUnits.forEach((item) => item.elements.forEach((element) => element.classList.add('focus-text')));
  document.querySelectorAll('.artist-index__link[href^="#artist-"]').forEach((link) => {
    link.addEventListener('click', scrollArtistLinkToFocus);
  });
  document.documentElement.classList.add('has-text-focus');
  updateTextFocus();

  window.addEventListener('scroll', scheduleTextFocusUpdate, { passive: true });
  window.addEventListener('resize', scheduleTextFocusUpdate);
  window.addEventListener('tarski:languagechange', () => {
    scheduleTextFocusUpdate();
    window.setTimeout(scheduleTextFocusUpdate, 260);
  });
  window.addEventListener('tarski:artistsviewchange', () => {
    scheduleTextFocusUpdate();
    window.setTimeout(scheduleTextFocusUpdate, 260);
  });
  document.querySelectorAll('.editorial-disclosure').forEach((disclosure) => {
    disclosure.addEventListener('toggle', scheduleTextFocusUpdate);
  });
})();

(() => {
  const dossier = document.querySelector('[data-artist-dossier]');
  const panel = dossier?.querySelector('.artist-dossier__panel');
  const image = dossier?.querySelector('[data-artist-dossier-image]');
  const galleryBlock = dossier?.querySelector('[data-artist-dossier-gallery-block]');
  const gallery = dossier?.querySelector('[data-artist-dossier-gallery]');
  const credit = dossier?.querySelector('[data-artist-dossier-credit]');
  const name = dossier?.querySelector('[data-artist-dossier-name]');
  const role = dossier?.querySelector('[data-artist-dossier-role]');
  const text = dossier?.querySelector('[data-artist-dossier-text]');
  const links = dossier?.querySelector('[data-artist-dossier-links]');
  const closeControls = Array.from(dossier?.querySelectorAll('[data-artist-dossier-close]') || []);
  const cards = Array.from(document.querySelectorAll('.artist-card'));
  const indexLinks = Array.from(document.querySelectorAll('.artist-index__link[href^="#artist-"]'));
  const preferredImages = {
    'artist-anastasia-dahl': 'assets/artist-index/330551584_215344677620530_5433914055885423503_n.jpg',
    'artist-nadezhda-ishkinyaeva': 'assets/artist-index/nadezhda-ishkinyaeva.jpg',
    'artist-elena-kolesnikova': 'assets/artist-index/Елена Колесникова.webp',
    'artist-alina-kugush': 'assets/artist-index/izobrazhenie-dsc05043-1-1500x.jpg',
    'artist-no-excuse-group': 'assets/artist-index/0015.jpg.webp'
  };
  const captionKeys = {
    ru: 'caption',
    en: 'captionEn',
    ja: 'captionJa'
  };
  const labelKeys = {
    ru: 'label',
    en: 'labelEn',
    ja: 'labelJa'
  };

  if (!dossier || !panel || !image || !galleryBlock || !gallery || !credit || !name || !role || !text || !links || !cards.length) return;

  const cardsById = new Map(cards.map((card) => [card.id, card]));
  let activeTrigger = null;
  let activeCard = null;
  let openTimerId = null;
  let closeTimerId = null;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const getOpenDetailsPrefix = () => window.tarskiI18n?.t('ui.openDetails') || 'Открыть подробности: ';
  const getLinksGroupLabel = () => window.tarskiI18n?.t('ui.links.group') || 'Ссылки';
  const getCardName = (card) => card.querySelector('.artist-card__name')?.textContent.trim() || 'художника';
  const getLocalizedCaption = (item) => {
    const language = window.tarskiI18n?.getLanguage?.() || document.documentElement.dataset.language || 'ru';
    const captionKey = captionKeys[language] || captionKeys.ru;

    return item.dataset[captionKey] || item.dataset.caption || '';
  };
  const getLocalizedLabel = (item) => {
    const language = window.tarskiI18n?.getLanguage?.() || document.documentElement.dataset.language || 'ru';
    const labelKey = labelKeys[language] || labelKeys.ru;

    return item.dataset[labelKey] || item.dataset.label || '';
  };

  const syncDetailTriggerLabels = () => {
    cards.forEach((card) => {
      const cardName = getCardName(card);
      card
        .querySelectorAll('.artist-card__detail-trigger')
        .forEach((trigger) => {
          trigger.setAttribute('aria-label', `${getOpenDetailsPrefix()}${cardName}`);
        });
    });
  };

  const getCardData = (card) => {
    const cardImage = card.querySelector('.artist-card__image');
    const cardName = card.querySelector('.artist-card__name');
    const cardRole = card.querySelector('.artist-card__role');
    const cardLinks = Array.from(card.querySelectorAll('.artist-card__link'));
    const copy = Array.from(card.querySelectorAll('.artist-card__body > p:not(.artist-card__role)'));
    const galleryTemplate = card.querySelector('[data-artist-gallery]');
    const galleryItems = galleryTemplate
      ? Array.from(galleryTemplate.content.querySelectorAll('img')).map((item) => ({
        src: item.getAttribute('src') || '',
        alt: item.getAttribute('alt') || '',
        width: item.getAttribute('width') || '',
        height: item.getAttribute('height') || '',
        caption: getLocalizedCaption(item),
        label: getLocalizedLabel(item),
        variant: item.dataset.variant || '',
        isWide: item.classList.contains('artist-card__gallery-image--wide')
      })).filter((item) => item.src)
      : [];

    return {
      id: card.id,
      imageSrc: preferredImages[card.id] || cardImage?.getAttribute('src') || '',
      imageAlt: cardImage?.getAttribute('alt') || cardName?.textContent.trim() || '',
      name: cardName?.textContent.trim() || '',
      role: cardRole?.textContent.trim() || '',
      copy,
      links: cardLinks,
      galleryItems,
      galleryLayout: galleryTemplate?.dataset.layout || '',
      galleryCredit: galleryTemplate?.dataset.credit || ''
    };
  };

  const setCurrentIndexLink = (id) => {
    indexLinks.forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${id}`;

      if (isCurrent) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const setDossierTriggerState = (id = null) => {
    const triggerSelector = '.artist-card__detail-trigger, .artist-index__link[href^="#artist-"]';

    document.querySelectorAll(triggerSelector).forEach((trigger) => {
      const triggerHash = trigger instanceof HTMLAnchorElement ? trigger.hash.slice(1) : '';
      const triggerCardId = trigger.closest('.artist-card')?.id || triggerHash;
      trigger.setAttribute('aria-expanded', String(Boolean(id) && triggerCardId === id));
    });
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setPanelOrigin = (trigger) => {
    if (!(trigger instanceof HTMLElement) || reducedMotion()) {
      panel.style.removeProperty('--dossier-origin-x');
      panel.style.removeProperty('--dossier-origin-y');
      panel.style.removeProperty('--dossier-enter-x');
      panel.style.removeProperty('--dossier-enter-y');
      return;
    }

    const sourceRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !panelRect.width || !panelRect.height) return;

    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const panelX = panelRect.left + panelRect.width / 2;
    const panelY = panelRect.top + panelRect.height / 2;
    const originX = clamp(((sourceX - panelRect.left) / panelRect.width) * 100, 8, 92);
    const originY = clamp(((sourceY - panelRect.top) / panelRect.height) * 100, 10, 90);
    const enterX = clamp((sourceX - panelX) * 0.045, -24, 24);
    const enterY = clamp((sourceY - panelY) * 0.045, -18, 18);

    panel.style.setProperty('--dossier-origin-x', `${originX.toFixed(2)}%`);
    panel.style.setProperty('--dossier-origin-y', `${originY.toFixed(2)}%`);
    panel.style.setProperty('--dossier-enter-x', `${enterX.toFixed(1)}px`);
    panel.style.setProperty('--dossier-enter-y', `${enterY.toFixed(1)}px`);
  };

  const emitThreadLink = (trigger) => {
    if (!(trigger instanceof HTMLElement) || reducedMotion()) return;

    window.requestAnimationFrame(() => {
      const sourceRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      if (!sourceRect.width || !sourceRect.height || !panelRect.width || !panelRect.height) return;

      const source = {
        x: sourceRect.left + sourceRect.width / 2 + window.scrollX,
        y: sourceRect.top + sourceRect.height / 2 + window.scrollY
      };
      const target = {
        x: panelRect.left + Math.min(panelRect.width * 0.18, 180) + window.scrollX,
        y: panelRect.top + panelRect.height * 0.5 + window.scrollY
      };

      window.dispatchEvent(new CustomEvent('tarski:threadlink', {
        detail: { source, target, kind: 'dossier' }
      }));
    });
  };

  const animateDossierContent = () => {
    if (reducedMotion()) return;

    panel.classList.remove('is-content-entering');
    void panel.offsetWidth;
    panel.classList.add('is-content-entering');
  };

  const syncDossierHash = (id, mode = 'replace') => {
    const hash = `#${id}`;
    if (window.location.hash === hash) return;

    const method = mode === 'push' ? 'pushState' : 'replaceState';
    window.history[method](null, '', hash);
  };

  const syncClosedDossierHash = () => {
    if (!activeCard || window.location.hash !== `#${activeCard.id}`) return;

    window.history.replaceState(null, '', '#artists');
  };

  const isVisibleElement = (element) => (
    element instanceof HTMLElement
    && !element.hidden
    && !element.closest('[hidden]')
    && element.offsetParent !== null
  );

  const getDossierFocusReturnTarget = () => {
    if (isVisibleElement(activeTrigger)) return activeTrigger;

    const currentIndexLink = activeCard
      ? indexLinks.find((link) => link.getAttribute('href') === `#${activeCard.id}`)
      : null;
    if (isVisibleElement(currentIndexLink)) return currentIndexLink;

    const visibleCardTrigger = activeCard
      ? Array
        .from(activeCard.querySelectorAll('.artist-card__detail-trigger'))
        .find(isVisibleElement)
      : null;
    if (visibleCardTrigger) return visibleCardTrigger;

    return document.querySelector('[data-artists-view-option="cloud"]');
  };

  const openDossier = (card, trigger = null, options = {}) => {
    const {
      history = 'replace',
      focus = true,
      forceRefresh = false
    } = options;

    if (
      !forceRefresh &&
      activeCard === card &&
      dossier.classList.contains('is-open') &&
      !dossier.classList.contains('is-closing')
    ) {
      if (focus) window.setTimeout(() => focusWithoutScroll(panel), 0);
      syncDossierHash(card.id, history);
      return;
    }

    const data = getCardData(card);
    const previousCard = activeCard;
    const isSwitching = dossier.classList.contains('is-open') && previousCard && previousCard !== card;
    activeCard = card;
    if (trigger instanceof HTMLElement) {
      activeTrigger = trigger;
    } else if (previousCard !== card) {
      activeTrigger = null;
    } else if (!(activeTrigger instanceof HTMLElement)) {
      activeTrigger = null;
    }
    window.clearTimeout(closeTimerId);
    closeTimerId = null;
    dossier.classList.remove('is-closing');
    setPanelOrigin(trigger);
    const galleryItems = data.galleryItems.map((item) => {
      const galleryItem = document.createElement('figure');
      const galleryImage = document.createElement('img');
      const galleryLabel = item.label ? document.createElement('span') : null;
      const galleryCaption = item.caption ? document.createElement('figcaption') : null;

      galleryItem.className = 'artist-dossier__gallery-item';
      galleryImage.className = 'artist-dossier__gallery-image';

      if (item.variant && /^[a-z0-9-]+$/i.test(item.variant)) {
        galleryItem.classList.add(`artist-dossier__gallery-item--${item.variant}`);
      }

      if (item.isWide) {
        galleryItem.classList.add('artist-dossier__gallery-item--wide');
        galleryImage.classList.add('artist-dossier__gallery-image--wide');
      }

      galleryImage.src = item.src;
      galleryImage.alt = item.alt || item.caption;
      if (item.width) galleryImage.width = Number(item.width);
      if (item.height) galleryImage.height = Number(item.height);
      galleryImage.loading = 'lazy';
      galleryImage.decoding = 'async';

      if (galleryLabel) {
        galleryLabel.className = 'artist-dossier__gallery-label';
        galleryLabel.textContent = item.label;
        galleryItem.append(galleryLabel);
      }

      galleryItem.append(galleryImage);

      if (galleryCaption) {
        galleryCaption.className = 'artist-dossier__gallery-caption';
        galleryCaption.textContent = item.caption;
        galleryItem.append(galleryCaption);
      }

      return galleryItem;
    });

    panel.dataset.artistId = card.id;
    panel.classList.toggle('has-gallery', galleryItems.length > 0);
    if (data.galleryLayout) {
      panel.dataset.galleryLayout = data.galleryLayout;
    } else {
      delete panel.dataset.galleryLayout;
    }
    image.src = data.imageSrc;
    image.alt = data.imageAlt;
    gallery.replaceChildren(...galleryItems);
    gallery.hidden = galleryItems.length === 0;
    credit.textContent = data.galleryCredit;
    credit.hidden = !data.galleryCredit;
    galleryBlock.hidden = galleryItems.length === 0 && !data.galleryCredit;
    name.textContent = data.name;
    role.textContent = data.role;
    text.replaceChildren(...data.copy.map((item) => item.cloneNode(true)));
    links.replaceChildren(...data.links.map((item) => item.cloneNode(true)));
    if (data.links.length) {
      links.setAttribute('role', 'group');
      links.setAttribute('aria-label', `${getLinksGroupLabel()}: ${data.name}`);
    } else {
      links.removeAttribute('role');
      links.removeAttribute('aria-label');
    }
    panel.scrollTop = 0;

    dossier.inert = false;
    dossier.classList.add('is-open');
    dossier.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('has-open-dossier');
    setCurrentIndexLink(card.id);
    setDossierTriggerState(card.id);
    syncDossierHash(card.id, history);
    emitThreadLink(trigger || indexLinks.find((link) => link.getAttribute('href') === `#${card.id}`));

    if (isSwitching) {
      animateDossierContent();
    }

    if (focus) window.setTimeout(() => focusWithoutScroll(panel), 0);
  };

  const closeDossier = (options = {}) => {
    const {
      restoreFocus = true,
      updateHash = true
    } = options;

    if (!dossier.classList.contains('is-open') && !dossier.classList.contains('is-closing')) return;

    const triggerToRestore = getDossierFocusReturnTarget();

    dossier.classList.remove('is-open');
    dossier.classList.add('is-closing');
    dossier.inert = true;
    window.clearTimeout(openTimerId);
    window.clearTimeout(closeTimerId);
    indexLinks.forEach((link) => link.removeAttribute('aria-current'));
    setDossierTriggerState();

    if (updateHash) {
      syncClosedDossierHash();
    }

    if (restoreFocus && triggerToRestore instanceof HTMLElement) {
      focusWithoutScroll(triggerToRestore);
    }

    const finishClose = () => {
      dossier.classList.remove('is-closing');
      dossier.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('has-open-dossier');
      delete panel.dataset.artistId;
      panel.classList.remove('has-gallery', 'is-content-entering');
      activeTrigger = null;
      activeCard = null;
    };

    if (reducedMotion()) {
      finishClose();
    } else {
      closeTimerId = window.setTimeout(finishClose, 420);
    }
  };

  cards.forEach((card) => {
    const detailTriggers = [
      card.querySelector('.artist-card__image'),
      card.querySelector('.artist-card__name')
    ].filter(Boolean);

    detailTriggers.forEach((trigger) => {
      trigger.classList.add('artist-card__detail-trigger');
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', panel.id);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', `${getOpenDetailsPrefix()}${getCardName(card)}`);
      trigger.addEventListener('click', () => openDossier(card, trigger, { history: 'push' }));
      trigger.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        openDossier(card, trigger, { history: 'push' });
      });
    });
  });

  indexLinks.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', panel.id);
    link.setAttribute('aria-expanded', 'false');
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const id = link.hash.slice(1);
      const card = cardsById.get(id);
      if (!card) return;

      event.preventDefault();
      window.clearTimeout(openTimerId);
      openDossier(card, link, { history: 'push' });
    });
  });

  closeControls.forEach((control) => {
    control.addEventListener('click', closeDossier);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!dossier.classList.contains('is-open')) return;

      event.preventDefault();
      closeDossier();
      return;
    }

    if (event.key !== 'Tab' || !dossier.classList.contains('is-open')) {
      return;
    }

    const focusableElements = getVisibleFocusableElements(panel);
    if (!focusableElements.length) {
      event.preventDefault();
      focusWithoutScroll(panel);
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (activeElement === panel) {
      event.preventDefault();
      focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    } else if (!panel.contains(activeElement)) {
      event.preventDefault();
      focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    } else if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      focusWithoutScroll(lastElement);
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      focusWithoutScroll(firstElement);
    }
  });

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    const card = cardsById.get(id);
    if (card) {
      openDossier(card, null, { history: 'replace' });
    } else if (dossier.classList.contains('is-open')) {
      closeDossier({ updateHash: false });
    }
  });

  window.addEventListener('tarski:languagechange', () => {
    syncDetailTriggerLabels();

    if (activeCard && dossier.classList.contains('is-open')) {
      openDossier(activeCard, activeTrigger, { forceRefresh: true });
    }
  });

  const initialCard = cardsById.get(window.location.hash.slice(1));
  if (initialCard) {
    window.setTimeout(() => openDossier(initialCard, null, { history: 'replace' }), 360);
  }
})();

(() => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const smoothingFactor = 0.68;
  const curveSmoothing = 0.18;
  const maxPoints = 1400;

  let canvas = null;
  let context = null;
  let frameId = null;
  let points = [];
  let deviceScale = 1;
  let trailRgb = '0, 0, 0';
  let trailBaseWidth = 1.15;
  let trailExtraWidth = 0.65;
  let trailOpacity = 0.95;
  let trailDuration = 10000;
  let minPointDistance = 2;
  let hasPointerPosition = false;
  const routeTimers = new Map();
  const routeCooldowns = new Map();

  const shouldRun = () => finePointerQuery.matches && !reducedMotionQuery.matches;

  const readTrailSettings = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const rawColor = rootStyles.getPropertyValue('--cursor-trail-rgb').trim();
    const baseWidth = parseFloat(rootStyles.getPropertyValue('--cursor-trail-base-width'));
    const extraWidth = parseFloat(rootStyles.getPropertyValue('--cursor-trail-extra-width'));
    const opacity = parseFloat(rootStyles.getPropertyValue('--cursor-trail-opacity'));
    const duration = parseFloat(rootStyles.getPropertyValue('--cursor-trail-duration'));
    const pointDistance = parseFloat(rootStyles.getPropertyValue('--cursor-trail-min-distance'));

    trailRgb = rawColor ? rawColor.split(/\s+/).join(', ') : '0, 0, 0';
    trailBaseWidth = Number.isFinite(baseWidth) ? baseWidth : 1.15;
    trailExtraWidth = Number.isFinite(extraWidth) ? extraWidth : 0.65;
    trailOpacity = Number.isFinite(opacity) ? opacity : 0.95;
    trailDuration = Number.isFinite(duration) ? duration : 10000;
    minPointDistance = Number.isFinite(pointDistance) ? pointDistance : 2;
  };

  const resizeCanvas = () => {
    if (!canvas || !context) return;

    deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(window.innerWidth * deviceScale);
    canvas.height = Math.ceil(window.innerHeight * deviceScale);
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
    points = [];
    hasPointerPosition = false;
  };

  const scheduleRender = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(renderTrail);
    }
  };

  const renderTrail = (now) => {
    frameId = null;
    if (!context) return;

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const cutoff = now - trailDuration;
    while (points.length && points[0].time < cutoff) {
      points.shift();
    }

    context.lineCap = 'butt';
    context.lineJoin = 'round';

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    for (let index = 1; index < points.length; index += 1) {
      const previousPoint = points[index - 1];
      const point = points[index];
      if (point.startsStroke) continue;

      const anchorPoint = previousPoint.startsStroke || index < 2
        ? previousPoint
        : points[index - 2];
      const nextPoint = points[index + 1];
      const forwardPoint = nextPoint && !nextPoint.startsStroke ? nextPoint : point;
      const controlStartX = previousPoint.x + (point.x - anchorPoint.x) * curveSmoothing - scrollX;
      const controlStartY = previousPoint.y + (point.y - anchorPoint.y) * curveSmoothing - scrollY;
      const controlEndX = point.x - (forwardPoint.x - previousPoint.x) * curveSmoothing - scrollX;
      const controlEndY = point.y - (forwardPoint.y - previousPoint.y) * curveSmoothing - scrollY;
      const startX = previousPoint.x - scrollX;
      const startY = previousPoint.y - scrollY;
      const endX = point.x - scrollX;
      const endY = point.y - scrollY;
      const segmentAge = now - point.time;
      const life = Math.max(0, 1 - segmentAge / trailDuration);
      if (life <= 0) continue;
      const threadKind = point.threadKind || previousPoint.threadKind || '';
      const isThreadLink = Boolean(point.isThreadLink || previousPoint.isThreadLink);
      const isRouteLink = isThreadLink && threadKind && threadKind !== 'dossier';
      const routeStrength = point.routeStrength || previousPoint.routeStrength || 1;
      const segmentBaseWidth = isRouteLink
        ? Math.max(trailBaseWidth * 0.44 * routeStrength, 0.32)
        : (isThreadLink ? Math.max(trailBaseWidth, 0.94) : trailBaseWidth);
      const segmentExtraWidth = isRouteLink
        ? Math.max(trailExtraWidth * 0.14 * routeStrength, 0.05)
        : (isThreadLink ? Math.max(trailExtraWidth, 0.36) : trailExtraWidth);
      const segmentOpacity = isRouteLink
        ? Math.max(trailOpacity * 0.16 * routeStrength, 0.06)
        : (isThreadLink ? Math.max(trailOpacity, 0.54) : trailOpacity);

      context.lineCap = isThreadLink ? 'round' : 'butt';
      context.beginPath();
      context.moveTo(startX, startY);
      context.bezierCurveTo(
        controlStartX,
        controlStartY,
        controlEndX,
        controlEndY,
        endX,
        endY
      );
      context.lineWidth = segmentBaseWidth + life * segmentExtraWidth;
      context.strokeStyle = `rgba(${trailRgb}, ${life * segmentOpacity})`;
      context.stroke();
    }

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      if (!point.threadNode) continue;

      const segmentAge = now - point.time;
      const life = Math.max(0, 1 - segmentAge / trailDuration);
      if (life <= 0) continue;

      const isRouteNode = point.threadKind && point.threadKind !== 'dossier';
      const nodeStrength = point.routeStrength || 1;
      const radius = isRouteNode
        ? 1.4 + life * 1.1 * nodeStrength
        : 2.1 + life * 1.6;
      const opacity = isRouteNode
        ? life * 0.16 * nodeStrength
        : life * 0.34;

      context.beginPath();
      context.arc(point.x - scrollX, point.y - scrollY, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${trailRgb}, ${opacity})`;
      context.fill();
    }

    if (points.length) {
      scheduleRender();
    }
  };

  const addTrailPoint = (event) => {
    const now = window.performance.now();
    const lastPoint = points[points.length - 1];
    const pageX = event.clientX + window.scrollX;
    const pageY = event.clientY + window.scrollY;
    const x = hasPointerPosition && lastPoint
      ? lastPoint.x + (pageX - lastPoint.x) * smoothingFactor
      : pageX;
    const y = hasPointerPosition && lastPoint
      ? lastPoint.y + (pageY - lastPoint.y) * smoothingFactor
      : pageY;
    const distance = lastPoint
      ? Math.hypot(x - lastPoint.x, y - lastPoint.y)
      : Infinity;

    if (distance < minPointDistance && hasPointerPosition) return;

    points.push({
      x,
      y,
      time: now,
      startsStroke: !hasPointerPosition
    });

    hasPointerPosition = true;

    if (points.length > maxPoints) {
      points.splice(0, points.length - maxPoints);
    }

    scheduleRender();
  };

  const addThreadLink = ({ source, target, kind = 'dossier', strength = 1 } = {}) => {
    if (
      !source ||
      !target ||
      !Number.isFinite(source.x) ||
      !Number.isFinite(source.y) ||
      !Number.isFinite(target.x) ||
      !Number.isFinite(target.y) ||
      !shouldRun()
    ) {
      return;
    }

    if (!canvas) enableTrail();
    if (!context) return;

    readTrailSettings();
    startNewStroke();

    const now = window.performance.now();
    const isRouteLink = kind !== 'dossier';
    const routeStrength = Number.isFinite(strength) ? strength : 1;
    const steps = isRouteLink ? 18 : 24;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy);
    const curveLift = isRouteLink
      ? Math.min(96, Math.max(26, distance * 0.08))
      : Math.min(140, Math.max(42, distance * 0.12));
    const controlA = {
      x: source.x + dx * 0.28,
      y: source.y + dy * 0.16 - curveLift
    };
    const controlB = {
      x: source.x + dx * 0.72,
      y: target.y - dy * 0.16 + curveLift * 0.32
    };

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const inverse = 1 - t;
      points.push({
        x: inverse ** 3 * source.x
          + 3 * inverse ** 2 * t * controlA.x
          + 3 * inverse * t ** 2 * controlB.x
          + t ** 3 * target.x,
        y: inverse ** 3 * source.y
          + 3 * inverse ** 2 * t * controlA.y
          + 3 * inverse * t ** 2 * controlB.y
          + t ** 3 * target.y,
        time: now - (isRouteLink ? 1500 : 0) - (steps - step) * (isRouteLink ? 24 : 18),
        startsStroke: step === 0,
        isThreadLink: true,
        threadKind: kind,
        threadNode: step === 0 ? 'source' : (step === steps ? 'target' : ''),
        routeStrength
      });
    }

    if (points.length > maxPoints) {
      points.splice(0, points.length - maxPoints);
    }

    hasPointerPosition = false;
    scheduleRender();
  };

  const getRouteElement = (source) => (typeof source === 'function' ? source() : source);

  const getElementPoint = (element, options = {}) => {
    if (!(element instanceof HTMLElement)) return null;

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const anchorX = Number.isFinite(options.anchorX) ? options.anchorX : 0.5;
    const anchorY = Number.isFinite(options.anchorY) ? options.anchorY : 0.5;
    const offsetX = Number.isFinite(options.offsetX) ? options.offsetX : 0;
    const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : 0;

    return {
      x: rect.left + rect.width * anchorX + offsetX + window.scrollX,
      y: rect.top + rect.height * anchorY + offsetY + window.scrollY
    };
  };

  const addRouteBetween = (key, sourceElement, targetElement, options = {}) => {
    const now = window.performance.now();
    const cooldown = Number.isFinite(options.cooldown) ? options.cooldown : 1200;
    const previousRouteAt = routeCooldowns.get(key) || 0;

    if (previousRouteAt && now - previousRouteAt < cooldown) return;

    window.clearTimeout(routeTimers.get(key));
    routeCooldowns.set(key, now);

    routeTimers.set(key, window.setTimeout(() => {
      const resolvedSource = getRouteElement(sourceElement);
      const resolvedTarget = getRouteElement(targetElement);
      const source = getElementPoint(resolvedSource, options.source || {});
      const target = getElementPoint(resolvedTarget, options.target || {});

      if (!source || !target) return;
      if (
        Number.isFinite(options.maxDistance) &&
        Math.hypot(target.x - source.x, target.y - source.y) > options.maxDistance
      ) {
        return;
      }

      addThreadLink({
        source,
        target,
        kind: options.kind || 'route',
        strength: options.strength
      });
    }, Number.isFinite(options.delay) ? options.delay : 180));
  };

  const getActiveNavRouteSource = (scene) => {
    const nav = document.querySelector('.main-nav');
    if (!nav) return null;

    return nav.querySelector(`a[href="#${scene}"]`) ||
      nav.querySelector('a.is-active[href^="#"]') ||
      nav.querySelector('.nav-label');
  };

  const getSceneRouteTarget = (scene) => {
    if (scene === 'about') {
      return document.querySelector('#about .section-intro');
    }

    if (scene === 'artists') {
      return document.querySelector('#artists .artists-view-switch') ||
        document.querySelector('#artists .artist-index');
    }

    return null;
  };

  const addNavRoute = (scene, sourceElement) => {
    if (scene !== 'about' && scene !== 'artists') return;

    addRouteBetween(
      `nav-${scene}`,
      () => sourceElement || getActiveNavRouteSource(scene),
      () => getSceneRouteTarget(scene),
      {
        kind: 'nav',
        delay: 420,
        source: { anchorX: 0.08, anchorY: 0.52 },
        target: { anchorX: 0.08, anchorY: 0.5 },
        cooldown: 1400,
        strength: 1.06
      }
    );
  };

  const addArtistsViewRoute = (view) => {
    if (document.documentElement.dataset.scene !== 'artists') return;

    const targetSelector = view === 'list'
      ? '#artists .artist-card.is-text-focus-active, #artists .artist-card'
      : '#artists .artist-index';

    addRouteBetween(
      `artists-view-${view || 'cloud'}`,
      () => document.querySelector(`#artists [data-artists-view-option="${view || 'cloud'}"]`),
      () => document.querySelector(targetSelector),
      {
        kind: 'view',
        delay: 140,
        source: { anchorX: 0.5, anchorY: 0.55 },
        target: { anchorX: view === 'list' ? 0.08 : 0.38, anchorY: view === 'list' ? 0.24 : 0.16 },
        cooldown: 900,
        strength: 0.82
      }
    );
  };

  const addFooterRoute = () => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    addRouteBetween(
      'footer',
      () => footer.querySelector('.site-footer__logo') || footer,
      () => footer.querySelector('.site-footer__meta') || footer,
      {
        kind: 'footer',
        delay: 90,
        source: { anchorX: 0.08, anchorY: 0.78 },
        target: { anchorX: 0.12, anchorY: 0.18 },
        cooldown: 2600,
        maxDistance: 640,
        strength: 0.72
      }
    );
  };

  const bindRouteIntents = () => {
    document.querySelectorAll('.main-nav a[href="#about"], .main-nav a[href="#artists"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        addNavRoute(link.hash.slice(1), link);
      });
    });
  };

  const rememberPoint = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;

    const coalescedEvents = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents()
      : [event];
    const moveEvents = coalescedEvents.length ? coalescedEvents : [event];

    moveEvents.forEach(addTrailPoint);
  };

  const startNewStroke = (event) => {
    if (event?.type === 'pointerout' && event.relatedTarget) return;

    hasPointerPosition = false;
  };

  const handleScroll = () => {
    if (!points.length) return;

    startNewStroke();
    scheduleRender();
  };

  const clearTrail = () => {
    points = [];
    startNewStroke();
    context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  const clearTrailForKeyboard = (event) => {
    if (event.key === 'Tab') {
      clearTrail();
    }
  };

  const enableTrail = () => {
    if (canvas || !shouldRun()) return;

    canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    context = canvas.getContext('2d');

    if (!context) {
      canvas = null;
      return;
    }

    document.body.append(canvas);
    readTrailSettings();
    resizeCanvas();

    window.addEventListener('pointermove', rememberPoint, { passive: true });
    window.addEventListener('pointerout', startNewStroke, { passive: true });
    window.addEventListener('blur', startNewStroke);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', clearTrailForKeyboard);
    document.addEventListener('visibilitychange', clearTrail);
  };

  const disableTrail = () => {
    if (!canvas) return;

    window.removeEventListener('pointermove', rememberPoint);
    window.removeEventListener('pointerout', startNewStroke);
    window.removeEventListener('blur', startNewStroke);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', clearTrailForKeyboard);
    document.removeEventListener('visibilitychange', clearTrail);

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    canvas.remove();
    canvas = null;
    context = null;
    points = [];
    startNewStroke();
  };

  const syncTrail = () => {
    if (shouldRun()) {
      enableTrail();
    } else {
      disableTrail();
    }
  };

  reducedMotionQuery.addEventListener('change', syncTrail);
  finePointerQuery.addEventListener('change', syncTrail);
  colorSchemeQuery.addEventListener('change', readTrailSettings);
  window.addEventListener('tarski:themechange', readTrailSettings);
  window.addEventListener('tarski:scenechange', () => {
    readTrailSettings();
  });
  window.addEventListener('tarski:artistsviewchange', (event) => {
    readTrailSettings();
    addArtistsViewRoute(event.detail?.view);
  });
  window.addEventListener('tarski:threadlink', (event) => addThreadLink(event.detail));
  bindRouteIntents();

  const footer = document.querySelector('.site-footer');
  if (footer && 'IntersectionObserver' in window) {
    const footerObserver = new IntersectionObserver((entries) => {
      const isNearFooter = entries.some((entry) => entry.isIntersecting);
      if (isNearFooter) {
        document.documentElement.dataset.footerProximity = 'true';
        addFooterRoute();
      } else {
        delete document.documentElement.dataset.footerProximity;
      }
      readTrailSettings();
    }, {
      rootMargin: '0px 0px -18% 0px',
      threshold: 0.08
    });

    footerObserver.observe(footer);
  }

  syncTrail();
})();
