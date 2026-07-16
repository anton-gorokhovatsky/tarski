(() => {
  const service = document.querySelector('[data-mobile-service]');
  const menu = service?.closest('[data-mobile-menu]');
  const toggle = service?.querySelector('[data-mobile-service-toggle]');
  const panel = service?.querySelector('[data-mobile-service-panel]');
  const code = service?.querySelector('[data-mobile-service-code]');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
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

  const motion = window.tarskiMobileIslandMotion;
  const motionTargets = [
    service,
    panel,
    toggle,
    toggle.querySelector('span'),
    menu?.querySelector('.mobile-island-depth'),
    menu?.querySelector('.mobile-island-surface'),
    menu?.querySelector('.mobile-service-depth'),
    menu?.querySelector('.mobile-service-surface')
  ].filter(Boolean);

  let openFrame = null;
  let activeTrigger = null;

  const setServiceMotionPhase = (phase) => {
    if (!menu) return;
    if (phase) menu.dataset.serviceMotionPhase = phase;
    else delete menu.dataset.serviceMotionPhase;
  };

  const setToggleState = (isOpen) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', getLabel(isOpen));
    toggle.setAttribute('title', getLabel(isOpen));
  };

  const updateServiceShellWidth = () => {
    if (!menu) return;

    const wasHidden = panel.hidden;

    panel.hidden = false;
    menu.classList.add('is-measuring-service');

    const menuStyle = window.getComputedStyle(menu);
    const panelWidth = panel.getBoundingClientRect().width;
    const gap = Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-open-gap')) || 0;
    const padX = (Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-pad-left')) || 0)
      + (Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-pad-right')) || 0);
    const toggleWidth = Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-toggle-open-size'))
      || toggle.getBoundingClientRect().height;
    const minShellWidth = Number.parseFloat(menuStyle.getPropertyValue('--mobile-service-shell-min-width')) || 0;
    const shellWidth = Math.ceil(Math.max(minShellWidth, panelWidth + gap + toggleWidth + padX));

    menu.style.setProperty('--mobile-service-shell-width', `${shellWidth}px`);

    panel.hidden = wasHidden;
    menu.classList.remove('is-measuring-service');
  };

  const setPanelHiddenState = (isHidden) => {
    panel.hidden = isHidden;
    panel.setAttribute('aria-hidden', String(isHidden));
  };

  const setOpen = (isOpen, options = {}) => {
    const motionTicket = motion.begin('service');
    const isExpanded = service.classList.contains('is-open')
      || service.classList.contains('is-closing')
      || menu?.classList.contains('is-service-open')
      || menu?.classList.contains('is-service-closing')
      || toggle.getAttribute('aria-expanded') === 'true';

    if (!isOpen && !isExpanded) {
      setToggleState(false);
      setPanelHiddenState(true);
      setServiceMotionPhase(null);
      return;
    }

    window.cancelAnimationFrame(openFrame);
    openFrame = null;

    if (isOpen) {
      if (!isExpanded) {
        activeTrigger = options.restoreTarget instanceof HTMLElement
          ? options.restoreTarget
          : (document.activeElement instanceof HTMLElement ? document.activeElement : toggle);
      }
      window.dispatchEvent(new CustomEvent('tarski:mobileserviceopen'));
    }

    if (isOpen) {
      updateServiceShellWidth();
      setPanelHiddenState(false);
      setServiceMotionPhase('surface-morph');
      service.classList.remove('is-closing');
      menu?.classList.remove('is-service-closing');
      setToggleState(true);

      if (service.classList.contains('is-open') || menu?.classList.contains('is-service-open')) {
        service.classList.add('is-open');
        menu?.classList.add('is-service-open');
        setServiceMotionPhase(null);
        return;
      }

      menu?.getBoundingClientRect();
      openFrame = window.requestAnimationFrame(() => {
        openFrame = null;
        if (!motion.isCurrent(motionTicket) || toggle.getAttribute('aria-expanded') !== 'true') return;

        service.classList.add('is-open');
        menu?.classList.add('is-service-open');
        motion.wait(motionTicket, motionTargets).then((isCurrent) => {
          if (isCurrent && toggle.getAttribute('aria-expanded') === 'true') {
            setServiceMotionPhase(null);
          }
        });
      });
      return;
    }

    const shouldRestoreFocus = options.restoreFocus !== false;

    window.dispatchEvent(new CustomEvent('tarski:daylightclose'));
    setServiceMotionPhase('surface-morph');
    setToggleState(false);
    service.classList.add('is-closing');
    menu?.classList.add('is-service-closing');
    service.classList.remove('is-open');
    menu?.classList.remove('is-service-open');

    if (shouldRestoreFocus && activeTrigger instanceof HTMLElement) {
      const triggerToRestore = activeTrigger;
      window.setTimeout(() => focusWithoutScroll(triggerToRestore), 0);
    }

    activeTrigger = null;

    motion.wait(motionTicket, motionTargets).then((isCurrent) => {
      if (!isCurrent || toggle.getAttribute('aria-expanded') === 'true') return;
      service.classList.remove('is-closing');
      menu?.classList.remove('is-service-closing');
      setPanelHiddenState(true);
      setServiceMotionPhase(null);
      window.dispatchEvent(new CustomEvent('tarski:mobileislandresize'));
    });
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
  window.addEventListener('tarski:mobileserviceopenrequest', () => {
    setOpen(true, { restoreTarget: toggle });
  });
  window.addEventListener('tarski:mobilemenuopen', () => setOpen(false));
  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) setOpen(false, { restoreFocus: false });
  });
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
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  const closeControls = Array.from(document.querySelectorAll('[data-mobile-menu-close]'));
  const modalBackground = [
    document.querySelector('.site-header'),
    document.querySelector('.content'),
    document.querySelector('.site-footer'),
    toggle,
    menu?.querySelector('.mobile-mail-pill'),
    menu?.querySelector('.mobile-service')
  ].filter(Boolean);

  if (!menu || !toggle || !drawer || !panel) return;

  const motion = window.tarskiMobileIslandMotion;
  const menuDepth = menu.querySelector('.mobile-menu-expanded-depth');
  const motionTargets = [
    panel,
    menuDepth,
    menu.querySelector('.mobile-island-depth'),
    menu.querySelector('.mobile-island-surface'),
    toggle,
    menu.querySelector('.mobile-mail-pill'),
    menu.querySelector('.mobile-service')
  ].filter(Boolean);
  const contentTargets = [...panel.children];

  let openFrame = null;
  let activeTrigger = null;

  const setMenuMotionPhase = (phase) => {
    if (phase) menu.dataset.menuMotionPhase = phase;
    else delete menu.dataset.menuMotionPhase;
  };

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

  const setModalBackgroundInert = (isInert) => {
    modalBackground.forEach((element) => {
      element.toggleAttribute('inert', isInert);
    });
  };

  const setOpen = (isOpen, options = {}) => {
    const motionTicket = motion.begin('menu');

    if (isOpen) {
      window.cancelAnimationFrame(openFrame);
      setMenuMotionPhase('surface-morph');
      activeTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      window.dispatchEvent(new CustomEvent('tarski:mobilemenuopen'));
      drawer.hidden = false;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      menu.classList.remove('is-menu-closing', 'is-menu-compacting');
      syncToggleState(true);
      setModalBackgroundInert(true);
      panel.getBoundingClientRect();

      openFrame = window.requestAnimationFrame(() => {
        openFrame = null;
        if (!motion.isCurrent(motionTicket) || toggle.getAttribute('aria-expanded') !== 'true') return;

        menu.classList.add('is-menu-open');
        drawer.classList.add('is-open');
        window.dispatchEvent(new CustomEvent('tarski:mobileislandresize'));

        motion.wait(motionTicket, motionTargets).then((isCurrent) => {
          if (isCurrent && menu.classList.contains('is-menu-open')) {
            menu.classList.add('is-menu-settled');
            setMenuMotionPhase(null);
          }

          if (isCurrent && options.focus && toggle.getAttribute('aria-expanded') === 'true') {
            focusWithoutScroll(panel);
          }
        });
      });
      return;
    }

    const isExpanded = menu.classList.contains('is-menu-open')
      || menu.classList.contains('is-menu-closing')
      || toggle.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      syncToggleState(false);
      setMenuMotionPhase(null);
      return;
    }

    window.cancelAnimationFrame(openFrame);
    openFrame = null;

    const shouldRestoreFocus = options.restoreFocus !== false;

    drawer.classList.remove('is-open');
    setMenuMotionPhase('content-out');
    menu.classList.add('is-menu-closing');
    menu.classList.remove('is-menu-settled');
    panel.setAttribute('aria-hidden', 'true');
    syncToggleState(false);
    setModalBackgroundInert(false);

    panel.getBoundingClientRect();

    if (shouldRestoreFocus && activeTrigger instanceof HTMLElement) {
      const triggerToRestore = activeTrigger;
      window.requestAnimationFrame(() => focusWithoutScroll(triggerToRestore));
    }

    activeTrigger = null;

    const finishClosing = async () => {
      const contentFinished = await motion.wait(motionTicket, contentTargets);
      if (!contentFinished || toggle.getAttribute('aria-expanded') === 'true') return;

      setMenuMotionPhase('surface-morph');
      menu.classList.add('is-menu-compacting');
      menu.classList.remove('is-menu-open');

      const compactFinished = await motion.wait(motionTicket, motionTargets);
      if (!compactFinished || toggle.getAttribute('aria-expanded') === 'true') return;

      menu.classList.remove('is-menu-closing', 'is-menu-compacting');
      setMenuMotionPhase(null);
      window.dispatchEvent(new CustomEvent('tarski:mobileislandresize'));

      if (!drawer.classList.contains('is-open')) {
        drawer.hidden = true;
        panel.hidden = true;
      }
    };

    finishClosing();
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

    if (document.activeElement === panel) {
      event.preventDefault();
      focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    } else if (!panel.contains(document.activeElement)) {
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

  window.addEventListener('tarski:mobileserviceopen', () => setOpen(false, { restoreFocus: false }));
  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) setOpen(false, { restoreFocus: false });
  });
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
  const placementMotion = window.tarskiMobileIslandMotion;
  const navLabel = mainNav?.querySelector('.nav-label');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  const placementClasses = ['is-home-arriving', 'is-docking', 'is-returning-home'];
  const placementHysteresis = 10;
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
  let navigationFrame = null;
  let placementInitialized = false;
  let needsIndicatorUpdate = false;
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

  const clearPlacementMotion = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove(...placementClasses);
    delete mobileMenu.dataset.placementMotionPhase;
  };

  const startPlacementMotion = (placementClass, phase) => {
    if (!mobileMenu) return;

    const ticket = placementMotion?.begin?.('placement');
    clearPlacementMotion();

    if (!ticket || prefersCalmMotion()) return;

    mobileMenu.classList.add(placementClass);
    mobileMenu.dataset.placementMotionPhase = phase;
    placementMotion.wait(ticket, [mobileMenu]).then((isCurrent) => {
      if (!isCurrent || !mobileMenu.classList.contains(placementClass)) return;
      clearPlacementMotion();
    });
  };

  const updateMobileMenuVisibility = ({ initial = false } = {}) => {
    if (!mobileMenu) return;
    if (!initial && !placementInitialized) return;

    if (!mobileQuery.matches) {
      placementMotion?.begin?.('placement');
      mobileMenu.classList.remove('is-visible');
      clearPlacementMotion();
      return;
    }

    const mainNav = document.querySelector('.main-nav');
    const mobileHomeBottom = mobileMenuHome ? mobileMenuHome.getBoundingClientRect().bottom : null;
    const navBottom = mainNav ? mainNav.getBoundingClientRect().bottom : 0;
    const isVisible = mobileMenu.classList.contains('is-visible');
    const placementMarker = mobileHomeBottom ?? navBottom;
    const shouldShow = initial
      ? placementMarker < 0
      : isVisible
        ? placementMarker < placementHysteresis
        : placementMarker < -placementHysteresis;

    if (shouldShow === isVisible && !initial) return;

    mobileMenu.classList.toggle('is-visible', shouldShow);

    if (shouldShow) {
      startPlacementMotion('is-docking', 'dock');
    } else if (initial) {
      startPlacementMotion('is-home-arriving', 'initial-home');
    } else {
      startPlacementMotion('is-returning-home', 'return-home');
    }
  };

  const initializeMobilePlacement = () => {
    if (!mobileMenu) return;

    if (mobileQuery.matches && !prefersCalmMotion()) {
      mobileMenu.classList.add('is-placement-pending');
    }

    const start = () => window.requestAnimationFrame(() => {
      mobileMenu.classList.remove('is-placement-pending');
      placementInitialized = true;
      updateMobileMenuVisibility({ initial: true });
    });

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  };

  const updateNavigationState = () => {
    navigationFrame = null;
    updateActive();
    updateNavLabel();
    if (needsIndicatorUpdate) {
      updateMenuIndicators(false);
      needsIndicatorUpdate = false;
    }
    updateMobileMenuVisibility();
  };

  const scheduleNavigationState = (withIndicator = false) => {
    needsIndicatorUpdate ||= withIndicator;
    if (navigationFrame === null) {
      navigationFrame = window.requestAnimationFrame(updateNavigationState);
    }
  };

  updateActive();
  updateMenuIndicators(false);
  initializeMobilePlacement();

  window.addEventListener('scroll', () => scheduleNavigationState(), { passive: true });

  window.addEventListener('resize', () => scheduleNavigationState(true));

  window.addEventListener('tarski:languagechange', () => {
    updateActive();
    updateNavLabel();
    updateMenuIndicators(false);
    window.setTimeout(() => scheduleNavigationState(true), 40);
  });

  window.addEventListener('tarski:mobileislandresize', () => scheduleNavigationState());
})();
