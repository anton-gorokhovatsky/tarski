import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artistLocales, artistPageUi, artists } from '../content/artists.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const generatedStart = '          <!-- GENERATED: artists:start -->';
const generatedEnd = '          <!-- GENERATED: artists:end -->';
const contentLastModified = '2026-07-29';
const homeLastModified = '2026-07-29';
const privacyLastModified = '2026-07-11';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeAttr = escapeHtml;
const typographicEntities = {
  amp: '&',
  laquo: '«',
  mdash: '—',
  nbsp: '\u00a0',
  ndash: '–',
  raquo: '»',
  shy: '\u00ad'
};
const typographicText = (data, field) => {
  const markup = data?.[`${field}Html`];
  if (!markup) return data?.[field] ?? '';
  if (/[<>]/.test(markup)) {
    throw new Error(`${field}Html must contain text and supported character entities only`);
  }

  return String(markup).replace(
    /&(amp|laquo|mdash|nbsp|ndash|raquo|shy);/g,
    (_, entity) => typographicEntities[entity]
  );
};
const indent = (value, spaces) => value
  .split('\n')
  .map((line) => line ? `${' '.repeat(spaces)}${line}` : '')
  .join('\n');

const localizedValue = (value, locale, fallback = '') => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[locale] ?? value.ru ?? fallback;
  }
  return value ?? fallback;
};

const toRootAsset = (path) => `/${String(path).replace(/^\/+/, '')}`;

const responsiveAvifSrcset = (image) => {
  const base = image.src.replace(/\.[^.]+$/, '');
  return [800, 1400]
    .map((width) => `${toRootAsset(`${base}-${width}.avif`)} ${Math.min(width, image.width)}w`)
    .join(', ');
};

const hashFile = async (relativePath) => {
  const bytes = await readFile(join(root, relativePath));
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
};

const assetHref = async (relativePath) => `${toRootAsset(relativePath)}?v=${await hashFile(relativePath)}`;

const validateRegistry = () => {
  const keys = new Set();
  const slugs = new Set();
  const ids = new Set();
  const errors = [];

  artists.forEach((artist) => {
    if (keys.has(artist.key)) errors.push(`Duplicate artist key: ${artist.key}`);
    if (slugs.has(artist.slug)) errors.push(`Duplicate artist slug: ${artist.slug}`);
    if (ids.has(artist.domId)) errors.push(`Duplicate artist DOM id: ${artist.domId}`);
    keys.add(artist.key);
    slugs.add(artist.slug);
    ids.add(artist.domId);

    artistLocales.forEach((locale) => {
      const data = artist.locales?.[locale];
      ['name', 'role', 'bio'].forEach((field) => {
        if (!data?.[field]) errors.push(`${artist.key}.${locale}.${field} is required`);
      });
    });

    (artist.gallery?.images || []).forEach((image, index) => {
      artistLocales.forEach((locale) => {
        if (!localizedValue(image.alt, locale)) {
          errors.push(`${artist.key}.gallery.images[${index}].alt.${locale} is required`);
        }
      });
    });

    const assetPaths = [
      artist.image?.card,
      artist.image?.dossier,
      artist.preview?.src,
      ...(artist.gallery?.images || []).map((image) => image.src)
    ].filter(Boolean);

    assetPaths.forEach((assetPath) => {
      if (!existsSync(join(root, assetPath))) {
        errors.push(`${artist.key}: missing asset ${assetPath}`);
      }
    });
  });

  if (errors.length) {
    throw new Error(`Artist registry is invalid:\n- ${errors.join('\n- ')}`);
  }
};

