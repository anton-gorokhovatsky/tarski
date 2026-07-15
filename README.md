# Tarski

Static GitHub Pages site for Tarski.

## Project structure

- `index.html` — page content and metadata.
- `styles.css` — layout, typography and responsive styles.
- `i18n.js` — Russian, English and Japanese text versions.
- `script.js` — scroll-spy navigation, theme controls, mobile menu and artist detail behavior.
- `assets/` — logos, favicon and artist images.
- `CNAME` — custom domain for GitHub Pages.
- `robots.txt` and `sitemap.xml` — indexing helpers.
- `yandex_887484d1e6af8b3b.html` — Yandex Webmaster verification file.
- `.nojekyll` — keeps GitHub Pages from running Jekyll over the site.
- `tools/check-media-assets.mjs` — lightweight media-size guard for new images.
- `tests/site.spec.mjs` — Playwright regression checks for locales, reflow, menu focus and gallery loading.
- `tests/accessibility.spec.mjs` — semantic, keyboard, reflow, reduced-motion and localized-copy checks.
- `tests/empathy.spec.mjs` — daily empathy question, persistence, adaptation and geometry checks.
- `tests/performance.spec.mjs` — critical byte budget, deferred media and lazy trail allocation checks.
- `tests/visual.spec.mjs` — visual state matrix for mobile and desktop across themes and locales.
- `docs/` — UI-system, release, empathy and performance rules.

The site supports Russian, English and Japanese versions, automatic light/dark theme selection via `prefers-color-scheme`, and a manual theme switcher.

## Local preview

Open `index.html` in a browser. No build step is required.

For a local server and the automated checks:

```text
pnpm install
pnpm exec playwright install chromium
pnpm test
```

The test suite starts its own local server and checks all three languages at 320 px, the localized privacy page, mobile menu and service-panel focus return, artist-card semantics, and responsive lazy gallery loading.

See `docs/release-checklist.md` before publishing visual or copy changes. Automated checks are followed by matched visual comparisons and a manual accessibility pass.

## Media hygiene

Keep new gallery images editorially useful but web-sized. For artist images, use an 1800px long edge as the default export size, prefer WebP or optimized JPEG, and keep the target weight under 650 KiB. The hard guard is 900 KiB for artist images; larger files should be resized or recompressed before publishing.

Before pushing new media, run:

```text
node tools/check-media-assets.mjs
```

Warnings are acceptable when an image visibly needs the extra detail; failures should be fixed before publishing.

Responsive AVIF variants for the two dossier galleries are generated from their source JPEGs with Pillow (including AVIF support):

```text
python3 tools/generate-gallery-variants.py
```

## Accessibility notes

Artist dossiers and the mobile menu are modal dialogs. When changing them, preserve `role="dialog"`, `aria-modal`, Escape close, Tab focus trapping, focus return to the opener, and direct hash links such as `#artist-anastasia-dahl`.

## GitHub Pages

1. Push the site to the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save and wait for GitHub Pages to publish the site.

The production address is:

```text
https://tarski.ru/
```

GitHub Pages still hosts the site behind the custom domain.

### Security headers

Both HTML documents set a strict-origin referrer policy in markup. GitHub Pages does not provide repository-level control over response headers, so response-only protections such as `Content-Security-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, and a project-controlled HSTS policy cannot be configured in this repository.

If those headers become a requirement, put a configurable CDN or reverse proxy in front of GitHub Pages and verify the final responses after deployment. A restrictive CSP must explicitly account for the inline theme bootstrap and Yandex Metrica before enforcement; do not add an untested policy directly to production.

## Custom domain

The repository root contains:

```text
tarski.ru
```

in the `CNAME` file. In **Settings → Pages → Custom domain**, the same domain should be set, with HTTPS enforced.

At the domain registrar, the apex domain should point to GitHub Pages:

```text
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
```

For `www.tarski.ru`, create a `CNAME` DNS record pointing to:

```text
anton-gorokhovatsky.github.io
```

## Analytics and indexing

Yandex Metrika is installed in `index.html`.

Analytics and privacy note is available at:

```text
https://tarski.ru/privacy.html
https://tarski.ru/privacy.html?lang=en
https://tarski.ru/privacy.html?lang=ja
```

Yandex Webmaster verification is available at:

```text
https://tarski.ru/yandex_887484d1e6af8b3b.html
```

The sitemap is available at:

```text
https://tarski.ru/sitemap.xml
```
