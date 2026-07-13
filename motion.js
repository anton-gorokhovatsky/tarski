(() => {
  const storageKey = 'tarski-motion';
  const systemQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = Array.from(document.querySelectorAll('[data-motion-mode]'));
  const groups = Array.from(document.querySelectorAll('[data-motion-mode-group]'));

  const readPreference = () => {
    try {
      return window.localStorage.getItem(storageKey) === 'calm' ? 'calm' : 'system';
    } catch (error) {
      return 'system';
    }
  };

  let preference = readPreference();
  let temporaryOverride = null;
  const isCalm = () => temporaryOverride === 'calm' || preference === 'calm' || systemQuery.matches;

  const sync = ({ announce = false } = {}) => {
    const effective = isCalm() ? 'calm' : 'full';
    const displayedPreference = temporaryOverride === 'calm' ? 'calm' : preference;
    document.documentElement.dataset.motionPreference = preference;
    document.documentElement.dataset.effectiveMotion = effective;
    controls.forEach((control) => {
      control.setAttribute('aria-pressed', String(control.dataset.motionMode === displayedPreference));
    });
    groups.forEach((group) => {
      group.style.setProperty('--motion-mode-index', displayedPreference === 'calm' ? '1' : '0');
    });

    if (announce) {
      window.dispatchEvent(new CustomEvent('tarski:motionchange', {
        detail: { preference, effective }
      }));
    }
  };

  const setPreference = (value) => {
    preference = value === 'calm' ? 'calm' : 'system';
    temporaryOverride = null;
    try {
      window.localStorage.setItem(storageKey, preference);
    } catch (error) {
      // The control still works for the current page when storage is unavailable.
    }
    sync({ announce: true });
  };

  const setOverride = (value) => {
    temporaryOverride = value === 'calm' ? 'calm' : null;
    sync({ announce: true });
  };

  controls.forEach((control) => {
    control.addEventListener('click', () => setPreference(control.dataset.motionMode));
  });
  systemQuery.addEventListener?.('change', () => sync({ announce: true }));

  window.tarskiMotion = {
    getPreference: () => preference,
    getOverride: () => temporaryOverride,
    isCalm,
    setPreference,
    setOverride
  };

  sync();
})();
