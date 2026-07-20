(() => {
  const section = document.querySelector('.artists-section');
  const switcher = section?.querySelector('[data-artists-view-switch]');
  const buttons = Array.from(section?.querySelectorAll('[data-artists-view-option]') || []);
  const artistIndex = section?.querySelector('.artist-index');
  const artistsList = section?.querySelector('.artists-list');
  const viewModes = new Set(['cloud', 'list']);

  if (!section || !switcher || !buttons.length || !artistIndex || !artistsList) return;

  const setView = (view) => {
    const nextView = viewModes.has(view) ? view : 'cloud';
    document.documentElement.dataset.artistsView = nextView;
    section.dataset.artistsView = nextView;
    artistIndex.setAttribute('aria-hidden', String(nextView === 'list'));
    artistsList.setAttribute('aria-hidden', String(nextView === 'cloud'));

    buttons.forEach((button) => {
      const isActive = button.dataset.artistsViewOption === nextView;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    switcher.style.setProperty('--artists-view-index', nextView === 'list' ? '1' : '0');

    window.dispatchEvent(new CustomEvent('tarski:artistsviewchange', {
      detail: { view: nextView }
    }));
  };

  const moveViewFocus = (currentIndex, step) => {
    const nextIndex = (currentIndex + step + buttons.length) % buttons.length;
    const nextButton = buttons[nextIndex];
    if (!nextButton) return;

    setView(nextButton.dataset.artistsViewOption);
    focusWithoutScroll(nextButton);
  };

  switcher.hidden = false;
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => setView(button.dataset.artistsViewOption));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveViewFocus(index, -1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveViewFocus(index, 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setView(buttons[0].dataset.artistsViewOption);
        focusWithoutScroll(buttons[0]);
      } else if (event.key === 'End') {
        const lastButton = buttons[buttons.length - 1];
        event.preventDefault();
        setView(lastButton.dataset.artistsViewOption);
        focusWithoutScroll(lastButton);
      }
    });
  });

  const previewLinks = Array.from(artistIndex.querySelectorAll('.artist-index__link'));
  let previewIntentTimerId = null;
  let previewIntentLink = null;

  const clearPreviewIntent = () => {
    window.clearTimeout(previewIntentTimerId);
    previewIntentTimerId = null;
    previewIntentLink = null;
    artistIndex.classList.remove('is-preview-intent');
  };

  previewLinks.forEach((link) => {
    link.addEventListener('pointerenter', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;

      clearPreviewIntent();
      previewIntentLink = link;
      previewIntentTimerId = window.setTimeout(() => {
        if (previewIntentLink !== link || !link.matches(':hover')) return;
        artistIndex.classList.add('is-preview-intent');
      }, window.tarskiMotion?.isCalm?.() ? 170 : 100);
    });

    link.addEventListener('pointerleave', () => {
      if (previewIntentLink === link) clearPreviewIntent();
    });
  });

  setView('cloud');
})();