const renderGalleryTemplate = (artist) => {
  if (!artist.gallery?.images?.length) return '';

  const gallery = artist.gallery;
  const attributes = [
    'class="artist-card__gallery"',
    'data-artist-gallery',
    gallery.layout ? `data-layout="${escapeAttr(gallery.layout)}"` : '',
    gallery.responsiveMedia ? `data-responsive-media="${escapeAttr(gallery.responsiveMedia)}"` : '',
    ...artistLocales.map((locale) => {
      const credit = localizedValue(gallery.credit, locale);
      const suffix = locale === 'ru' ? '' : `-${locale}`;
      return credit ? `data-credit${suffix}="${escapeAttr(credit)}"` : '';
    })
  ].filter(Boolean).join(' ');

  const images = gallery.images.map((image) => {
    const classes = image.wide ? ' class="artist-card__gallery-image--wide"' : '';
    const alt = localizedValue(image.alt, 'ru');
    const dataAttributes = [
      image.variant ? `data-variant="${escapeAttr(image.variant)}"` : '',
      ...artistLocales.flatMap((locale) => {
        const suffix = locale === 'ru' ? '' : `-${locale}`;
        const caption = localizedValue(image.caption, locale);
        const label = localizedValue(image.label, locale);
        const localizedAlt = localizedValue(image.alt, locale);
        return [
          caption ? `data-caption${suffix}="${escapeAttr(caption)}"` : '',
          label ? `data-label${suffix}="${escapeAttr(label)}"` : '',
          localizedAlt ? `data-alt${suffix}="${escapeAttr(localizedAlt)}"` : ''
        ];
      })
    ].filter(Boolean).join(' ');

    return `<img${classes} src="${escapeAttr(image.src)}" alt="${escapeAttr(alt)}" width="${image.width}" height="${image.height}"${dataAttributes ? ` ${dataAttributes}` : ''} />`;
  }).join('\n');

  return `<template ${attributes}>\n${indent(images, 2)}\n</template>`;
};

const renderArtistLinks = (artist, locale) => {
  const data = artist.locales[locale];
  const links = [];

  if (artist.links?.site) {
    links.push(`<a class="artist-card__link artist-card__link--site" href="${escapeAttr(artist.links.site)}" aria-label="${escapeAttr(`${artistPageUi[locale].siteLabel}: ${data.name}`)}"></a>`);
  }
  if (artist.links?.instagram) {
    links.push(`<a class="artist-card__link artist-card__link--instagram" href="${escapeAttr(artist.links.instagram)}" aria-label="${escapeAttr(`${artistPageUi[locale].instagramLabel}: ${data.name}`)}"></a>`);
  }
  if (!links.length) return '';

  return `<div class="artist-card__links" role="group" aria-label="${escapeAttr(`${artistPageUi[locale].linksLabel}: ${data.name}`)}">\n${indent(links.join('\n'), 2)}\n</div>`;
};

const renderHomeArtist = (artist) => {
  const data = artist.locales.ru;
  const gallery = renderGalleryTemplate(artist);
  const links = renderArtistLinks(artist, 'ru');
  const nameMarkup = data.nameHtml || escapeHtml(data.name);
  const roleMarkup = data.roleHtml || escapeHtml(data.role);
  const bioMarkup = data.bioHtml || escapeHtml(data.bio);

  return `<article id="${escapeAttr(artist.domId)}" class="artist-card" data-artist-key="${escapeAttr(artist.key)}" data-artist-page="/artists/${escapeAttr(artist.slug)}/" data-dossier-image="${escapeAttr(artist.image.dossier)}">
  <img class="artist-card__image" src="${escapeAttr(artist.image.card)}" alt="${escapeAttr(data.name)}" width="${artist.image.width}" height="${artist.image.height}" loading="lazy" decoding="async" />
${gallery ? indent(gallery, 2) : ''}
  <div class="artist-card__body">
    <div class="artist-card__header">
      <h3 class="artist-card__name"><button class="artist-card__detail-trigger" type="button">${nameMarkup}</button></h3>
${links ? indent(links, 6) : ''}
    </div>
    <p class="artist-card__role">${roleMarkup}</p>
    <p>
      ${bioMarkup}
    </p>
  </div>
</article>`;
};

