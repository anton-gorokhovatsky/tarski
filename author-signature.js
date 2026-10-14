// The drawing, layout and motion remain owned by the canonical component.
// Pin this release because its link and role-language adapters use the v1 DOM.
const signatures = Array.from(document.querySelectorAll('ag-signature'));

const syncSignatures = () => {
  const language = document.documentElement.lang;
  const nameLanguage = language === 'ru' ? 'ru' : 'en';
  const name = nameLanguage === 'ru' ? 'Антон Гороховатский' : 'Anton Gorokhovatsky';

  signatures.forEach((signature) => {
    const fallback = signature.querySelector('[data-author-signature-fallback]');
    const role = signature.querySelector('[data-design-credit]');
    signature.querySelector('[data-author-name]').textContent = name;
    role.lang = language;
    signature.lang = nameLanguage;
    signature.setAttribute('role-label', role.textContent);
    signature.setAttribute('theme', document.documentElement.dataset.theme || 'light');

    if (window.tarskiMotion) {
      signature.setAttribute('controls', 'external');
      signature.toggleAttribute('paused', window.tarskiMotion.isCalm());
    }

    // v1.0.3 has no href or separate role-language attribute. Preserve a real
    // native link to the Tarski case, including Copy Link and open in new tab.
    const credit = signature.shadowRoot?.querySelector('a[rel="author"]');
    if (credit) credit.href = fallback.href;
    const renderedRole = signature.shadowRoot?.querySelector('.role');
    if (renderedRole) renderedRole.lang = language;
  });
};

if (signatures.length) {
  ['tarski:languagechange', 'tarski:themechange', 'tarski:motionchange'].forEach((event) => {
    window.addEventListener(event, syncSignatures);
  });
  syncSignatures();

  try {
    await import('https://gorokhovatsky.tech/signature/1.0.3/signature.js');
    syncSignatures();
  } catch {
    // The localized, ordinary author link remains usable when the module fails.
  }
}
