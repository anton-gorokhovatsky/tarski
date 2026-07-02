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

  const setOpen = (isOpen) => {
    service.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', getLabel(isOpen));
    toggle.setAttribute('title', getLabel(isOpen));
    panel.hidden = !isOpen;
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
      setOpen(false);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });

  window.addEventListener('tarski:languagechange', () => {
    syncLanguageCode();
    setOpen(toggle.getAttribute('aria-expanded') === 'true');
  });

  syncLanguageCode();
  setOpen(false);
})();

(() => {
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"], .mobile-menu-panel a[href^="#"]'));
  const primaryNavLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  const sections = primaryNavLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const mainNav = document.querySelector('.main-nav');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const mobilePanel = mobileMenu?.querySelector('.mobile-menu-panel');
  const mobileScroller = mobileMenu?.querySelector('[data-mobile-menu-scroller]') || mobilePanel;
  const navLabel = mainNav?.querySelector('.nav-label');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  const fallbackSceneLabels = {
    cover: 'Меню',
    about: 'Среда',
    artists: 'Сеть'
  };
  const getSceneLabels = () => window.tarskiI18n?.getSceneLabels?.() || fallbackSceneLabels;

  let currentActiveId = null;
  let currentScene = document.documentElement.dataset.scene || 'cover';
  let scrollTimer = null;
  const indicatorTimers = new WeakMap();
  const mobileCoverIndicatorX = 22;

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

    if (navLabel) {
      const sceneLabels = getSceneLabels();
      navLabel.textContent = sceneLabels[scene] || sceneLabels.cover || fallbackSceneLabels.cover;
    }

    window.dispatchEvent(new CustomEvent('tarski:scenechange', {
      detail: { scene }
    }));
  };

  const updateDesktopIndicator = (animate = false) => {
    if (!mainNav) return;

    const activeLink = mainNav.querySelector('a.is-active[href^="#"]');
    mainNav.classList.toggle('is-cover-state', !activeLink);

    if (!activeLink) {
      mainNav.style.setProperty('--nav-indicator-opacity', '0');
      return;
    }

    const navRect = mainNav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const indicatorY = linkRect.top - navRect.top + linkRect.height / 2;

    mainNav.style.setProperty('--nav-indicator-y', `${indicatorY.toFixed(2)}px`);
    mainNav.style.setProperty('--nav-indicator-opacity', '1');

    if (animate) {
      pulseIndicator(mainNav);
    }
  };

  const updateMobileIndicator = (animate = false) => {
    if (!mobilePanel || !mobileScroller) return;

    const activeLink = mobilePanel.querySelector('a.is-active[href^="#"]');
    if (!activeLink) {
      mobilePanel.style.setProperty('--mobile-indicator-x', `${mobileCoverIndicatorX}px`);
      mobilePanel.style.setProperty('--mobile-indicator-opacity', '0');
      return;
    }

    const panelRect = mobilePanel.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const indicatorX = linkRect.left - panelRect.left;

    mobilePanel.style.setProperty('--mobile-indicator-x', `${indicatorX.toFixed(2)}px`);
    mobilePanel.style.setProperty('--mobile-indicator-opacity', '1');

    if (animate && mobileQuery.matches) {
      pulseIndicator(mobilePanel);
    }
  };

  const updateMenuIndicators = (animate = false) => {
    updateDesktopIndicator(animate);
    updateMobileIndicator(animate);
  };

  const updateMobileScrollerMask = () => {
    if (!mobilePanel || !mobileScroller) return;

    const maxScroll = Math.max(0, mobileScroller.scrollWidth - mobileScroller.clientWidth);
    const atStart = mobileScroller.scrollLeft <= 2;
    const atEnd = mobileScroller.scrollLeft >= maxScroll - 2;

    mobilePanel.classList.toggle('has-overflow', maxScroll > 2);
    mobilePanel.classList.toggle('is-at-start', atStart);
    mobilePanel.classList.toggle('is-at-end', atEnd || maxScroll <= 2);
  };

  const scrollActiveMobileLinkIntoView = (behavior = 'smooth') => {
    if (!mobilePanel || !mobileScroller || !mobileMenu || !mobileQuery.matches) return;
    if (!mobileMenu.classList.contains('is-visible')) return;

    const activeMobileLink = mobilePanel.querySelector('a.is-active');
    if (!activeMobileLink) return;

    activeMobileLink.scrollIntoView({
      behavior,
      block: 'nearest',
      inline: 'center'
    });

    window.setTimeout(updateMobileScrollerMask, behavior === 'smooth' ? 260 : 0);
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
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => scrollActiveMobileLinkIntoView('smooth'), 40);
    } else {
      updateMenuIndicators(false);
    }
  };

  const updateActive = () => {
    if (!sections.length) return;

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
  };

  const updateMobileMenuVisibility = () => {
    if (!mobileMenu) return;

    if (!mobileQuery.matches) {
      mobileMenu.classList.remove('is-visible');
      updateMobileScrollerMask();
      updateMobileIndicator(false);
      return;
    }

    const mainNav = document.querySelector('.main-nav');
    const navBottom = mainNav ? mainNav.getBoundingClientRect().bottom : 0;
    const shouldShow = navBottom < 0;

    mobileMenu.classList.toggle('is-visible', shouldShow);

    if (shouldShow) {
      updateMobileScrollerMask();
      updateMobileIndicator(false);
      scrollActiveMobileLinkIntoView('auto');
    }
  };

  updateActive();
  updateMenuIndicators(false);
  updateMobileScrollerMask();
  updateMobileMenuVisibility();

  window.addEventListener('scroll', () => {
    updateActive();
    updateMobileMenuVisibility();
  }, { passive: true });

  mobileScroller?.addEventListener('scroll', () => {
    updateMobileScrollerMask();
    updateMobileIndicator(false);
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateActive();
    updateMenuIndicators(false);
    updateMobileScrollerMask();
    updateMobileMenuVisibility();
  });

  window.addEventListener('tarski:languagechange', () => {
    if (navLabel) {
      const sceneLabels = getSceneLabels();
      navLabel.textContent = sceneLabels[currentScene] || sceneLabels.cover || fallbackSceneLabels.cover;
    }

    updateActive();
    updateMenuIndicators(false);
    updateMobileScrollerMask();
    updateMobileMenuVisibility();
    window.setTimeout(() => scrollActiveMobileLinkIntoView('auto'), 40);
  });
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
      return rectElements.reduce((bounds, element) => {
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
  document.querySelectorAll('.editorial-disclosure').forEach((disclosure) => {
    disclosure.addEventListener('toggle', scheduleTextFocusUpdate);
  });
})();