const renderLocaleRegistry = () => Object.fromEntries(artistLocales.map((locale) => [
  locale,
  {
    label: locale === 'ru'
      ? 'Сеть'
      : locale === 'en'
        ? 'Network'
        : 'ネットワーク',
    title: locale === 'ru'
      ? 'Сеть художников-единомышленников'
      : locale === 'en'
        ? 'A Network of Like-Minded Artists'
        : '志を共有するアーティストたちのネットワーク',
    items: Object.fromEntries(artists.map((artist) => {
      const data = artist.locales[locale];
      return [artist.key, {
        name: typographicText(data, 'name'),
        index: data.index || typographicText(data, 'name'),
        role: typographicText(data, 'role'),
        text: typographicText(data, 'bio')
      }];
    }))
  }
]));

const renderHomeRegion = () => {
  const indexLinks = artists.map((artist) => {
    const data = artist.locales.ru;
    const label = data.index || data.name;
    const ariaLabel = label === data.name ? '' : ` aria-label="${escapeAttr(data.name)}"`;
    const preview = artist.preview;
    return `<a class="artist-index__link" href="#${escapeAttr(artist.domId)}" data-artist-key="${escapeAttr(artist.key)}" data-preview-src="${escapeAttr(preview.src)}" data-preview-fit="${escapeAttr(preview.fit)}" data-preview-ratio="${escapeAttr(preview.ratio)}" data-preview-width="${escapeAttr(preview.width)}" data-preview-wash-light="${escapeAttr(preview.washLight)}" data-preview-wash-dark="${escapeAttr(preview.washDark)}"${ariaLabel}>${escapeHtml(label)}</a>`;
  }).join('\n');

  const cards = artists.map(renderHomeArtist).join('\n\n');
  const localeJson = JSON.stringify(renderLocaleRegistry(), null, 2).replaceAll('<', '\\u003c');

  return `${generatedStart}
          <nav id="artists-cloud" class="artist-index" aria-label="Навигация по художникам">
${indent(indexLinks, 12)}
          </nav>

          <div id="artists-list" class="artists-list">
${indent(cards, 12)}
          </div>

          <script id="artists-locales" type="application/json">
${indent(localeJson, 12)}
          </script>
${generatedEnd}`;
};

const replaceGeneratedRegion = (source, generated) => {
  const start = source.indexOf(generatedStart);
  const end = source.indexOf(generatedEnd);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html is missing the generated artist markers');
  }
  return `${source.slice(0, start)}${generated}${source.slice(end + generatedEnd.length)}`;
};

const themeBootstrap = `(() => {
  try {
    const theme = window.localStorage.getItem('tarski-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.effectiveTheme = theme === 'dark' || theme === 'light' ? theme : systemTheme;
  } catch (error) {
    document.documentElement.dataset.effectiveTheme = 'light';
  }
})();`;

const localeRoute = (base, locale) => locale === 'ru' ? base : `${base}${locale}/`;
const homeRoute = (locale) => locale === 'ru' ? '/#artists' : `/?lang=${locale}#artists`;

const renderHead = ({
  locale,
  title,
  description,
  canonicalPath,
  alternateBase,
  stylesheet,
  typographyScript
}) => {
  const canonical = `https://tarski.ru${canonicalPath}`;
  const alternates = artistLocales
    .map((language) => `    <link rel="alternate" hreflang="${language}" href="https://tarski.ru${localeRoute(alternateBase, language)}" />`)
    .join('\n');

  return `  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta name="theme-color" content="#f2f2f2" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#101010" media="(prefers-color-scheme: dark)" />
    <script>${themeBootstrap}</script>
    <link rel="canonical" href="${canonical}" />
${alternates}
    <link rel="alternate" hreflang="x-default" href="https://tarski.ru${alternateBase}" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Tarski" />
    <meta property="og:image" content="https://tarski.ru/assets/og-image.png" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" sizes="any" />
    <link rel="stylesheet" href="${stylesheet}" />
    <script src="${typographyScript}" defer></script>
  </head>`;
};

