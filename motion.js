(() => {
  const storageKey = 'tarski-motion';
  const systemQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = Array.from(document.querySelectorAll('[data-motion-mode]'));

  const readPreference = () => {
    try {
      return window.localStorage.getItem(storageKey) === 'calm' ? 'calm' : 'system';
    } catch (error) {
      return 'system';
    }
  };

  let preference = readPreference();
  const isCalm = () => preference === 'calm' || systemQuery.matches;

  const sync = ({ announce = false } = {}) => {
    const effective = isCalm() ? 'calm' : 'full';
    document.documentElement.dataset.motionPreference = preference;
    document.documentElement.dataset.effectiveMotion = effective;
    controls.forEach((control) => {
      control.setAttribute('aria-pressed', String(control.dataset.motionMode === preference));
    });

    if (announce) {
      window.dispatchEvent(new CustomEvent('tarski:motionchange', {
        detail: { preference, effective }
      }));
    }
  };

  const setPreference = (value) => {
    preference = value === 'calm' ? 'calm' : 'system';
    try {
      window.localStorage.setItem(storageKey, preference);
    } catch (error) {
      // The control still works for the current page when storage is unavailable.
    }
    sync({ announce: true });
  };

  controls.forEach((control) => {
    control.addEventListener('click', () => setPreference(control.dataset.motionMode));
  });
  systemQuery.addEventListener?.('change', () => sync({ announce: true }));

  window.tarskiMotion = {
    getPreference: () => preference,
    isCalm,
    setPreference
  };

  sync();
})();
