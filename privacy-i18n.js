(() => {
  const supportedLanguages = ['ru', 'en', 'ja'];
  const storageKey = 'tarski-language';
  const translations = {
    ru: {
      htmlLang: 'ru',
      title: 'Аналитика и конфиденциальность — Tarski',
      description: 'Короткая заметка об использовании аналитики на сайте Tarski.',
      back: 'На главную Tarski',
      eyebrow: 'служебная информация',
      heading: ['Аналитика', 'и конфиденциальность'],
      paragraphs: {
        intro:
          'На сайте используется Яндекс Метрика, чтобы понимать, какие страницы открывают посетители, как работает навигация и где интерфейс можно сделать удобнее.',
        collection:
          'Метрика может собирать технические данные о визите: адрес открытой страницы, источник перехода, примерный регион, тип устройства и браузера, а также действия на странице: переходы по ссылкам, клики, прокрутку и записи действий посетителя с помощью технологии «Вебвизор».',
        usage:
          'Мы используем эти данные только в агрегированном виде для поддержки и улучшения сайта и не пытаемся идентифицировать конкретных посетителей.',
        optout:
          'Если вы не хотите передавать такие данные, можно ограничить cookies и сторонние скрипты в настройках браузера или использовать расширения для блокировки аналитики.',
        contact: ['По вопросам, связанным с сайтом и аналитикой, можно написать на ', '.']
      }
    },
    en: {
      htmlLang: 'en',
      title: 'Analytics and Privacy — Tarski',
      description: 'A short note about analytics used on the Tarski website.',
      back: 'Back to Tarski',
      eyebrow: 'service information',
      heading: ['Analytics', 'and Privacy'],
      paragraphs: {
        intro:
          'This website uses Yandex Metrica to understand which pages visitors open, how navigation works, and where the interface can be improved.',
        collection:
          'Metrica may collect technical visit data: the address of the page opened, referral source, approximate region, device and browser type, and actions on the page, including link visits, clicks, scrolling, and session recordings through Webvisor.',
        usage:
          'We use this data only in aggregate to maintain and improve the website and do not attempt to identify individual visitors.',
        optout:
          'If you do not want to share this data, you can restrict cookies and third-party scripts in your browser settings or use analytics-blocking extensions.',
        contact: ['For questions about the website and analytics, email ', '.']
      }
    },
    ja: {
      htmlLang: 'ja',
      title: 'アクセス解析とプライバシー — Tarski',
      description: 'Tarskiウェブサイトで使用しているアクセス解析についてのご案内です。',
      back: 'Tarskiのトップへ',
      eyebrow: 'サイト情報',
      heading: ['アクセス解析と', 'プライバシー'],
      paragraphs: {
        intro:
          '本サイトでは、閲覧されたページ、ナビゲーションの利用状況、インターフェースの改善点を把握するために、Yandex Metricaを使用しています。',
        collection:
          'Metricaは、閲覧ページのURL、参照元、おおよその地域、端末やブラウザの種類に加え、リンクの移動、クリック、スクロール、Webvisorによるセッション記録など、ページ上の操作に関する技術情報を収集する場合があります。',
        usage:
          'これらの情報は、サイトの維持・改善を目的として集計された形でのみ使用し、個々の訪問者を特定することはありません。',
        optout:
          'こうした情報の送信を希望しない場合は、ブラウザの設定でCookieや外部スクリプトを制限するか、アクセス解析をブロックする拡張機能をご利用ください。',
        contact: ['サイトおよびアクセス解析に関するお問い合わせは、', ' までお寄せください。']
      }
    }
  };

  const getLanguage = () => {
    const requested = new URLSearchParams(window.location.search).get('lang');
    if (supportedLanguages.includes(requested)) return requested;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (supportedLanguages.includes(stored)) return stored;
    } catch (error) {
      // Privacy or storage settings may make localStorage unavailable.
    }

    return 'ru';
  };

  const getPageUrl = (language) =>
    language === 'ru' ? 'https://tarski.ru/privacy.html' : `https://tarski.ru/privacy.html?lang=${language}`;

  const setHeading = (element, lines) => {
    if (!element) return;
    element.replaceChildren(
      document.createTextNode(lines[0]),
      document.createElement('br'),
      document.createTextNode(`\n${lines[1]}`)
    );
  };

  const setContact = (element, parts) => {
    if (!element) return;
    const link = document.createElement('a');
    link.href = 'mailto:tarski.fund@gmail.com?subject=Tarski';
    link.textContent = 'tarski.fund@gmail.com';
    element.replaceChildren(document.createTextNode(parts[0]), link, document.createTextNode(parts[1]));
  };

  const language = getLanguage();
  const data = translations[language];
  const backLink = document.querySelector('[data-privacy-back]');
  const canonical = getPageUrl(language);

  document.documentElement.lang = data.htmlLang;
  document.documentElement.dataset.language = language;
  document.title = data.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelectorAll('[data-privacy-alternate]').forEach((link) => {
    const alternateLanguage = link.dataset.privacyAlternate;
    link.href = getPageUrl(alternateLanguage === 'x-default' ? 'ru' : alternateLanguage);
  });

  if (backLink) {
    backLink.href = language === 'ru' ? '/' : `/?lang=${language}`;
    backLink.setAttribute('aria-label', data.back);
  }

  const eyebrow = document.querySelector('[data-privacy-eyebrow]');
  if (eyebrow) eyebrow.textContent = data.eyebrow;
  setHeading(document.querySelector('[data-privacy-title]'), data.heading);

  ['intro', 'collection', 'usage', 'optout'].forEach((key) => {
    const paragraph = document.querySelector(`[data-privacy-copy="${key}"]`);
    if (paragraph) paragraph.textContent = data.paragraphs[key];
  });
  setContact(document.querySelector('[data-privacy-copy="contact"]'), data.paragraphs.contact);
})();
