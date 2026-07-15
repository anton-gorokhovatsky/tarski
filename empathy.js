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
  const precipitation = new Set(['drizzle', 'rain', 'showers', 'thunderstorm']);
  let currentAnswer = null;
  let feedbackKey = null;
  let feedbackPersisted = false;

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

  const setSurfaceState = (surface, state) => {
    const isQuestion = state === 'question';
    const isFeedback = state === 'feedback';

    surface.questionState.hidden = !isQuestion;
    surface.feedback.hidden = !isFeedback;

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
      surface.storageConfirmation.hidden = !feedbackPersisted || ['skip', 'restored'].includes(feedbackKey);
    });
  };

  const syncWeatherCare = () => {
    const weatherKey = widget.dataset.weatherKey;
    const temperature = Number(widget.dataset.weatherTemperature);
    let careKey = null;

    if (precipitation.has(weatherKey)) careKey = 'umbrella';
    else if (Number.isFinite(temperature) && temperature >= 27) careKey = 'heat';
    else if (Number.isFinite(temperature) && temperature <= 3) careKey = 'warm';
    else if (weatherKey === 'clear') careKey = 'walk';

    const label = careKey ? getLabel(`ui.weatherCare.${careKey}`, '') : '';
    weatherCareNodes.forEach((node) => {
      node.textContent = label;
      node.hidden = !label;
    });
  };

  const showFeedback = (answer, motionAdapted, persisted, originSurface = null) => {
    currentAnswer = answer;
    feedbackKey = answer;
    feedbackPersisted = persisted;
    surfaces.forEach((surface) => {
      surface.undo.hidden = !motionAdapted;
      if (surface.actions) surface.actions.hidden = !motionAdapted;
      setSurfaceState(surface, 'feedback');
    });
    syncFeedback();

    const target = originSurface?.feedback;
    window.requestAnimationFrame(() => target?.focus?.({ preventScroll: true }));
  };

  const answer = (value, originSurface) => {
    const nextAnswer = validAnswers.has(value) ? value : 'skip';
    const motionAdapted = motionAdaptiveAnswers.has(nextAnswer);

    window.tarskiMotion?.setOverride(motionAdapted ? 'calm' : null);
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
    window.tarskiMotion?.setOverride(record.motionAdapted ? 'calm' : null);
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
