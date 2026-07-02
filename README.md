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

The site supports Russian, English and Japanese versions, automatic light/dark theme selection via `prefers-color-scheme`, and a manual theme switcher.

## Local preview

Open `index.html` in a browser. No build step is required.

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
```

Yandex Webmaster verification is available at:

```text
https://tarski.ru/yandex_887484d1e6af8b3b.html
```

The sitemap is available at:

```text
https://tarski.ru/sitemap.xml
```