(() => {
  const dossier = document.querySelector('[data-artist-dossier]');
  const panel = dossier?.querySelector('.artist-dossier__panel');
  const image = dossier?.querySelector('[data-artist-dossier-image]');
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

  if (!dossier || !panel || !image || !name || !role || !text || !links || !cards.length) return;

  const cardsById = new Map(cards.map((card) => [card.id, card]));
  let activeTrigger = null;
  let activeCard = null;
  let openTimerId = null;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const getOpenDetailsPrefix = () => window.tarskiI18n?.t('ui.openDetails') || 'Открыть подробности: ';
  const getCardName = (card) => card.querySelector('.artist-card__name')?.textContent.trim() || 'художника';

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

  const focusWithoutScroll = (element) => {
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      element.focus();
    }
  };

  const getCardData = (card) => {
    const cardImage = card.querySelector('.artist-card__image');
    const cardName = card.querySelector('.artist-card__name');
    const cardRole = card.querySelector('.artist-card__role');
    const cardLinks = Array.from(card.querySelectorAll('.artist-card__link'));
    const copy = Array.from(card.querySelectorAll('.artist-card__body > p:not(.artist-card__role)'));

    return {
      id: card.id,
      imageSrc: preferredImages[card.id] || cardImage?.getAttribute('src') || '',
      imageAlt: cardImage?.getAttribute('alt') || cardName?.textContent.trim() || '',
      name: cardName?.textContent.trim() || '',
      role: cardRole?.textContent.trim() || '',
      copy,
      links: cardLinks
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

  const openDossier = (card, trigger = null) => {
    const data = getCardData(card);
    activeCard = card;
    activeTrigger = trigger || document.activeElement;

    panel.dataset.artistId = card.id;
    image.src = data.imageSrc;
    image.alt = data.imageAlt;
    name.textContent = data.name;
    role.textContent = data.role;
    text.replaceChildren(...data.copy.map((item) => item.cloneNode(true)));
    links.replaceChildren(...data.links.map((item) => item.cloneNode(true)));

    dossier.classList.add('is-open');
    dossier.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('has-open-dossier');
    setCurrentIndexLink(card.id);

    window.setTimeout(() => focusWithoutScroll(panel), 0);
  };

  const closeDossier = () => {
    if (!dossier.classList.contains('is-open')) return;

    dossier.classList.remove('is-open');
    dossier.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('has-open-dossier');
    indexLinks.forEach((link) => link.removeAttribute('aria-current'));
    delete panel.dataset.artistId;

    if (activeTrigger instanceof HTMLElement) {
      focusWithoutScroll(activeTrigger);
    }

    activeTrigger = null;
    activeCard = null;
  };

  const getFocusableElements = () => Array.from(panel.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.offsetParent !== null);

  cards.forEach((card) => {
    const detailTriggers = [
      card.querySelector('.artist-card__image'),
      card.querySelector('.artist-card__name')
    ].filter(Boolean);

    detailTriggers.forEach((trigger) => {
      trigger.classList.add('artist-card__detail-trigger');
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-label', `${getOpenDetailsPrefix()}${getCardName(card)}`);
      trigger.addEventListener('click', () => openDossier(card, trigger));
      trigger.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        openDossier(card, trigger);
      });
    });
  });

  indexLinks.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', () => {
      const id = link.hash.slice(1);
      const card = cardsById.get(id);
      if (!card) return;

      window.clearTimeout(openTimerId);
      openTimerId = window.setTimeout(() => openDossier(card, link), reducedMotion() ? 0 : 560);
    });
  });

  closeControls.forEach((control) => {
    control.addEventListener('click', closeDossier);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDossier();
      return;
    }

    if (event.key !== 'Tab' || !dossier.classList.contains('is-open')) {
      return;
    }

    const focusableElements = getFocusableElements();
    if (!focusableElements.length) {
      event.preventDefault();
      focusWithoutScroll(panel);
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      focusWithoutScroll(lastElement);
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      focusWithoutScroll(firstElement);
    }
  });

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    const card = cardsById.get(id);
    if (card) {
      openDossier(card);
    }
  });

  window.addEventListener('tarski:languagechange', () => {
    syncDetailTriggerLabels();

    if (activeCard && dossier.classList.contains('is-open')) {
      openDossier(activeCard, activeTrigger);
    }
  });

  const initialCard = cardsById.get(window.location.hash.slice(1));
  if (initialCard) {
    window.setTimeout(() => openDossier(initialCard), 360);
  }
})();

(() => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const trailDuration = 10000;
  const minPointDistance = 2;
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
  let hasPointerPosition = false;

  const shouldRun = () => finePointerQuery.matches && !reducedMotionQuery.matches;

  const readTrailSettings = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const rawColor = rootStyles.getPropertyValue('--cursor-trail-rgb').trim();
    const baseWidth = parseFloat(rootStyles.getPropertyValue('--cursor-trail-base-width'));
    const extraWidth = parseFloat(rootStyles.getPropertyValue('--cursor-trail-extra-width'));
    const opacity = parseFloat(rootStyles.getPropertyValue('--cursor-trail-opacity'));

    trailRgb = rawColor ? rawColor.split(/\s+/).join(', ') : '0, 0, 0';
    trailBaseWidth = Number.isFinite(baseWidth) ? baseWidth : 1.15;
    trailExtraWidth = Number.isFinite(extraWidth) ? extraWidth : 0.65;
    trailOpacity = Number.isFinite(opacity) ? opacity : 0.95;
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
      context.lineWidth = trailBaseWidth + life * trailExtraWidth;
      context.strokeStyle = `rgba(${trailRgb}, ${life * trailOpacity})`;
      context.stroke();
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
  window.addEventListener('tarski:scenechange', readTrailSettings);

  syncTrail();
})();
