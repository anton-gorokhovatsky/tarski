# Tarski Project Notes

This repository is the production source for https://tarski.ru/.

## Publishing

- The usual workflow for this project is direct publishing to `main`.
- When the user explicitly says to push, commit the approved local changes directly on `main` and run `git push origin main`.
- Do not propose a branch or pull request unless the user explicitly asks for one.
- Before every push, inspect `git status` and the diff so only the intended files are staged.
- Keep commits small and name them after the visible change.

## Verification

- This is a static GitHub Pages site with no build step.
- For HTML/CSS changes, run `git diff --check`.
- For JavaScript changes, run a syntax check on `script.js` and/or `i18n.js` when those files changed.
- When adding or replacing image assets, run `node tools/check-media-assets.mjs` and keep artist images below the documented hard limit.
- For visual changes, verify the affected mobile and desktop states in a local browser before publishing.
- For modal changes, verify Escape close, Tab focus trapping, focus return, and direct artist hashes.
