import { ShaderMount } from './assets/vendor/paper-shaders/0.0.77/dist/shader-mount.js';
import { waterFragmentShader } from './assets/vendor/paper-shaders/0.0.77/dist/shaders/water.js';

const PRESET_ID = 'tarski-menu-water-v1';
const STATIC_FRAME = 1640;
const IMPULSE_SPEED = 0.32;
const IMPULSE_DURATION = 720;
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const surfacePixelBudgets = {
  'desktop-nav': 260000,
  'mobile-compact': 220000,
  'mobile-service': 520000,
  'mobile-menu': 520000
};

const sharedUniforms = {
  u_fit: 2,
  u_scale: 1,
  u_rotation: 0,
  u_offsetX: 0,
  u_offsetY: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
  u_size: 0.72,
  u_highlights: 0,
  u_layering: 0.54,
  u_edges: 0.84,
  u_caustic: 0.14,
  u_waves: 0.2
};

const themeUniforms = {
  light: {
    u_colorBack: [1, 1, 1, 0.025],
    u_colorHighlight: [1, 1, 1, 0.78]
  },
  dark: {
    u_colorBack: [0.025, 0.025, 0.025, 0.07],
    u_colorHighlight: [1, 1, 1, 0.55],
    u_highlights: 0,
    u_layering: 0.42,
    u_edges: 0.58,
    u_caustic: 0.08,
    u_waves: 0.16
  }
};

const loadTransparentPixel = () => new Promise((resolve, reject) => {
  const image = new Image();
  image.addEventListener('load', () => resolve(image), { once: true });
  image.addEventListener('error', reject, { once: true });
  image.src = TRANSPARENT_PIXEL;
});

const getTheme = () => (
  document.documentElement.dataset.effectiveTheme === 'dark' ? 'dark' : 'light'
);

const isCalm = () => (
  window.tarskiMotion?.isCalm?.()
  || window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const surfaces = Array.from(document.querySelectorAll('[data-water-surface]'));
const mounts = [];
let impulseTimer = 0;

const setFallbackState = (reason) => {
  document.documentElement.dataset.waterMaterial = 'fallback';
  document.documentElement.dataset.waterFallback = reason;
};

const updateTheme = () => {
  const uniforms = themeUniforms[getTheme()];
  mounts.forEach(({ mount }) => mount.setUniforms(uniforms));
};

const stopImpulse = () => {
  window.clearTimeout(impulseTimer);
  impulseTimer = 0;
  mounts.forEach(({ mount }) => mount.setSpeed(0));
};

const impulse = () => {
  if (isCalm() || document.hidden) {
    stopImpulse();
    return;
  }

  window.clearTimeout(impulseTimer);
  mounts.forEach(({ mount, surface }) => {
    if (surface.getClientRects().length > 0 && getComputedStyle(surface).visibility !== 'hidden') {
      mount.setSpeed(IMPULSE_SPEED);
    }
  });
  impulseTimer = window.setTimeout(stopImpulse, IMPULSE_DURATION);
};

const mountSurface = (surface, image) => {
  const surfaceName = surface.dataset.waterSurface;
  surface.dataset.waterActive = 'false';

  try {
    const mount = new ShaderMount(
      surface,
      waterFragmentShader,
      {
        ...sharedUniforms,
        ...themeUniforms[getTheme()],
        u_image: image
      },
      {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        powerPreference: 'low-power'
      },
      0,
      STATIC_FRAME,
      1,
      surfacePixelBudgets[surfaceName] || 320000,
      ['u_image']
    );

    mount.canvasElement.setAttribute('aria-hidden', 'true');
    mount.canvasElement.addEventListener('webglcontextlost', () => {
      surface.dataset.waterActive = 'false';
      surface.dataset.waterFallback = 'context-lost';
    });
    mount.setFrame(STATIC_FRAME);
    surface.dataset.waterActive = 'true';
    mounts.push({ mount, surface });
  } catch (error) {
    surface.dataset.waterFallback = 'mount-failed';
    surface.dataset.waterActive = 'false';
    console.warn(`Tarski Water fallback (${surfaceName}):`, error);
  }
};

const initialise = async () => {
  if (!surfaces.length) return;
  surfaces.forEach((surface) => {
    surface.dataset.waterPreset = PRESET_ID;
  });
  if (!('WebGL2RenderingContext' in window)) {
    setFallbackState('webgl2-unavailable');
    return;
  }

  document.documentElement.dataset.waterMaterial = 'loading';

  try {
    const image = await loadTransparentPixel();
    surfaces.forEach((surface) => mountSurface(surface, image));
  } catch (error) {
    console.warn('Tarski Water fallback: source texture could not be loaded.', error);
  }

  if (!mounts.length) {
    setFallbackState('mount-failed');
    return;
  }

  document.documentElement.dataset.waterMaterial = 'active';

  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (mobileMenu) {
    new MutationObserver(impulse).observe(mobileMenu, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  new MutationObserver((records) => {
    if (records.some(({ attributeName }) => attributeName === 'data-effective-theme')) {
      updateTheme();
    }
    impulse();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-effective-theme', 'data-scene']
  });

  window.addEventListener('tarski:themechange', updateTheme);
  window.addEventListener('tarski:motionchange', () => {
    if (isCalm()) stopImpulse();
  });
  window.addEventListener('pagehide', () => {
    stopImpulse();
    mounts.forEach(({ mount }) => mount.dispose());
  }, { once: true });

  window.tarskiWaterMaterial = {
    getPreset: () => PRESET_ID,
    getSurfaceCount: () => mounts.length,
    impulse,
    isFallback: () => document.documentElement.dataset.waterMaterial === 'fallback'
  };
};

initialise();
