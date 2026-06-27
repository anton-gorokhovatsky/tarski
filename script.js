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
  const mobileQuery = window.matchMedia('(max-width: 720px)');

  let currentActiveId = null;
  let scrollTimer = null;
  const indicatorTimers = new WeakMap();

  const pulseIndicator = (container) => {
    if (!container) return;

    window.clearTimeout(indicatorTimers.get(container));
    container.classList.add('is-indicator-moving');
    indicatorTimers.set(container, window.setTimeout(() => {
      container.classList.remove('is-indicator-moving');
    }, 280));
  };

  const updateDesktopIndicator = (animate = false) => {
    if (!mainNav) return;

    const activeLink = mainNav.querySelector('a.is-active[href^="#"]');
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

    const marker = window.scrollY + window.innerHeight * 0.38;
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
})();
