(() => {
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"], .mobile-menu-panel a[href^="#"]'));
  const primaryNavLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  const sections = primaryNavLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const mobileButton = mobileMenu?.querySelector('.mobile-menu-button');
  const mobilePanel = mobileMenu?.querySelector('.mobile-menu-panel');
  const mobileQuery = window.matchMedia('(max-width: 720px)');

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
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

  const closeMobileMenu = () => {
    if (!mobileMenu || !mobileButton || !mobilePanel) return;
    mobileMenu.classList.remove('is-open');
    mobileButton.setAttribute('aria-expanded', 'false');
    mobileButton.setAttribute('aria-label', 'Открыть меню');
    mobilePanel.hidden = true;
  };

  const openMobileMenu = () => {
    if (!mobileMenu || !mobileButton || !mobilePanel) return;
    mobilePanel.hidden = false;
    mobileMenu.classList.add('is-open');
    mobileButton.setAttribute('aria-expanded', 'true');
    mobileButton.setAttribute('aria-label', 'Закрыть меню');
  };

  const toggleMobileMenu = () => {
    if (!mobileMenu?.classList.contains('is-open')) {
      openMobileMenu();
    } else {
      closeMobileMenu();
    }
  };

  const updateMobileMenuVisibility = () => {
    if (!mobileMenu) return;

    if (!mobileQuery.matches) {
      mobileMenu.classList.remove('is-visible');
      closeMobileMenu();
      return;
    }

    const mainNav = document.querySelector('.main-nav');
    const navBottom = mainNav ? mainNav.getBoundingClientRect().bottom : 0;
    const shouldShow = navBottom < 0;

    mobileMenu.classList.toggle('is-visible', shouldShow);

    if (!shouldShow) {
      closeMobileMenu();
    }
  };

  updateActive();
  updateMobileMenuVisibility();

  window.addEventListener('scroll', () => {
    updateActive();
    updateMobileMenuVisibility();
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateActive();
    updateMobileMenuVisibility();
  });

  mobileButton?.addEventListener('click', toggleMobileMenu);

  mobilePanel?.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeMobileMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
    }
  });
})();
