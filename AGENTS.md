# Tarski Project Notes

This repository is the production source for https://tarski.ru/.

## Publishing

- The usual workflow for this project is publishing through a short-lived `agent/<description>` branch and a draft pull request targeting `main`.
- When the user explicitly says to push or publish, inspect the working tree, create a focused branch when currently on `main`, commit only the approved files, push with tracking, and open a draft pull request.
- Keep the pull request as a draft until the relevant checks pass and the user approves merging it.
- Push directly to `main` only when the user explicitly asks to bypass the pull request workflow.
- Before every push, inspect `git status` and the diff so only the intended files are staged.
- Keep commits small and name them after the visible change.

## Verification

- This is a static GitHub Pages site with no build step.
- For HTML/CSS changes, run `git diff --check`.
- For JavaScript changes, run a syntax check on `script.js` and/or `i18n.js` when those files changed.
- When adding or replacing image assets, run `node tools/check-media-assets.mjs` and keep artist images below the documented hard limit.
- For visual changes, verify the affected mobile and desktop states in a local browser before publishing.
- For modal changes, verify Escape close, Tab focus trapping, focus return, and direct artist hashes.
