(() => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const smoothingFactor = 0.68;
  const curveSmoothing = 0.18;
  const getPointBudget = () => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const dpr = window.devicePixelRatio || 1;

    if (prefersCalmMotion()) return 0;
    if (cores <= 4 || memory <= 4) return 420;
    if (dpr > 1.5) return 720;
    return 960;
  };

  let canvas = null;
  let context = null;
  let frameId = null;
  let points = [];
  let deviceScale = 1;
  let trailRgb = '0, 0, 0';
  let trailBaseWidth = 1.15;
  let trailExtraWidth = 0.65;
  let trailOpacity = 0.95;
  let trailDuration = 10000;
  let minPointDistance = 2;
  let hasPointerPosition = false;
  const routeTimers = new Map();
  const routeCooldowns = new Map();

  const shouldRun = () => finePointerQuery.matches && !prefersCalmMotion();

  const readTrailSettings = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const rawColor = rootStyles.getPropertyValue('--cursor-trail-rgb').trim();
    const baseWidth = parseFloat(rootStyles.getPropertyValue('--cursor-trail-base-width'));
    const extraWidth = parseFloat(rootStyles.getPropertyValue('--cursor-trail-extra-width'));
    const opacity = parseFloat(rootStyles.getPropertyValue('--cursor-trail-opacity'));
    const duration = parseFloat(rootStyles.getPropertyValue('--cursor-trail-duration'));
    const pointDistance = parseFloat(rootStyles.getPropertyValue('--cursor-trail-min-distance'));

    trailRgb = rawColor ? rawColor.split(/\s+/).join(', ') : '0, 0, 0';
    trailBaseWidth = Number.isFinite(baseWidth) ? baseWidth : 1.15;
    trailExtraWidth = Number.isFinite(extraWidth) ? extraWidth : 0.65;
    trailOpacity = Number.isFinite(opacity) ? opacity : 0.95;
    const requestedDuration = Number.isFinite(duration) ? duration : 10000;
    trailDuration = Math.min(requestedDuration, getPointBudget() <= 420 ? 5200 : 7600);
    minPointDistance = Number.isFinite(pointDistance) ? pointDistance : 2;
  };

  const resizeCanvas = () => {
    if (!canvas || !context) return;

    deviceScale = Math.min(window.devicePixelRatio || 1, getPointBudget() <= 420 ? 1.25 : 1.6);
    canvas.width = Math.ceil(window.innerWidth * deviceScale);
    canvas.height = Math.ceil(window.innerHeight * deviceScale);
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
    points = [];
    hasPointerPosition = false;
  };

  const scheduleRender = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(renderTrail);
    }
  };

  const renderTrail = (now) => {
    frameId = null;
    if (!context) return;

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const cutoff = now - trailDuration;
    const firstLivePoint = points.findIndex((point) => point.time >= cutoff);
    if (firstLivePoint === -1) points = [];
    else if (firstLivePoint > 0) points.splice(0, firstLivePoint);

    context.lineCap = 'butt';
    context.lineJoin = 'round';

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    for (let index = 1; index < points.length; index += 1) {
      const previousPoint = points[index - 1];
      const point = points[index];
      if (point.startsStroke) continue;

      const anchorPoint = previousPoint.startsStroke || index < 2
        ? previousPoint
        : points[index - 2];
      const nextPoint = points[index + 1];
      const forwardPoint = nextPoint && !nextPoint.startsStroke ? nextPoint : point;
      const controlStartX = previousPoint.x + (point.x - anchorPoint.x) * curveSmoothing - scrollX;
      const controlStartY = previousPoint.y + (point.y - anchorPoint.y) * curveSmoothing - scrollY;
      const controlEndX = point.x - (forwardPoint.x - previousPoint.x) * curveSmoothing - scrollX;
      const controlEndY = point.y - (forwardPoint.y - previousPoint.y) * curveSmoothing - scrollY;
      const startX = previousPoint.x - scrollX;
      const startY = previousPoint.y - scrollY;
      const endX = point.x - scrollX;
      const endY = point.y - scrollY;
      const segmentAge = now - point.time;
      const life = Math.max(0, 1 - segmentAge / trailDuration);
      if (life <= 0) continue;
      const threadKind = point.threadKind || previousPoint.threadKind || '';
      const isThreadLink = Boolean(point.isThreadLink || previousPoint.isThreadLink);
      const isRouteLink = isThreadLink && threadKind && threadKind !== 'dossier';
      const routeStrength = point.routeStrength || previousPoint.routeStrength || 1;
      const segmentBaseWidth = isRouteLink
        ? Math.max(trailBaseWidth * 0.44 * routeStrength, 0.32)
        : (isThreadLink ? Math.max(trailBaseWidth, 0.94) : trailBaseWidth);
      const segmentExtraWidth = isRouteLink
        ? Math.max(trailExtraWidth * 0.14 * routeStrength, 0.05)
        : (isThreadLink ? Math.max(trailExtraWidth, 0.36) : trailExtraWidth);
      const segmentOpacity = isRouteLink
        ? Math.max(trailOpacity * 0.16 * routeStrength, 0.06)
        : (isThreadLink ? Math.max(trailOpacity, 0.54) : trailOpacity);

      context.lineCap = isThreadLink ? 'round' : 'butt';
      context.beginPath();
      context.moveTo(startX, startY);
      context.bezierCurveTo(
        controlStartX,
        controlStartY,
        controlEndX,
        controlEndY,
        endX,
        endY
      );
      context.lineWidth = segmentBaseWidth + life * segmentExtraWidth;
      context.strokeStyle = `rgba(${trailRgb}, ${life * segmentOpacity})`;
      context.stroke();
    }

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      if (!point.threadNode) continue;

      const segmentAge = now - point.time;
      const life = Math.max(0, 1 - segmentAge / trailDuration);
      if (life <= 0) continue;

      const isRouteNode = point.threadKind && point.threadKind !== 'dossier';
      const nodeStrength = point.routeStrength || 1;
      const radius = isRouteNode
        ? 1.4 + life * 1.1 * nodeStrength
        : 2.1 + life * 1.6;
      const opacity = isRouteNode
        ? life * 0.16 * nodeStrength
        : life * 0.34;

      context.beginPath();
      context.arc(point.x - scrollX, point.y - scrollY, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${trailRgb}, ${opacity})`;
      context.fill();
    }

    if (points.length) {
      scheduleRender();
    }
  };

  const addTrailPoint = (event) => {
    const now = window.performance.now();
    const lastPoint = points[points.length - 1];
    const pageX = event.clientX + window.scrollX;
    const pageY = event.clientY + window.scrollY;
    const x = hasPointerPosition && lastPoint
      ? lastPoint.x + (pageX - lastPoint.x) * smoothingFactor
      : pageX;
    const y = hasPointerPosition && lastPoint
      ? lastPoint.y + (pageY - lastPoint.y) * smoothingFactor
      : pageY;
    const distance = lastPoint
      ? Math.hypot(x - lastPoint.x, y - lastPoint.y)
      : Infinity;

    if (distance < minPointDistance && hasPointerPosition) return;

    points.push({
      x,
      y,
      time: now,
      startsStroke: !hasPointerPosition
    });

    hasPointerPosition = true;

    const pointBudget = getPointBudget();
    if (points.length > pointBudget) {
      points.splice(0, points.length - pointBudget);
    }

    scheduleRender();
  };

  const addThreadLink = ({ source, target, kind = 'dossier', strength = 1 } = {}) => {
    if (
      !source ||
      !target ||
      !Number.isFinite(source.x) ||
      !Number.isFinite(source.y) ||
      !Number.isFinite(target.x) ||
      !Number.isFinite(target.y) ||
      !shouldRun()
    ) {
      return;
    }

    if (!canvas) enableTrail();
    if (!context) return;

    readTrailSettings();
    startNewStroke();

    const now = window.performance.now();
    const isRouteLink = kind !== 'dossier';
    const routeStrength = Number.isFinite(strength) ? strength : 1;
    const steps = isRouteLink ? 18 : 24;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy);
    const curveLift = isRouteLink
      ? Math.min(96, Math.max(26, distance * 0.08))
      : Math.min(140, Math.max(42, distance * 0.12));
    const controlA = {
      x: source.x + dx * 0.28,
      y: source.y + dy * 0.16 - curveLift
    };
    const controlB = {
      x: source.x + dx * 0.72,
      y: target.y - dy * 0.16 + curveLift * 0.32
    };

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const inverse = 1 - t;
      points.push({
        x: inverse ** 3 * source.x
          + 3 * inverse ** 2 * t * controlA.x
          + 3 * inverse * t ** 2 * controlB.x
          + t ** 3 * target.x,
        y: inverse ** 3 * source.y
          + 3 * inverse ** 2 * t * controlA.y
          + 3 * inverse * t ** 2 * controlB.y
          + t ** 3 * target.y,
        time: now - (isRouteLink ? 1500 : 0) - (steps - step) * (isRouteLink ? 24 : 18),
        startsStroke: step === 0,
        isThreadLink: true,
        threadKind: kind,
        threadNode: step === 0 ? 'source' : (step === steps ? 'target' : ''),
        routeStrength
      });
    }

    const pointBudget = getPointBudget();
    if (points.length > pointBudget) {
      points.splice(0, points.length - pointBudget);
    }

    hasPointerPosition = false;
    scheduleRender();
  };

  const getRouteElement = (source) => (typeof source === 'function' ? source() : source);

  const getElementPoint = (element, options = {}) => {
    if (!(element instanceof HTMLElement)) return null;

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const anchorX = Number.isFinite(options.anchorX) ? options.anchorX : 0.5;
    const anchorY = Number.isFinite(options.anchorY) ? options.anchorY : 0.5;
    const offsetX = Number.isFinite(options.offsetX) ? options.offsetX : 0;
    const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : 0;

    return {
      x: rect.left + rect.width * anchorX + offsetX + window.scrollX,
      y: rect.top + rect.height * anchorY + offsetY + window.scrollY
    };
  };

  const addRouteBetween = (key, sourceElement, targetElement, options = {}) => {
    const now = window.performance.now();
    const cooldown = Number.isFinite(options.cooldown) ? options.cooldown : 1200;
    const previousRouteAt = routeCooldowns.get(key) || 0;

    if (previousRouteAt && now - previousRouteAt < cooldown) return;

    window.clearTimeout(routeTimers.get(key));
    routeCooldowns.set(key, now);

    routeTimers.set(key, window.setTimeout(() => {
      const resolvedSource = getRouteElement(sourceElement);
      const resolvedTarget = getRouteElement(targetElement);
      const source = getElementPoint(resolvedSource, options.source || {});
      const target = getElementPoint(resolvedTarget, options.target || {});

      if (!source || !target) return;
      if (
        Number.isFinite(options.maxDistance) &&
        Math.hypot(target.x - source.x, target.y - source.y) > options.maxDistance
      ) {
        return;
      }

      addThreadLink({
        source,
        target,
        kind: options.kind || 'route',
        strength: options.strength
      });
    }, Number.isFinite(options.delay) ? options.delay : 180));
  };

  const getActiveNavRouteSource = (scene) => {
    const nav = document.querySelector('.main-nav');
    if (!nav) return null;

    return nav.querySelector(`a[href="#${scene}"]`) ||
      nav.querySelector('a.is-active[href^="#"]') ||
      nav.querySelector('.nav-label');
  };

  const getSceneRouteTarget = (scene) => {
    if (scene === 'about') {
      return document.querySelector('#about .section-intro');
    }

    if (scene === 'artists') {
      return document.querySelector('#artists .artists-view-switch') ||
        document.querySelector('#artists .artist-index');
    }

    return null;
  };

  const addNavRoute = (scene, sourceElement) => {
    if (scene !== 'about' && scene !== 'artists') return;

    addRouteBetween(
      `nav-${scene}`,
      () => sourceElement || getActiveNavRouteSource(scene),
      () => getSceneRouteTarget(scene),
      {
        kind: 'nav',
        delay: 420,
        source: { anchorX: 0.08, anchorY: 0.52 },
        target: { anchorX: 0.08, anchorY: 0.5 },
        cooldown: 1400,
        strength: 1.06
      }
    );
  };

  const addArtistsViewRoute = (view) => {
    if (document.documentElement.dataset.scene !== 'artists') return;

    const targetSelector = view === 'list'
      ? '#artists .artist-card.is-text-focus-active, #artists .artist-card'
      : '#artists .artist-index';

    addRouteBetween(
      `artists-view-${view || 'cloud'}`,
      () => document.querySelector(`#artists [data-artists-view-option="${view || 'cloud'}"]`),
      () => document.querySelector(targetSelector),
      {
        kind: 'view',
        delay: 140,
        source: { anchorX: 0.5, anchorY: 0.55 },
        target: { anchorX: view === 'list' ? 0.08 : 0.38, anchorY: view === 'list' ? 0.24 : 0.16 },
        cooldown: 900,
        strength: 0.82
      }
    );
  };

  const addFooterRoute = () => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    addRouteBetween(
      'footer',
      () => footer.querySelector('.site-footer__cta') || footer,
      () => footer.querySelector('.site-footer__routes') || footer,
      {
        kind: 'footer',
        delay: 90,
        source: { anchorX: 0.08, anchorY: 0.55 },
        target: { anchorX: 0.12, anchorY: 0.5 },
        cooldown: 2600,
        maxDistance: 640,
        strength: 0.72
      }
    );
  };

  const bindRouteIntents = () => {
    document.querySelectorAll('.main-nav a[href="#about"], .main-nav a[href="#artists"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        addNavRoute(link.hash.slice(1), link);
      });
    });

    const practiceSummary = document.querySelector('[data-i18n-block="practice"] summary');
    practiceSummary?.addEventListener('click', () => {
      addRouteBetween(
        'practice-artists',
        practiceSummary,
        () => document.querySelector('#artists .artist-index'),
        {
          kind: 'practice',
          delay: 160,
          source: { anchorX: 0.92, anchorY: 0.5 },
          target: { anchorX: 0.2, anchorY: 0.12 },
          cooldown: 1800,
          strength: 0.88
        }
      );
    });

    document.querySelectorAll('[data-footer-cta], [data-footer-route]').forEach((link) => {
      link.addEventListener('pointerenter', addFooterRoute, { passive: true });
      link.addEventListener('focus', addFooterRoute);
      link.addEventListener('click', addFooterRoute);
    });
  };

  const rememberPoint = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;

    const coalescedEvents = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents()
      : [event];
    const moveEvents = coalescedEvents.length ? coalescedEvents : [event];

    moveEvents.forEach(addTrailPoint);
  };

  const startNewStroke = (event) => {
    if (event?.type === 'pointerout' && event.relatedTarget) return;

    hasPointerPosition = false;
  };

  const handleScroll = () => {
    if (!points.length) return;

    startNewStroke();
    scheduleRender();
  };

  const clearTrail = () => {
    points = [];
    startNewStroke();
    context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  const clearTrailForKeyboard = (event) => {
    if (event.key === 'Tab') {
      clearTrail();
    }
  };

  const enableTrail = () => {
    if (canvas || !shouldRun()) return;

    canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    context = canvas.getContext('2d');

    if (!context) {
      canvas = null;
      return;
    }

    document.body.append(canvas);
    readTrailSettings();
    resizeCanvas();

    window.addEventListener('pointermove', rememberPoint, { passive: true });
    window.addEventListener('pointerout', startNewStroke, { passive: true });
    window.addEventListener('blur', startNewStroke);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', clearTrailForKeyboard);
    document.addEventListener('visibilitychange', clearTrail);
  };

  const disableTrail = () => {
    if (!canvas) return;

    window.removeEventListener('pointermove', rememberPoint);
    window.removeEventListener('pointerout', startNewStroke);
    window.removeEventListener('blur', startNewStroke);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', clearTrailForKeyboard);
    document.removeEventListener('visibilitychange', clearTrail);

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    canvas.remove();
    canvas = null;
    context = null;
    points = [];
    startNewStroke();
  };

  const syncTrail = () => {
    if (shouldRun()) {
      enableTrail();
    } else {
      disableTrail();
    }
  };

  reducedMotionQuery.addEventListener('change', syncTrail);
  finePointerQuery.addEventListener('change', syncTrail);
  colorSchemeQuery.addEventListener('change', readTrailSettings);
  window.addEventListener('tarski:motionchange', syncTrail);
  window.addEventListener('tarski:themechange', readTrailSettings);
  window.addEventListener('tarski:scenechange', () => {
    readTrailSettings();
  });
  window.addEventListener('tarski:artistsviewchange', (event) => {
    readTrailSettings();
    addArtistsViewRoute(event.detail?.view);
  });
  window.addEventListener('tarski:threadlink', (event) => addThreadLink(event.detail));
  bindRouteIntents();

  const footer = document.querySelector('.site-footer');
  if (footer && 'IntersectionObserver' in window) {
    const footerObserver = new IntersectionObserver((entries) => {
      const isNearFooter = entries.some((entry) => entry.isIntersecting);
      if (isNearFooter) {
        document.documentElement.dataset.footerProximity = 'true';
      } else {
        delete document.documentElement.dataset.footerProximity;
      }
      readTrailSettings();
    }, {
      rootMargin: '0px 0px -18% 0px',
      threshold: 0.08
    });

    footerObserver.observe(footer);
  }

  syncTrail();
})();
