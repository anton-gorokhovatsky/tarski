(() => {
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"], .mobile-menu-panel a[href^="#"]'));
  const primaryNavLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  const sections = primaryNavLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const mobilePanel = mobileMenu?.querySelector('.mobile-menu-panel');
  const mobileScroller = mobileMenu?.querySelector('[data-mobile-menu-scroller]') || mobilePanel;
  const mobileQuery = window.matchMedia('(max-width: 720px)');

  let currentActiveId = null;
  let scrollTimer = null;

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
    const hasChanged = currentActiveId !== id;
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
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => scrollActiveMobileLinkIntoView('smooth'), 40);
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
      return;
    }

    const mainNav = document.querySelector('.main-nav');
    const navBottom = mainNav ? mainNav.getBoundingClientRect().bottom : 0;
    const shouldShow = navBottom < 0;

    mobileMenu.classList.toggle('is-visible', shouldShow);

    if (shouldShow) {
      updateMobileScrollerMask();
      scrollActiveMobileLinkIntoView('auto');
    }
  };

  updateActive();
  updateMobileScrollerMask();
  updateMobileMenuVisibility();

  window.addEventListener('scroll', () => {
    updateActive();
    updateMobileMenuVisibility();
  }, { passive: true });

  mobileScroller?.addEventListener('scroll', updateMobileScrollerMask, { passive: true });

  window.addEventListener('resize', () => {
    updateActive();
    updateMobileScrollerMask();
    updateMobileMenuVisibility();
  });
})();
