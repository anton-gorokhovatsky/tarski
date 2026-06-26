# Tarski static site

Первый статичный вариант сайта по Figma-макету.

## Структура

```text
index.html
styles.css
assets/
  logo.svg
  footer-logo.svg
  artist-cover.png
  favicon.svg
```

## Что заменить перед публикацией

1. `assets/logo.svg` — экспортировать настоящий логотип из Figma в SVG.
2. `assets/footer-logo.svg` — экспортировать большой футерный логотип из Figma в SVG.
3. `assets/artist-cover.png` — заменить на реальные изображения художников в `.webp`, `.jpg` или `.png`.
4. Шрифт: сейчас используется fallback `CoFo Robert Sans, CoFo Sans, Arial, Helvetica, sans-serif`. Для публикации нужна лицензированная web-версия шрифта.

## Как заменить обложку художника

Положи файл, например:

```text
assets/artist-cover.webp
```

И в `index.html` замени:

```html
src="assets/artist-cover.png"
```

на:

```html
src="assets/artist-cover.webp"
```

## Как опубликовать через GitHub Pages

1. Создать новый репозиторий на GitHub.
2. Перетащить все файлы из этой папки в репозиторий или добавить через GitHub Desktop.
3. Сделать commit и push.
4. Открыть Settings → Pages.
5. В разделе Build and deployment выбрать Source: Deploy from a branch.
6. Branch: `main`, folder: `/root`.
7. После сохранения GitHub выдаст ссылку вида `https://username.github.io/repository-name/`.

## Локальная проверка

Можно просто открыть `index.html` в браузере.

Для более корректной проверки через локальный сервер:

```bash
python3 -m http.server 8000
```

Затем открыть:

```text
http://localhost:8000
```