(() => {
  const standaloneTextItems = Array.from(document.querySelectorAll('main.content h1, main.content h2, main.content h3, main.content p, main.content ul, main.content .editorial-disclosure'))
    .filter((item) => (
      !item.closest('.artist-card') &&
      (!item.closest('.editorial-disclosure') || item.matches('.editorial-disclosure'))
    ));
  const artistCards = Array.from(document.querySelectorAll('main.content .artist-card'));
  const groupedTextItems = new Set();

  const makeFocusUnit = (elements, rectElements = elements) => ({
    anchor: elements[0],
    elements,
    getRect() {
      return rectElements
        .filter((element) => element.offsetParent !== null)
        .reduce((bounds, element) => {
          const rect = element.getBoundingClientRect();

          if (!bounds) {
            return {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left
            };
          }

          return {
            top: Math.min(bounds.top, rect.top),
            right: Math.max(bounds.right, rect.right),
            bottom: Math.max(bounds.bottom, rect.bottom),
            left: Math.min(bounds.left, rect.left)
          };
        }, null);
    }
  });

  const textUnits = standaloneTextItems
    .map((item) => {
      if (groupedTextItems.has(item)) return null;

      if (item.matches('.section-intro h1')) {
        const intro = item.closest('.section-intro');
        const elements = Array.from(intro?.querySelectorAll('h1, .lead') || [item]);

        elements.slice(1).forEach((element) => groupedTextItems.add(element));
        return makeFocusUnit(elements, intro ? [intro] : elements);
      }

      if (item.matches('h3')) {
        const elements = [item];
        let sibling = item.nextElementSibling;

        while (
          sibling?.matches('p, ul') &&
          !sibling.closest('.artist-card') &&
          !sibling.classList.contains('lead-spaced')
        ) {
          elements.push(sibling);
          groupedTextItems.add(sibling);
          sibling = sibling.nextElementSibling;
        }

        return makeFocusUnit(elements);
      }

      if (item.matches('p') && item.nextElementSibling?.matches('ul')) {
        groupedTextItems.add(item.nextElementSibling);
        return makeFocusUnit([item, item.nextElementSibling]);
      }

      return makeFocusUnit([item]);
    })
    .filter(Boolean);

  const artistFocusUnits = artistCards.map((card) => makeFocusUnit([card], [card.querySelector('.artist-card__body') || card]));
  const artistFocusUnitsById = new Map(artistFocusUnits.map((item) => [item.anchor.id, item]));
  const focusUnits = [
    ...textUnits,
    ...artistFocusUnits
  ].sort((first, second) => {
    if (first.anchor === second.anchor) return 0;
    return first.anchor.compareDocumentPosition(second.anchor) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });

  if (!focusUnits.length) return;

  let activeItem = null;
  let frameId = null;

  const setActiveText = (item) => {
    if (activeItem === item) return;

    activeItem?.elements.forEach((element) => element.classList.remove('is-text-focus-active'));
    activeItem = item;
    activeItem?.elements.forEach((element) => element.classList.add('is-text-focus-active'));
  };

  const updateTextFocus = () => {
    frameId = null;

    const focusY = window.innerHeight * (window.innerWidth <= 720 ? 0.46 : 0.52);
    const visibilityPadding = window.innerHeight * 0.18;
    const findClosestItem = (items) => items.reduce((closest, item) => {
      const rect = item.getRect();
      if (!rect) return closest;
      if (rect.bottom < -visibilityPadding || rect.top > window.innerHeight + visibilityPadding) return closest;

      const itemCenter = rect.top + (rect.bottom - rect.top) / 2;
      const distance = Math.abs(itemCenter - focusY);
      return !closest || distance < closest.distance ? { item, distance } : closest;
    }, null)?.item || null;

    const closestArtist = document.documentElement.dataset.artistsView === 'list'
      ? findClosestItem(artistFocusUnits)
      : null;
    const closestItem = closestArtist || findClosestItem(focusUnits);

    setActiveText(closestItem);
  };

  const scheduleTextFocusUpdate = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(updateTextFocus);
    }
  };

  const scrollArtistLinkToFocus = (event) => {
    if (event.currentTarget.classList.contains('artist-index__link')) return;

    const hash = event.currentTarget.getAttribute('href');
    if (!hash?.startsWith('#')) return;

    const card = document.querySelector(hash);
    const focusUnit = card ? artistFocusUnitsById.get(card.id) : null;
    if (!card || !focusUnit) return;

    event.preventDefault();

    const target = card.querySelector('.artist-card__body') || card;
    const rect = target.getBoundingClientRect();
    const focusY = window.innerHeight * (window.innerWidth <= 720 ? 0.46 : 0.52);
    const scrollTop = window.scrollY + rect.top - Math.max(24, focusY - rect.height / 2);
    const reducedMotion = prefersCalmMotion();

    window.history.pushState(null, '', hash);
    setActiveText(focusUnit);
    window.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });

    window.setTimeout(scheduleTextFocusUpdate, reducedMotion ? 0 : 420);
    window.setTimeout(scheduleTextFocusUpdate, reducedMotion ? 0 : 760);
  };

  focusUnits.forEach((item) => item.elements.forEach((element) => element.classList.add('focus-text')));
  document.querySelectorAll('.artist-index__link[href^="#artist-"]').forEach((link) => {
    link.addEventListener('click', scrollArtistLinkToFocus);
  });
  document.documentElement.classList.add('has-text-focus');
  updateTextFocus();

  window.addEventListener('scroll', scheduleTextFocusUpdate, { passive: true });
  window.addEventListener('resize', scheduleTextFocusUpdate);
  window.addEventListener('tarski:artistsviewchange', scheduleTextFocusUpdate);
  window.addEventListener('tarski:languagechange', () => {
    scheduleTextFocusUpdate();
    window.setTimeout(scheduleTextFocusUpdate, 260);
  });
  window.addEventListener('tarski:artistsviewchange', () => {
    scheduleTextFocusUpdate();
    window.setTimeout(scheduleTextFocusUpdate, 260);
  });
  document.querySelectorAll('.editorial-disclosure').forEach((disclosure) => {
    disclosure.addEventListener('toggle', scheduleTextFocusUpdate);
  });
})();