const renderLanguageNav = (base, locale) => {
  const links = artistLocales.map((language) => {
    const current = language === locale ? ' aria-current="page"' : '';
    return `<a href="${localeRoute(base, language)}"${current}>${language.toUpperCase()}</a>`;
  }).join('\n');

  return `<nav class="artist-page__languages" aria-label="${escapeAttr(artistPageUi[locale].languageLabel)}">
${indent(links, 2)}
</nav>`;
};

const renderCatalogPage = async (locale) => {
  const ui = artistPageUi[locale];
  const base = '/artists/';
  const route = localeRoute(base, locale);
  const stylesheet = await assetHref('artist-page.css');
  const typographyScript = await assetHref('typography.js');
  const cards = artists.map((artist) => {
    const data = artist.locales[locale];
    const nameMarkup = locale === 'ru' && data.nameHtml ? data.nameHtml : escapeHtml(data.name);
    const roleMarkup = locale === 'ru' && data.roleHtml ? data.roleHtml : escapeHtml(data.role);
    const profileBase = `/artists/${artist.slug}/`;
    const href = localeRoute(profileBase, locale);
    return `<li class="artist-directory__item">
  <a class="artist-directory__link" href="${href}">
    <img src="${toRootAsset(artist.image.card)}" alt="" width="${artist.image.width}" height="${artist.image.height}" loading="lazy" decoding="async" />
    <span class="artist-directory__copy">
      <span class="artist-directory__name">${nameMarkup}</span>
      <span class="artist-directory__role">${roleMarkup}</span>
      <span class="artist-directory__action">${escapeHtml(ui.openProfile)} <span aria-hidden="true">↗</span></span>
    </span>
  </a>
</li>`;
  }).join('\n');

  return `<!doctype html>
<html lang="${locale}">
${renderHead({
    locale,
    title: `${ui.catalogTitle} — Tarski`,
    description: ui.catalogDescription,
    canonicalPath: route,
    alternateBase: base,
    stylesheet,
    typographyScript
  })}
  <body class="artist-page artist-page--directory">
    <a class="artist-page__skip" href="#content">${escapeHtml(ui.skip)}</a>
    <header class="artist-page__header">
      <a class="artist-page__brand" href="${homeRoute(locale)}" aria-label="${escapeAttr(ui.homeBack)}">
        <img src="/assets/logo.svg" alt="Tarski" />
      </a>
${indent(renderLanguageNav(base, locale), 6)}
    </header>
    <main id="content" class="artist-page__main">
      <p class="artist-page__eyebrow">${escapeHtml(ui.catalogEyebrow)}</p>
      <h1>${escapeHtml(ui.catalogTitle)}</h1>
      <p class="artist-page__lead">${escapeHtml(ui.catalogLead)}</p>
      <ul class="artist-directory">
${indent(cards, 8)}
      </ul>
    </main>
    <footer class="artist-page__footer">
      <a href="${homeRoute(locale)}">${escapeHtml(ui.homeBack)} <span aria-hidden="true">↖</span></a>
      <span>© 2026 Tarski</span>
    </footer>
  </body>
</html>
`;
};

const renderProfileGallery = (artist, locale) => {
  if (!artist.gallery?.images?.length) return '';
  const ui = artistPageUi[locale];
  const items = artist.gallery.images.map((image) => {
    const caption = localizedValue(image.caption, locale);
    const label = localizedValue(image.label, locale);
    const alt = localizedValue(image.alt, locale, caption || label);
    const picture = artist.gallery.responsiveMedia === 'avif'
      ? `<picture>
  <source type="image/avif" srcset="${escapeAttr(responsiveAvifSrcset(image))}" sizes="(max-width: 720px) calc(100vw - 40px), 48vw" />
  <img src="${toRootAsset(image.src)}" alt="${escapeAttr(alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" />
</picture>`
      : `<img src="${toRootAsset(image.src)}" alt="${escapeAttr(alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" />`;
    const figcaption = [label, caption].filter(Boolean).join(' · ');

    return `<figure class="artist-profile__gallery-item${image.wide ? ' artist-profile__gallery-item--wide' : ''}">
${indent(picture, 2)}
${figcaption ? `  <figcaption>${escapeHtml(figcaption)}</figcaption>` : ''}
</figure>`;
  }).join('\n');
  const credit = localizedValue(artist.gallery.credit, locale);

  return `<section class="artist-profile__gallery" aria-labelledby="gallery-title">
  <h2 id="gallery-title">${escapeHtml(ui.galleryTitle)}</h2>
  <div class="artist-profile__gallery-grid">
${indent(items, 4)}
  </div>
${credit ? `  <p class="artist-profile__credit">${escapeHtml(credit)}</p>` : ''}
</section>`;
};

