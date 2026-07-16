(() => {
  const widget = document.querySelector('[data-daylight-widget]');
  const mobilePanel = widget?.querySelector('[data-empathy-panel]');
  const mobileSettings = widget?.querySelector('[data-empathy-settings]');
  const surfaceRoots = [
    mobilePanel,
    ...document.querySelectorAll('[data-empathy-surface]')
  ].filter(Boolean);
  const weatherCareNodes = Array.from(document.querySelectorAll('[data-weather-care], [data-settings-weather-care]'));

  if (!widget || !mobilePanel || !mobileSettings || !surfaceRoots.length || !weatherCareNodes.length) return;

  const surfaces = surfaceRoots.map((root) => ({
    root,
    isMobile: root === mobilePanel,
    question: root.querySelector('[data-empathy-question]'),
    questionState: root.querySelector('[data-empathy-question-state]'),
    feedback: root.querySelector('[data-empathy-feedback]'),
    feedbackText: root.querySelector('[data-empathy-feedback-text]'),
    storageConfirmation: root.querySelector('[data-empathy-storage-confirmation]'),
    undo: root.querySelector('[data-empathy-undo]'),
    actions: root.querySelector('[data-empathy-actions]'),
    answers: Array.from(root.querySelectorAll('[data-empathy-answer]'))
  })).filter((surface) => (
    surface.question
    && surface.questionState
    && surface.feedback
    && surface.feedbackText
    && surface.storageConfirmation
    && surface.undo
    && surface.answers.length
  ));

  if (!surfaces.length) return;

  const storageKey = 'tarski-empathy-v1';
  const previewMode = new URLSearchParams(window.location.search).get('empathy') === 'preview';
  const motionAdaptiveAnswers = new Set(['tired', 'tense']);
  const validAnswers = new Set(['calm', 'tired', 'tense', 'curious', 'skip']);
  const precipitation = new Set(['drizzle', 'rain', 'showers']);
  const islandMotion = window.tarskiMobileIslandMotion;
  const mobileMenuRoot = widget.closest('[data-mobile-menu]');
  const mobileSurfaceTargets = [
    mobileMenuRoot?.querySelector('.mobile-service-depth'),
    mobileMenuRoot?.querySelector('.mobile-service-surface')
  ].filter(Boolean);
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentAnswer = null;
  let feedbackKey = null;
  let feedbackPersisted = false;
  let isMobileTransitioning = false;
  const activeMobileAnimations = new Set();

  const getLabel = (path, fallback) => window.tarskiI18n?.t(path) || fallback;
  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDailyQuestionIndex = (length) => {
    if (length <= 1) return 0;
    const dateValue = getToday().replace(/-/g, '');
    return Array.from(dateValue).reduce((total, character) => total + Number(character), 0) % length;
  };

  const syncQuestions = () => {
    const translatedQuestions = window.tarskiI18n?.t('ui.empathy.questions');
    const fallbackQuestion = window.tarskiI18n?.t('ui.empathy.question') || 'Как вы сегодня?';
    const questions = Array.isArray(translatedQuestions) && translatedQuestions.length
      ? translatedQuestions.filter((value) => typeof value === 'string' && value.trim())
      : [fallbackQuestion];
    const label = questions[getDailyQuestionIndex(questions.length)] || fallbackQuestion;
    surfaces.forEach((surface) => {
      surface.question.textContent = label;
    });
  };

  const readRecord = () => {
    if (previewMode) return null;

    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey));
      if (!value || value.date !== getToday() || !validAnswers.has(value.answer)) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      return {
        date: value.date,
        answer: value.answer,
        motionAdapted: value.motionAdapted === true && motionAdaptiveAnswers.has(value.answer)
      };
    } catch (error) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (storageError) {
        // Storage may be unavailable entirely; the current-page check-in still works.
      }
      return null;
    }
  };

  const writeRecord = (record) => {
    if (previewMode) return false;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(record));
      return true;
    } catch (error) {
      // The check-in still works for the current page when storage is unavailable.
      return false;
    }
  };

  const parseDuration = (value, fallback) => {
    const duration = Number.parseFloat(value);
    if (!Number.isFinite(duration)) return fallback;
    return String(value).trim().endsWith('s') && !String(value).trim().endsWith('ms')
      ? duration * 1000
      : duration;
  };

  const getMobileTransitionTimings = () => {
    if (reduceMotionQuery.matches) {
      return {
        contentOut: 0,
        layoutShift: 0,
        feedbackIn: 0,
        motionIn: 0,
        motionDelay: 0
      };
    }

    const style = window.getComputedStyle(widget);
    const isAlreadyCalm = window.tarskiMotion?.isCalm?.() === true;
    const scale = isAlreadyCalm ? 0.48 : 1;
    const read = (property, fallback) => (
      parseDuration(style.getPropertyValue(property), fallback) * scale
    );

    return {
      contentOut: read('--empathy-motion-content-out', 120),
      layoutShift: read('--empathy-motion-layout-shift', 420),
      feedbackIn: read('--empathy-motion-feedback-in', 220),
      motionIn: read('--empathy-motion-controls-in', 260),
      motionDelay: read('--empathy-motion-controls-delay', 100)
    };
  };

  const trackAnimation = (animation) => {
    if (!animation) return null;
    activeMobileAnimations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => activeMobileAnimations.delete(animation));
    return animation;
  };

  const animateElement = (element, keyframes, options) => {
    if (!element || !options.duration || typeof element.animate !== 'function') return null;
    return trackAnimation(element.animate(keyframes, {
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'both',
      ...options
    }));
  };

  const waitForAnimations = async (animations) => {
    await Promise.allSettled(
      animations.filter(Boolean).map((animation) => animation.finished)
    );
  };

  const setSurfaceState = (surface, state) => {
    const isQuestion = state === 'question';
    const isFeedback = state === 'feedback';

    surface.questionState.hidden = !isQuestion;
    surface.feedback.hidden = !isFeedback;
    surface.questionState.inert = !isQuestion;
    surface.feedback.inert = !isFeedback;

    if (!surface.isMobile) {
      surface.root.dataset.empathyState = state;
      return;
    }

    const isPanelVisible = isQuestion || isFeedback;
    const areSettingsVisible = true;
    widget.classList.toggle('is-empathy-question', isQuestion);
    widget.classList.toggle('is-empathy-feedback', isFeedback);
    surface.root.hidden = !isPanelVisible;
    surface.root.setAttribute('aria-hidden', String(!isPanelVisible));
    mobileSettings.setAttribute('aria-hidden', String(!areSettingsVisible));
    surface.root.inert = !isPanelVisible;
    mobileSettings.inert = !areSettingsVisible;
  };

  const syncFeedback = () => {
    if (!feedbackKey) return;
    const label = getLabel(
      `ui.empathy.feedback.${feedbackKey}`,
      feedbackKey === 'restored' ? 'Вернули системный ритм.' : 'Спасибо.'
    );
    surfaces.forEach((surface) => {
      surface.feedbackText.textContent = label;
      const isStoredAnswer = !['skip', 'restored'].includes(feedbackKey)
        && (feedbackPersisted || previewMode);
      surface.storageConfirmation.hidden = !isStoredAnswer;
    });
  };

  const syncWeatherCare = () => {
    const weatherKey = widget.dataset.weatherKey;
    const temperature = Number(widget.dataset.weatherTemperature);
    let careKey = null;

    if (weatherKey === 'thunderstorm') careKey = 'storm';
    else if (precipitation.has(weatherKey)) careKey = 'umbrella';
    else if (Number.isFinite(temperature) && temperature >= 27) careKey = 'heat';
    else if (Number.isFinite(temperature) && temperature <= 3) careKey = 'warm';
    else if (weatherKey === 'clear') careKey = 'walk';

    const label = careKey ? getLabel(`ui.weatherCare.${careKey}`, '') : '';
    weatherCareNodes.forEach((node) => {
      node.textContent = label;
      node.hidden = !label;
    });
  };

  const transitionMobileFeedback = async (surface, motionAdapted) => {
    const ticket = islandMotion?.begin?.('empathy') || { channel: 'empathy' };
    const timings = getMobileTransitionTimings();
    const motionRow = mobileSettings.querySelector('.daylight-widget__motion');
    const shouldPreviewCalm = motionAdapted && window.tarskiMotion?.isCalm?.() !== true;

    isMobileTransitioning = true;
    surface.root.setAttribute('aria-busy', 'true');
    surface.questionState.inert = true;
    mobileSettings.inert = true;
    widget.classList.add('is-empathy-transitioning', 'is-empathy-content-out');
    widget.dataset.empathyMotionPhase = 'content-out';

    const exitAnimation = animateElement(surface.questionState, [
      { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      { opacity: 0, transform: 'translate3d(0, -6px, 0)' }
    ], {
      duration: timings.contentOut
    });

    await waitForAnimations([exitAnimation]);
    if (islandMotion?.isCurrent && !islandMotion.isCurrent(ticket)) return;

    const initialSettingsTop = mobileSettings.getBoundingClientRect().top;
    setSurfaceState(surface, 'feedback');
    surface.feedback.inert = true;
    mobileSettings.inert = true;
    exitAnimation?.cancel();

    const finalSettingsTop = mobileSettings.getBoundingClientRect().top;
    const settingsDelta = initialSettingsTop - finalSettingsTop;

    widget.classList.remove('is-empathy-content-out');
    widget.classList.add('is-empathy-entering');
    widget.classList.toggle('is-empathy-motion-preview-calm', shouldPreviewCalm);
    widget.dataset.empathyMotionPhase = 'content-in';

    const settingsAnimation = animateElement(mobileSettings, [
      { transform: `translate3d(0, ${settingsDelta}px, 0)` },
      { transform: 'translate3d(0, 0, 0)' }
    ], {
      duration: timings.layoutShift
    });
    const feedbackAnimation = animateElement(surface.feedback, [
      { opacity: 0, transform: 'translate3d(0, 6px, 0)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], {
      duration: timings.feedbackIn,
      delay: Math.min(30, timings.feedbackIn * 0.15)
    });
    const motionAnimation = animateElement(motionRow, [
      { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], {
      duration: timings.motionIn,
      delay: timings.motionDelay
    });

    const surfaceAnimation = islandMotion?.wait?.(ticket, mobileSurfaceTargets)
      || Promise.resolve(true);
    await Promise.all([
      waitForAnimations([settingsAnimation, feedbackAnimation, motionAnimation]),
      surfaceAnimation
    ]);
    if (islandMotion?.isCurrent && !islandMotion.isCurrent(ticket)) return;

    if (motionAdapted) window.tarskiMotion?.setOverride('calm');
    settingsAnimation?.cancel();
    feedbackAnimation?.cancel();
    motionAnimation?.cancel();
    widget.classList.remove(
      'is-empathy-transitioning',
      'is-empathy-entering',
      'is-empathy-motion-preview-calm'
    );
    delete widget.dataset.empathyMotionPhase;
    surface.root.removeAttribute('aria-busy');
    surface.feedback.inert = false;
    mobileSettings.inert = false;
    isMobileTransitioning = false;

    const isWidgetVisible = !widget.hidden && widget.classList.contains('is-visible');
    if (isWidgetVisible) surface.feedback.focus({ preventScroll: true });
  };

  const showFeedback = (answer, motionAdapted, persisted, originSurface = null) => {
    currentAnswer = answer;
    feedbackKey = answer;
    feedbackPersisted = persisted;
    surfaces.forEach((surface) => {
      surface.undo.hidden = !motionAdapted;
      if (surface.actions) surface.actions.hidden = !motionAdapted;
    });
    syncFeedback();

    if (originSurface?.isMobile) {
      surfaces.filter((surface) => !surface.isMobile).forEach((surface) => {
        setSurfaceState(surface, 'feedback');
      });
      transitionMobileFeedback(originSurface, motionAdapted);
      return;
    }

    if (motionAdapted) window.tarskiMotion?.setOverride('calm');
    surfaces.forEach((surface) => setSurfaceState(surface, 'feedback'));
    const target = originSurface?.feedback;
    window.requestAnimationFrame(() => target?.focus?.({ preventScroll: true }));
  };

  const answer = (value, originSurface) => {
    if (originSurface?.isMobile && isMobileTransitioning) return;

    const nextAnswer = validAnswers.has(value) ? value : 'skip';
    const motionAdapted = motionAdaptiveAnswers.has(nextAnswer);

    const persisted = nextAnswer === 'skip' ? false : writeRecord({
      date: getToday(),
      answer: nextAnswer,
      motionAdapted
    });
    showFeedback(nextAnswer, motionAdapted, persisted, originSurface);
  };

  surfaces.forEach((surface) => {
    surface.answers.forEach((control) => {
      control.addEventListener('click', () => answer(control.dataset.empathyAnswer, surface));
    });

    surface.undo.addEventListener('click', () => {
      window.tarskiMotion?.setOverride(null);
      feedbackKey = 'restored';
      feedbackPersisted = false;
      surfaces.forEach((item) => {
        item.undo.hidden = true;
        if (item.actions) item.actions.hidden = true;
      });
      writeRecord({
        date: getToday(),
        answer: currentAnswer || 'skip',
        motionAdapted: false
      });
      syncFeedback();
      surface.feedback.focus({ preventScroll: true });
    });

  });

  window.addEventListener('tarski:weatherchange', syncWeatherCare);
  window.addEventListener('tarski:languagechange', () => {
    syncQuestions();
    syncFeedback();
    syncWeatherCare();
  });

  const record = readRecord();
  if (record) {
    currentAnswer = record.answer;
    feedbackKey = record.answer;
    feedbackPersisted = true;
    if (record.motionAdapted) window.tarskiMotion?.setOverride('calm');
    surfaces.forEach((surface) => {
      surface.undo.hidden = !record.motionAdapted;
      if (surface.actions) surface.actions.hidden = true;
      setSurfaceState(surface, surface.isMobile ? 'settings' : 'feedback');
    });
    syncFeedback();
  } else {
    surfaces.forEach((surface) => setSurfaceState(surface, 'question'));
  }

  syncQuestions();
  syncWeatherCare();
})();
