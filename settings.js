(() => {
  const root = document.querySelector('[data-site-settings]');
  const panel = root?.querySelector('[data-site-settings-panel]');
  const openControls = Array.from(document.querySelectorAll('[data-settings-open]'));
  const closeControls = Array.from(root?.querySelectorAll('[data-settings-close]') || []);
  if (!root || !panel || !openControls.length) return;

  const focusableSelector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'summary',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  let restoreFocus = null;

  const getFocusable = () => Array.from(panel.querySelectorAll(focusableSelector))
    .filter((element) => !element.hidden && element.getClientRects().length > 0);

  const setOpen = (open, { trigger = null } = {}) => {
    const isOpen = root.classList.contains('is-open');
    if (open === isOpen) return;

    if (open) {
      restoreFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
      window.dispatchEvent(new CustomEvent('tarski:daylightclose'));
      root.hidden = false;
      root.inert = false;
      root.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('has-site-settings');
      window.requestAnimationFrame(() => {
        root.classList.add('is-open');
        panel.focus({ preventScroll: true });
        window.tarskiDaylight?.refresh?.({ animateMarker: true });
      });
      return;
    }

    root.classList.remove('is-open');
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('has-site-settings');
    window.setTimeout(() => {
      if (root.classList.contains('is-open')) return;
      root.hidden = true;
      restoreFocus?.focus?.({ preventScroll: true });
      restoreFocus = null;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320);
  };

  openControls.forEach((control) => {
    control.addEventListener('click', () => setOpen(true, { trigger: control }));
  });
  closeControls.forEach((control) => control.addEventListener('click', () => setOpen(false)));
  window.addEventListener('tarski:settingsrequest', (event) => {
    setOpen(true, { trigger: event.detail?.trigger });
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.tarskiSettings = {
    open: (trigger) => setOpen(true, { trigger }),
    close: () => setOpen(false),
    isOpen: () => root.classList.contains('is-open')
  };
})();