const renderProfileLinks = (artist, locale) => {
  const ui = artistPageUi[locale];
  const links = [];
  if (artist.links?.site) links.push(`<a href="${escapeAttr(artist.links.site)}">${escapeHtml(ui.siteLabel)} <span aria-hidden="true">↗</span></a>`);
  if (artist.links?.instagram) links.push(`<a href="${escapeAttr(artist.links.instagram)}">${escapeHtml(ui.instagramLabel)} <span aria-hidden="true">↗</span></a>`);
  if (!links.length) return '';

  return `<nav class="artist-profile__links" aria-label="${escapeAttr(ui.linksLabel)}">
${indent(links.join('\n'), 2)}
</nav>`;
};

const renderProfilePage = async (artist, locale) => {
  const ui = artistPageUi[locale];
  const data = artist.locales[locale];
  const nameMarkup = locale === 'ru' && data.nameHtml ? data.nameHtml : escapeHtml(data.name);
  const roleMarkup = locale === 'ru' && data.roleHtml ? data.roleHtml : escapeHtml(data.role);
  const bioMarkup = locale === 'ru' && data.bioHtml ? data.bioHtml : escapeHtml(data.bio);
  const base = `/artists/${artist.slug}/`;
  const route = localeRoute(base, locale);
  const catalogRoute = localeRoute('/artists/', locale);
  const stylesheet = await assetHref('artist-page.css');
  const typographyScript = await assetHref('typography.js');
  const gallery = renderProfileGallery(artist, locale);
  const links = renderProfileLinks(artist, locale);
  const description = data.bio.length > 155 ? `${data.bio.slice(0, 152).trimEnd()}…` : data.bio;
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': artist.key === 'irhs' || artist.key === 'noExcuse' ? 'Organization' : 'Person',
    name: data.name,
    description: data.bio,
    url: `https://tarski.ru${route}`,
    image: `https://tarski.ru/${artist.image.dossier}`,
    sameAs: Object.values(artist.links || {})
  }, null, 2).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="${locale}">
${renderHead({
    locale,
    title: `${data.name} — Tarski`,
    description,
    canonicalPath: route,
    alternateBase: base,
    stylesheet,
    typographyScript
  })}
  <body class="artist-page artist-page--profile">
    <a class="artist-page__skip" href="#content">${escapeHtml(ui.skip)}</a>
    <header class="artist-page__header">
      <a class="artist-page__brand" href="${homeRoute(locale)}" aria-label="${escapeAttr(ui.homeBack)}">
        <img src="/assets/logo.svg" alt="Tarski" />
      </a>
${indent(renderLanguageNav(base, locale), 6)}
    </header>
    <main id="content" class="artist-page__main artist-profile">
      <p class="artist-page__eyebrow">${escapeHtml(ui.profileEyebrow)}</p>
      <h1>${nameMarkup}</h1>
      <p class="artist-profile__role">${roleMarkup}</p>
      <div class="artist-profile__hero">
        <img src="${toRootAsset(artist.image.dossier)}" alt="" width="${artist.image.width}" height="${artist.image.height}" decoding="async" />
      </div>
      <div class="artist-profile__body">
        <p>${bioMarkup}</p>
${links ? indent(links, 8) : ''}
      </div>
