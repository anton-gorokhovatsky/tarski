(() => {
  const widget = document.querySelector('[data-daylight-widget]');
  const panel = widget?.querySelector('[data-empathy-panel]');
  const settings = widget?.querySelector('[data-empathy-settings]');
  const questionState = widget?.querySelector('[data-empathy-question-state]');
  const feedback = widget?.querySelector('[data-empathy-feedback]');
  const feedbackText = widget?.querySelector('[data-empathy-feedback-text]');
  const undo = widget?.querySelector('[data-empathy-undo]');
  const showSettingsControl = widget?.querySelector('[data-empathy-show-settings]');
  const answerControls = Array.from(widget?.querySelectorAll('[data-empathy-answer]') || []);
  const weatherCare = widget?.querySelector('[data-weather-care]');

  if (!widget || !panel || !settings || !questionState || !feedback || !feedbackText || !undo || !showSettingsControl || !weatherCare || !answerControls.length) return;

  const storageKey = 'tarski-empathy-v1';
  const previewMode = new URLSearchParams(window.location.search).get('empathy') === 'preview';
  const adaptiveAnswers = new Set(['tired', 'tense']);
  const validAnswers = new Set(['calm', 'tired', 'tense', 'curious', 'skip']);
  const precipitation = new Set(['drizzle', 'rain', 'showers', 'thunderstorm']);
  let currentAnswer = null;
  let feedbackKey = null;

  const getLabel = (path, fallback) => window.tarskiI18n?.t(path) || fallback;
  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const readRecord = () => {
    if (previewMode) return null;

    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey));
      if (!value || value.date !== getToday() || !validAnswers.has(value.answer)) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      return value;
    } catch (error) {
      return null;
    }
  };

  const writeRecord = (record) => {
    if (previewMode) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(record));
    } catch (error) {
      // The check-in still works for the current page when storage is unavailable.
    }
  };

  const setPanelState = (state) => {
    const isQuestion = state === 'question';
    const isFeedback = state === 'feedback';
    const isPanelVisible = isQuestion || isFeedback;

    widget.classList.toggle('is-empathy-question', isQuestion);
    widget.classList.toggle('is-empathy-feedback', isFeedback);
    panel.hidden = !isPanelVisible;
    panel.setAttribute('aria-hidden', String(!isPanelVisible));
    settings.setAttribute('aria-hidden', String(isPanelVisible));
    panel.inert = !isPanelVisible;
    settings.inert = isPanelVisible;
    questionState.hidden = !isQuestion;
    feedback.hidden = !isFeedback;
  };

  const syncFeedback = () => {
    if (!feedbackKey) return;
    feedbackText.textContent = getLabel(
      `ui.empathy.feedback.${feedbackKey}`,
      feedbackKey === 'restored' ? 'Вернули системный ритм.' : 'Спасибо.'
    );
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
    weatherCare.textContent = label;
    weatherCare.hidden = !label;
  };

  const showFeedback = (answer, motionAdapted) => {
    currentAnswer = answer;
    feedbackKey = answer;
    undo.hidden = !motionAdapted;
    syncFeedback();
    setPanelState('feedback');
    window.requestAnimationFrame(() => showSettingsControl.focus({ preventScroll: true }));
  };

  const answer = (value) => {
    const nextAnswer = validAnswers.has(value) ? value : 'skip';
    const motionAdapted = adaptiveAnswers.has(nextAnswer);

    window.tarskiMotion?.setOverride(motionAdapted ? 'calm' : null);
    writeRecord({
      date: getToday(),
      answer: nextAnswer,
      motionAdapted
    });
    showFeedback(nextAnswer, motionAdapted);
  };

  answerControls.forEach((control) => {
    control.addEventListener('click', () => answer(control.dataset.empathyAnswer));
  });

  undo.addEventListener('click', () => {
    window.tarskiMotion?.setOverride(null);
    feedbackKey = 'restored';
    undo.hidden = true;
    writeRecord({
      date: getToday(),
      answer: currentAnswer || 'skip',
      motionAdapted: false
    });
    syncFeedback();
  });

  showSettingsControl.addEventListener('click', () => {
    setPanelState('settings');
    window.requestAnimationFrame(() => {
      settings.querySelector('[data-theme-mode][aria-pressed="true"]')?.focus({ preventScroll: true });
    });
  });
  window.addEventListener('tarski:weatherchange', syncWeatherCare);
  window.addEventListener('tarski:languagechange', () => {
    syncFeedback();
    syncWeatherCare();
  });

  const record = readRecord();
  if (record) {
    currentAnswer = record.answer;
    window.tarskiMotion?.setOverride(record.motionAdapted ? 'calm' : null);
    setPanelState('settings');
  } else {
    setPanelState('question');
  }
  syncWeatherCare();
})();