(() => {
  const dossier = document.querySelector('[data-artist-dossier]');
  const page = document.querySelector('.page');
  const panel = dossier?.querySelector('.artist-dossier__panel');
  const image = dossier?.querySelector('[data-artist-dossier-image]');
  const galleryBlock = dossier?.querySelector('[data-artist-dossier-gallery-block]');
  const gallery = dossier?.querySelector('[data-artist-dossier-gallery]');
  const credit = dossier?.querySelector('[data-artist-dossier-credit]');
  const name = dossier?.querySelector('[data-artist-dossier-name]');
  const role = dossier?.querySelector('[data-artist-dossier-role]');
  const text = dossier?.querySelector('[data-artist-dossier-text]');
  const links = dossier?.querySelector('[data-artist-dossier-links]');
  const closeControls = Array.from(dossier?.querySelectorAll('[data-artist-dossier-close]') || []);
  const cards = Array.from(document.querySelectorAll('.artist-card'));
  const indexLinks = Array.from(document.querySelectorAll('.artist-index__link[href^="#artist-"]'));
  const preferredImages = {
    'artist-anastasia-dahl': 'assets/artist-index/330551584_215344677620530_5433914055885423503_n.jpg',
    'artist-nadezhda-ishkinyaeva': 'assets/artist-index/nadezhda-ishkinyaeva.jpg',
    'artist-elena-kolesnikova': 'assets/artist-index/Елена Колесникова.webp',
    'artist-alina-kugush': 'assets/artist-index/izobrazhenie-dsc05043-1-1500x.jpg',
    'artist-no-excuse-group': 'assets/artist-index/0015.jpg.webp'
  };
  const captionKeys = {
    ru: 'caption',
    en: 'captionEn',
    ja: 'captionJa'
  };
  const creditKeys = {
    ru: 'credit',
    en: 'creditEn',
    ja: 'creditJa'
  };
  const labelKeys = {
    ru: 'label',
    en: 'labelEn',
    ja: 'labelJa'
  };

  if (!dossier || !panel || !image || !galleryBlock || !gallery || !credit || !name || !role || !text || !links || !cards.length) return;

  const cardsById = new Map(cards.map((card) => [card.id, card]));
  let activeTrigger = null;
  let activeCard = null;
  let openTimerId = null;
  let closeTimerId = null;
  let galleryImageObserver = null;

  const reducedMotion = () => prefersCalmMotion();
  const getOpenDetailsPrefix = () => window.tarskiI18n?.t('ui.openDetails') || 'Открыть подробности: ';
  const getLinksGroupLabel = () => window.tarskiI18n?.t('ui.links.group') || 'Ссылки';
  const getCardName = (card) => card.querySelector('.artist-card__name')?.textContent.trim() || 'художника';
  const getLocalizedCaption = (item) => {
    const language = window.tarskiI18n?.getLanguage?.() || document.documentElement.dataset.language || 'ru';
    const captionKey = captionKeys[language] || captionKeys.ru;

    return item.dataset[captionKey] || item.dataset.caption || '';
  };
  const getLocalizedLabel = (item) => {
    const language = window.tarskiI18n?.getLanguage?.() || document.documentElement.dataset.language || 'ru';
    const labelKey = labelKeys[language] || labelKeys.ru;

    return item.dataset[labelKey] || item.dataset.label || '';
  };
  const getLocalizedCredit = (item) => {
    const language = window.tarskiI18n?.getLanguage?.() || document.documentElement.dataset.language || 'ru';
    const creditKey = creditKeys[language] || creditKeys.ru;

    return item?.dataset[creditKey] || item?.dataset.credit || '';
  };

  const syncDetailTriggerLabels = () => {
    cards.forEach((card) => {
      const cardName = getCardName(card);
      card
        .querySelectorAll('.artist-card__detail-trigger')
        .forEach((trigger) => {
          trigger.setAttribute('aria-label', `${getOpenDetailsPrefix()}${cardName}`);
        });
    });
  };

  const getCardData = (card) => {
    const cardImage = card.querySelector('.artist-card__image');
    const cardName = card.querySelector('.artist-card__name');
    const cardRole = card.querySelector('.artist-card__role');
    const cardLinks = Array.from(card.querySelectorAll('.artist-card__link'));
    const copy = Array.from(card.querySelectorAll('.artist-card__body > p:not(.artist-card__role)'));
    const galleryTemplate = card.querySelector('[data-artist-gallery]');
    const hasResponsiveAvif = galleryTemplate?.dataset.responsiveMedia === 'avif';
    const galleryItems = galleryTemplate
      ? Array.from(galleryTemplate.content.querySelectorAll('img')).map((item) => {
        const src = item.getAttribute('src') || '';
        const intrinsicWidth = Number(item.getAttribute('width')) || 1400;
        const avifBase = src.replace(/\.[^.]+$/, '');
        const avifSrcset = hasResponsiveAvif && src
          ? [800, 1400]
            .map((targetWidth) => `${avifBase}-${targetWidth}.avif ${Math.min(targetWidth, intrinsicWidth)}w`)
            .join(', ')
          : '';

        return {
          src,
          avifSrcset,
          alt: item.getAttribute('alt') || '',
          width: item.getAttribute('width') || '',
          height: item.getAttribute('height') || '',
          caption: getLocalizedCaption(item),
          label: getLocalizedLabel(item),
          variant: item.dataset.variant || '',
          isWide: item.classList.contains('artist-card__gallery-image--wide')
        };
      }).filter((item) => item.src)
      : [];

    return {
      id: card.id,
      imageSrc: preferredImages[card.id] || cardImage?.getAttribute('src') || '',
      imageAlt: cardImage?.getAttribute('alt') || cardName?.textContent.trim() || '',
      name: cardName?.textContent.trim() || '',
      role: cardRole?.textContent.trim() || '',
      copy,
      links: cardLinks,
      galleryItems,
      galleryLayout: galleryTemplate?.dataset.layout || '',
      galleryCredit: getLocalizedCredit(galleryTemplate)
    };
  };

  const setCurrentIndexLink = (id) => {
    indexLinks.forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${id}`;

      if (isCurrent) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const setDossierTriggerState = (id = null) => {
    const triggerSelector = '.artist-card__detail-trigger, .artist-index__link[href^="#artist-"]';

    document.querySelectorAll(triggerSelector).forEach((trigger) => {
      const triggerHash = trigger instanceof HTMLAnchorElement ? trigger.hash.slice(1) : '';
      const triggerCardId = trigger.closest('.artist-card')?.id || triggerHash;
      trigger.setAttribute('aria-expanded', String(Boolean(id) && triggerCardId === id));
    });
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setPanelOrigin = (trigger) => {
    if (!(trigger instanceof HTMLElement) || reducedMotion()) {
      panel.style.removeProperty('--dossier-origin-x');
      panel.style.removeProperty('--dossier-origin-y');
      panel.style.removeProperty('--dossier-enter-x');
      panel.style.removeProperty('--dossier-enter-y');
      return;
    }

    const sourceRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !panelRect.width || !panelRect.height) return;

    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const panelX = panelRect.left + panelRect.width / 2;
    const panelY = panelRect.top + panelRect.height / 2;
    const originX = clamp(((sourceX - panelRect.left) / panelRect.width) * 100, 8, 92);
    const originY = clamp(((sourceY - panelRect.top) / panelRect.height) * 100, 10, 90);
    const enterX = clamp((sourceX - panelX) * 0.045, -24, 24);
    const enterY = clamp((sourceY - panelY) * 0.045, -18, 18);

    panel.style.setProperty('--dossier-origin-x', `${originX.toFixed(2)}%`);
    panel.style.setProperty('--dossier-origin-y', `${originY.toFixed(2)}%`);
    panel.style.setProperty('--dossier-enter-x', `${enterX.toFixed(1)}px`);
    panel.style.setProperty('--dossier-enter-y', `${enterY.toFixed(1)}px`);
  };

  const emitThreadLink = (trigger) => {
    if (!(trigger instanceof HTMLElement) || reducedMotion()) return;

    window.requestAnimationFrame(() => {
      const sourceRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      if (!sourceRect.width || !sourceRect.height || !panelRect.width || !panelRect.height) return;

      const source = {
        x: sourceRect.left + sourceRect.width / 2 + window.scrollX,
        y: sourceRect.top + sourceRect.height / 2 + window.scrollY
      };
      const target = {
        x: panelRect.left + Math.min(panelRect.width * 0.18, 180) + window.scrollX,
        y: panelRect.top + panelRect.height * 0.5 + window.scrollY
      };

      window.dispatchEvent(new CustomEvent('tarski:threadlink', {
        detail: { source, target, kind: 'dossier' }
      }));
    });
  };

  const animateDossierContent = () => {
    if (reducedMotion()) return;

    panel.classList.remove('is-content-entering');
    void panel.offsetWidth;
    panel.classList.add('is-content-entering');
  };

  const loadGalleryImage = (galleryImage) => {
    if (!(galleryImage instanceof HTMLImageElement) || !galleryImage.dataset.src) return;

    const picture = galleryImage.closest('picture');
    picture?.querySelectorAll('source[data-srcset]').forEach((source) => {
      source.srcset = source.dataset.srcset;
      source.removeAttribute('data-srcset');
    });

    galleryImage.src = galleryImage.dataset.src;
    galleryImage.removeAttribute('data-src');
    galleryImageObserver?.unobserve(galleryImage);
  };

  const observeGalleryImages = () => {
    galleryImageObserver?.disconnect();
    galleryImageObserver = null;

    const pendingImages = Array.from(gallery.querySelectorAll('img[data-src]'));
    if (!pendingImages.length) return;

    if (!('IntersectionObserver' in window)) {
      pendingImages.forEach(loadGalleryImage);
      return;
    }

    galleryImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) loadGalleryImage(entry.target);
      });
    }, {
      root: panel,
      rootMargin: '320px 0px',
      threshold: 0.01
    });

    pendingImages.forEach((galleryImage) => galleryImageObserver.observe(galleryImage));
  };

  const syncDossierHash = (id, mode = 'replace') => {
    const hash = `#${id}`;
    if (window.location.hash === hash) return;

    const method = mode === 'push' ? 'pushState' : 'replaceState';
    window.history[method](null, '', hash);
  };

  const syncClosedDossierHash = () => {
    if (!activeCard || window.location.hash !== `#${activeCard.id}`) return;

    window.history.replaceState(null, '', '#artists');
  };

  const isVisibleElement = (element) => (
    element instanceof HTMLElement
    && !element.hidden
    && !element.closest('[hidden]')
    && element.offsetParent !== null
  );

  const getDossierFocusReturnTarget = () => {
    if (isVisibleElement(activeTrigger)) return activeTrigger;

    const currentIndexLink = activeCard
      ? indexLinks.find((link) => link.getAttribute('href') === `#${activeCard.id}`)
      : null;
    if (isVisibleElement(currentIndexLink)) return currentIndexLink;

    const visibleCardTrigger = activeCard
      ? Array
        .from(activeCard.querySelectorAll('.artist-card__detail-trigger'))
        .find(isVisibleElement)
      : null;
    if (visibleCardTrigger) return visibleCardTrigger;

    return document.querySelector('[data-artists-view-option="cloud"]');
  };

  const openDossier = (card, trigger = null, options = {}) => {
    const {
      history = 'replace',
      focus = true,
      forceRefresh = false,
      focusReturnTarget = trigger
    } = options;

    if (
      !forceRefresh &&
      activeCard === card &&
      dossier.classList.contains('is-open') &&
      !dossier.classList.contains('is-closing')
    ) {
      if (focus) window.setTimeout(() => focusWithoutScroll(panel), 0);
      syncDossierHash(card.id, history);
      return;
    }

    const data = getCardData(card);
    const previousCard = activeCard;
    const isSwitching = dossier.classList.contains('is-open') && previousCard && previousCard !== card;
    activeCard = card;
    if (focusReturnTarget instanceof HTMLElement) {
      activeTrigger = focusReturnTarget;
    } else if (previousCard !== card) {
      activeTrigger = null;
    } else if (!(activeTrigger instanceof HTMLElement)) {
      activeTrigger = null;
    }
    window.clearTimeout(closeTimerId);
    closeTimerId = null;
    dossier.classList.remove('is-closing');
    setPanelOrigin(trigger);
    const galleryItems = data.galleryItems.map((item) => {
      const galleryItem = document.createElement('figure');
      const galleryPicture = document.createElement('picture');
      const galleryImage = document.createElement('img');
      const gallerySource = item.avifSrcset ? document.createElement('source') : null;
      const galleryLabel = item.label ? document.createElement('span') : null;
      const galleryCaption = item.caption ? document.createElement('figcaption') : null;

      galleryItem.className = 'artist-dossier__gallery-item';
      galleryImage.className = 'artist-dossier__gallery-image';

      if (item.variant && /^[a-z0-9-]+$/i.test(item.variant)) {
        galleryItem.classList.add(`artist-dossier__gallery-item--${item.variant}`);
      }

      if (item.isWide) {
        galleryItem.classList.add('artist-dossier__gallery-item--wide');
        galleryImage.classList.add('artist-dossier__gallery-image--wide');
      }

      galleryImage.dataset.src = item.src;
      galleryImage.alt = item.alt || item.caption;
      if (item.width) galleryImage.width = Number(item.width);
      if (item.height) galleryImage.height = Number(item.height);
      galleryImage.loading = 'lazy';
      galleryImage.decoding = 'async';

      if (gallerySource) {
        gallerySource.type = 'image/avif';
        gallerySource.dataset.srcset = item.avifSrcset;
        gallerySource.sizes = '(max-width: 720px) calc(100vw - 64px), 50vw';
        galleryPicture.append(gallerySource);
      }

      if (galleryLabel) {
        galleryLabel.className = 'artist-dossier__gallery-label';
        galleryLabel.textContent = item.label;
        galleryItem.append(galleryLabel);
      }

      galleryPicture.append(galleryImage);
      galleryItem.append(galleryPicture);

      if (galleryCaption) {
        galleryCaption.className = 'artist-dossier__gallery-caption';
        galleryCaption.textContent = item.caption;
        galleryItem.append(galleryCaption);
      }

      return galleryItem;
    });

    panel.dataset.artistId = card.id;
    panel.classList.toggle('has-gallery', galleryItems.length > 0);
    if (data.galleryLayout) {
      panel.dataset.galleryLayout = data.galleryLayout;
    } else {
      delete panel.dataset.galleryLayout;
    }
    image.src = data.imageSrc;
    image.alt = data.imageAlt;
    gallery.replaceChildren(...galleryItems);
    observeGalleryImages();
    gallery.hidden = galleryItems.length === 0;
    credit.textContent = data.galleryCredit;
    credit.hidden = !data.galleryCredit;
    galleryBlock.hidden = galleryItems.length === 0 && !data.galleryCredit;
    name.textContent = data.name;
    role.textContent = data.role;
    text.replaceChildren(...data.copy.map((item) => item.cloneNode(true)));
    links.replaceChildren(...data.links.map((item) => item.cloneNode(true)));
    if (data.links.length) {
      links.setAttribute('role', 'group');
      links.setAttribute('aria-label', `${getLinksGroupLabel()}: ${data.name}`);
    } else {
      links.removeAttribute('role');
      links.removeAttribute('aria-label');
    }
    panel.scrollTop = 0;

    dossier.removeAttribute('inert');
    page?.setAttribute('inert', '');
    dossier.classList.add('is-open');
    dossier.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('has-open-dossier');
    setCurrentIndexLink(card.id);
    setDossierTriggerState(card.id);
    syncDossierHash(card.id, history);
    emitThreadLink(trigger || indexLinks.find((link) => link.getAttribute('href') === `#${card.id}`));

    if (isSwitching) {
      animateDossierContent();
    }

    if (focus) window.setTimeout(() => focusWithoutScroll(panel), 0);
  };

  const closeDossier = (options = {}) => {
    const {
      restoreFocus = true,
      updateHash = true
    } = options;

    if (!dossier.classList.contains('is-open') && !dossier.classList.contains('is-closing')) return;

    const triggerToRestore = getDossierFocusReturnTarget();

    dossier.classList.remove('is-open');
    dossier.classList.add('is-closing');
    dossier.setAttribute('inert', '');
    page?.removeAttribute('inert');
    window.clearTimeout(openTimerId);
    window.clearTimeout(closeTimerId);
    indexLinks.forEach((link) => link.removeAttribute('aria-current'));
    setDossierTriggerState();

    if (updateHash) {
      syncClosedDossierHash();
    }

    if (restoreFocus && triggerToRestore instanceof HTMLElement) {
      focusWithoutScroll(triggerToRestore);
    }

    const finishClose = () => {
      galleryImageObserver?.disconnect();
      galleryImageObserver = null;
      dossier.classList.remove('is-closing');
      dossier.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('has-open-dossier');
      delete panel.dataset.artistId;
      panel.classList.remove('has-gallery', 'is-content-entering');
      activeTrigger = null;
      activeCard = null;
    };

    if (reducedMotion()) {
      finishClose();
    } else {
      closeTimerId = window.setTimeout(finishClose, 420);
    }
  };

  cards.forEach((card) => {
    const detailTrigger = card.querySelector('.artist-card__detail-trigger');
    const cardImage = card.querySelector('.artist-card__image');
    if (!detailTrigger) return;

    detailTrigger.setAttribute('aria-haspopup', 'dialog');
    detailTrigger.setAttribute('aria-controls', panel.id);
    detailTrigger.setAttribute('aria-expanded', 'false');
    detailTrigger.setAttribute('aria-label', `${getOpenDetailsPrefix()}${getCardName(card)}`);
    detailTrigger.addEventListener('click', () => openDossier(card, detailTrigger, { history: 'push' }));

    if (cardImage) {
      cardImage.classList.add('artist-card__image--detail-pointer');
      cardImage.addEventListener('click', () => openDossier(card, cardImage, {
        history: 'push',
        focusReturnTarget: detailTrigger
      }));
    }
  });

  indexLinks.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', panel.id);
    link.setAttribute('aria-expanded', 'false');
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const id = link.hash.slice(1);
      const card = cardsById.get(id);
      if (!card) return;

      event.preventDefault();
      window.clearTimeout(openTimerId);
      openDossier(card, link, { history: 'push' });
    });
  });

  closeControls.forEach((control) => {
    control.addEventListener('click', closeDossier);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!dossier.classList.contains('is-open')) return;

      event.preventDefault();
      closeDossier();
      return;
    }

    if (event.key !== 'Tab' || !dossier.classList.contains('is-open')) {
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
    const activeElement = document.activeElement;

    if (activeElement === panel) {
      event.preventDefault();
      focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    } else if (!panel.contains(activeElement)) {
      event.preventDefault();
      focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    } else if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      focusWithoutScroll(lastElement);
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      focusWithoutScroll(firstElement);
    }
  });

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    const card = cardsById.get(id);
    if (card) {
      openDossier(card, null, { history: 'replace' });
    } else if (dossier.classList.contains('is-open')) {
      closeDossier({ updateHash: false });
    }
  });

  window.addEventListener('tarski:languagechange', () => {
    syncDetailTriggerLabels();

    if (activeCard && dossier.classList.contains('is-open')) {
      openDossier(activeCard, activeTrigger, { forceRefresh: true });
    }
  });

  const initialCard = cardsById.get(window.location.hash.slice(1));
  if (initialCard) {
    window.setTimeout(() => openDossier(initialCard, null, { history: 'replace' }), 360);
  }
})();