${gallery ? indent(gallery, 6) : ''}
    </main>
    <footer class="artist-page__footer">
      <a href="${catalogRoute}">${escapeHtml(ui.profileBack)} <span aria-hidden="true">↖</span></a>
      <span>© 2026 Tarski</span>
    </footer>
    <script type="application/ld+json">
${indent(schema, 6)}
    </script>
  </body>
</html>
`;
};

const renderSitemapRoutes = (routes, lastmod) => artistLocales.map((locale) => {
  const route = routes[locale];
  const alternates = artistLocales
    .map((language) => `    <xhtml:link rel="alternate" hreflang="${language}" href="https://tarski.ru${routes[language]}" />`)
    .join('\n');
  return `  <url>
    <loc>https://tarski.ru${route}</loc>
    <lastmod>${lastmod}</lastmod>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="https://tarski.ru${routes.ru}" />
  </url>`;
}).join('\n');

const localizedRoutes = (base) => Object.fromEntries(
  artistLocales.map((locale) => [locale, localeRoute(base, locale)])
);

const renderSitemap = () => {
  const homepage = renderSitemapRoutes({
    ru: '/',
    en: '/?lang=en',
    ja: '/?lang=ja'
  }, homeLastModified);
  const privacy = renderSitemapRoutes({
    ru: '/privacy.html',
    en: '/privacy.html?lang=en',
    ja: '/privacy.html?lang=ja'
  }, privacyLastModified);
  const catalog = renderSitemapRoutes(localizedRoutes('/artists/'), contentLastModified);
  const profiles = artists
    .map((artist) => renderSitemapRoutes(localizedRoutes(`/artists/${artist.slug}/`), contentLastModified))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${homepage}
${privacy}
${catalog}
${profiles}
</urlset>
`;
};

const main = async () => {
  validateRegistry();

  const expectedFiles = new Map();
  const indexPath = join(root, 'index.html');
  const indexSource = await readFile(indexPath, 'utf8');
  expectedFiles.set('index.html', replaceGeneratedRegion(indexSource, renderHomeRegion()));
  expectedFiles.set('sitemap.xml', renderSitemap());

  for (const locale of artistLocales) {
    const catalogPath = locale === 'ru'
      ? 'artists/index.html'
      : `artists/${locale}/index.html`;
    expectedFiles.set(catalogPath, await renderCatalogPage(locale));

    for (const artist of artists) {
      const profilePath = locale === 'ru'
        ? `artists/${artist.slug}/index.html`
        : `artists/${artist.slug}/${locale}/index.html`;
      expectedFiles.set(profilePath, await renderProfilePage(artist, locale));
    }
  }

  const generatedPaths = Array.from(expectedFiles.keys())
    .filter((path) => path.startsWith('artists/'))
    .sort();
  const manifestPath = 'artists/.generated-files.json';
  expectedFiles.set(manifestPath, `${JSON.stringify(generatedPaths, null, 2)}\n`);

  const mismatches = [];
  for (const [path, expected] of expectedFiles) {
    const absolutePath = join(root, path);
    const actual = existsSync(absolutePath) ? await readFile(absolutePath, 'utf8') : null;
    if (actual !== expected) mismatches.push(path);
  }

  if (checkOnly) {
    if (mismatches.length) {
      console.error(`Generated artist files are stale:\n- ${mismatches.join('\n- ')}`);
      process.exitCode = 1;
    } else {
      console.log(`Artist registry is valid; ${artists.length} artists and ${generatedPaths.length} pages are current.`);
    }
    return;
  }

  const oldManifest = join(root, manifestPath);
  if (existsSync(oldManifest)) {
    const oldPaths = JSON.parse(await readFile(oldManifest, 'utf8'));
    for (const oldPath of oldPaths) {
      if (!generatedPaths.includes(oldPath) && existsSync(join(root, oldPath))) {
        await rm(join(root, oldPath));
      }
    }
  }

  for (const [path, content] of expectedFiles) {
    const absolutePath = join(root, path);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }

  console.log(`Generated ${artists.length} artists across ${artistLocales.length} locales (${generatedPaths.length} pages).`);
};

await main();
