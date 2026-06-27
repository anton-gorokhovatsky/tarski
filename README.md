# Tarski

Static GitHub Pages site for Tarski.

## Project structure

- `index.html` — page content and metadata.
- `styles.css` — layout, typography and responsive styles.
- `script.js` — scroll-spy navigation and mobile menu behavior.
- `assets/` — logos, favicon and artist images.
- `.nojekyll` — keeps GitHub Pages from running Jekyll over the site.

## Local preview

Open `index.html` in a browser. No build step is required.

## GitHub Pages

1. Push the site to the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save and wait for GitHub Pages to publish the site.

The default GitHub Pages address will be:

```text
https://anton-gorokhovatsky.github.io/tarski/
```

The production domain is:

```text
https://tarski.ru/
```

## Custom domain

The repository contains a `CNAME` file with:

```text
tarski.ru
```

In **Settings → Pages → Custom domain**, enter the same domain.

At the domain registrar, configure these DNS records for the apex domain:

```text
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
AAAA  @    2606:50c0:8000::153
AAAA  @    2606:50c0:8001::153
AAAA  @    2606:50c0:8002::153
AAAA  @    2606:50c0:8003::153
```

For `www.tarski.ru`, create a `CNAME` DNS record pointing to:

```text
anton-gorokhovatsky.github.io
```
