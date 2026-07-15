# Release checklist

Passing automated tests is necessary but does not make a visual release ready by itself.

## Before review

- Inspect `git status` and the complete diff. Preserve unrelated user work.
- Run `git diff --check`.
- Run syntax checks for every changed JavaScript file.
- If media changed, run `pnpm test:media` and keep assets within the documented limits.
- Run `pnpm test`.

## Visual Definition of Done

- Capture and compare the affected states on the real page, not on an isolated colour field.
- Review the relevant rows of the state matrix in `docs/ui-system.md`.
- Compare connected material states under matched conditions; do not rely on computed-style equality alone.
- Watch complete open and close transitions at normal speed and frame by frame.
- Confirm there are no phantom shapes, edge flashes, delayed labels, deformed contours or exposed page frames.
- Confirm the light theme remains soft and continuous and the dark theme retains readable depth.
- Check the smallest supported viewport, a common mobile viewport and desktop.

## Accessibility and writing

Review every changed visible or spoken string in RU, EN and JA.

- Use concise, direct language and familiar words.
- Give links and buttons descriptive labels that make sense out of context.
- Keep instructions before the action they describe and recovery text next to the problem.
- Do not encode meaning only through colour, position or animation.
- Confirm the document language and translated accessible names change with the locale.
- Check keyboard order, focus visibility, focus trapping, Escape close and focus return.
- Check screen-reader order and status announcements; avoid duplicate or surprising announcements.
- Check 200% zoom and 320 px reflow without horizontal scrolling or clipped controls.
- Check `prefers-reduced-motion` and the manual Calm mode.
- Check image alternative text, media controls and any newly added non-text content.
- Read the rendered interface in context; string files alone cannot reveal wrapping or collisions.

For modal changes, also preserve direct artist hashes and all dialog semantics documented in the project README.

## Manual browser pass

- Chromium mobile emulation for the complete state matrix.
- A real or simulated mobile Safari pass for safe-area and browser chrome collisions.
- Desktop Chromium for navigation, footer and pointer behaviour.
- VoiceOver plus Safari for changed dialogs, controls or live regions when preparing a public release.

## Publishing

Only publish after the intended local result has been shown and approved. When the user explicitly asks to push, commit only the approved files directly to `main` and push `origin main` as described in `AGENTS.md`.
