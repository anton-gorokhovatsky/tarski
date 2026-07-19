(() => {
  const supportedLanguages = ['ru', 'en', 'ja'];
  const storageKey = 'tarski-language';
  const translations = {
    ru: {
      htmlLang: 'ru',
      title: 'Страница не найдена — Tarski',
      description: 'Такой страницы нет. Вернитесь на главную Tarski или перейдите к художникам.',
      skip: 'Перейти к содержанию',
      brand: 'На главную Tarski',
      language: 'Выбор языка',
      languageNames: {
        ru: 'Русский',
        en: 'English',
        ja: '日本語'
      },
      eyebrow: 'ошибка 404',
      heading: 'Такой страницы нет',
      copy: 'Возможно, ссылка устарела или адрес набран с ошибкой.',
      routes: 'Куда перейти',
      home: 'На главную',
      artists: 'Художники'
    },
    en: {
      htmlLang: 'en',
      title: 'Page not found — Tarski',
      description: 'This page does not exist. Return to Tarski or continue to the artists.',
      skip: 'Skip to content',
      brand: 'Back to Tarski',
      language: 'Language',
      languageNames: {
        ru: 'Русский',
        en: 'English',
        ja: '日本語'
      },
      eyebrow: 'error 404',
      heading: 'Page not found',
      copy: 'The link may be outdated or the address may have been typed incorrectly.',
      routes: 'Where to go next',
      home: 'Home',
      artists: 'Artists'
    },
    ja: {
      htmlLang: 'ja',
      title: 'ページが見つかりません — Tarski',
      description: 'このページは見つかりません。Tarskiのトップまたはアーティスト一覧へお進みください。',
      skip: '本文へ移動',
      brand: 'Tarskiのトップへ',
      language: '言語',
      languageNames: {
        ru: 'Русский',
        en: 'English',
        ja: '日本語'
      },
      eyebrow: 'エラー 404',
      heading: 'ページが見つかりません',
      copy: 'リンクが古いか、アドレスが正しく入力されていない可能性があります。',
      routes: '移動先',
      home: 'トップへ',
      artists: 'アーティスト'
    }
  };

  const getInitialLanguage = () => {
    const requested = new URLSearchParams(window.location.search).get('lang');
    if (supportedLanguages.includes(requested)) return requested;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (supportedLanguages.includes(stored)) return stored;
    } catch (error) {
      // Storage may be unavailable; Russian remains the dependable fallback.
    }

    return 'ru';
  };

  const getHomeUrl = (language, hash = '') => {
    const url = new URL('/', window.location.origin);
    if (language !== 'ru') url.searchParams.set('lang', language);
    url.hash = hash;
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  const applyLanguage = (language, { persist = false, syncUrl = false } = {}) => {
    if (!supportedLanguages.includes(language)) return;
    const data = translations[language];

    document.documentElement.lang = data.htmlLang;
    document.documentElement.dataset.language = language;
    document.title = data.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);

    setText('[data-not-found-skip]', data.skip);
    setText('[data-not-found-eyebrow]', data.eyebrow);
    setText('[data-not-found-title]', data.heading);
    setText('[data-not-found-copy]', data.copy);
    setText('[data-not-found-home-label]', data.home);
    setText('[data-not-found-artists-label]', data.artists);

    const brand = document.querySelector('[data-not-found-brand]');
    if (brand) {
      brand.href = getHomeUrl(language);
      brand.setAttribute('aria-label', data.brand);
    }

    const home = document.querySelector('[data-not-found-home]');
    if (home) home.href = getHomeUrl(language);

    const artists = document.querySelector('[data-not-found-artists]');
    if (artists) artists.href = getHomeUrl(language, 'artists');

    document.querySelector('[data-not-found-languages]')?.setAttribute('aria-label', data.language);
    document.querySelector('[data-not-found-routes]')?.setAttribute('aria-label', data.routes);

    document.querySelectorAll('[data-language-option]').forEach((button) => {
      const option = button.dataset.languageOption;
      button.setAttribute('aria-pressed', String(option === language));
      button.setAttribute('aria-label', data.languageNames[option]);
    });

    if (persist) {
      try {
        window.localStorage.setItem(storageKey, language);
      } catch (error) {
        // The page remains usable when storage is unavailable.
      }
    }

    if (syncUrl) {
      const url = new URL(window.location.href);
      if (language === 'ru') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', language);
      }
      window.history.replaceState(window.history.state, '', url);
    }
  };

  document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => {
      applyLanguage(button.dataset.languageOption, { persist: true, syncUrl: true });
    });
  });

  applyLanguage(getInitialLanguage(), { syncUrl: true });
})();
