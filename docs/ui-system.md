# Tarski UI system

This document records the visual rules that must remain true across the site. It is a source of truth for implementation and review, not a catalogue of screenshots.

## One material, several geometries

The compact archipelago, service capsule, daylight widget and expanded mobile menu are connected states of one interface. They must use the same material recipe and differ only where their geometry or hierarchy requires it.

- Keep one shared compositing path for fill, backdrop blur, edge and depth.
- Change shape with the existing mask or clip path. Do not recreate the material with an SVG texture, copied colours or a second "similar" gradient.
- A geometry-only change must not silently change density, blur, translucency, shadow, content behaviour, expanded states or motion.
- The three compact contours preserve the source `Cover.svg` proportions. Uniform scale, rotation and translation are allowed; deformation is not.
- A token match in source code is not sufficient. Connected states must look like the same material over the same real page content.

The desktop navigation and shared controls use the same `--gutter-*` family for their groove, active capsule, edge, shadow and backdrop. New segmented controls should reuse these tokens instead of defining a parallel visual system.

## Depth and edges

Depth has three jobs: separate a control from content, clarify the active layer and preserve the object contour. It must not become a black outline in the light theme or a large grey cloud around the object.

- Use a continuous, low-contrast edge around the full contour.
- Keep light-theme shadows soft and neutral; no isolated dark arcs or edge flashes during transitions.
- Keep dark-theme edges visible without turning the surface into a flat grey object.
- The service capsule is the reference state for compact depth. The expanded menu is the reference state for a large surface.
- Do not add a local shadow to one state without checking the entire connected state set.

## Motion grammar

All menu states share one physical model: a stable material changes its extent while content cross-fades within it.

- Prefer position, scale, clip path and opacity over swapping whole layers.
- Keep the source and destination material continuously visible; never reveal the bare page between them.
- Hide outgoing content only when incoming content has begun to establish the destination state.
- Avoid empty intermediate ovals, rectangles, white points and delayed labels.
- Compact top and bottom archipelagos enter vertically into their working position; they do not slide in from the sides.
- Motion should feel calm and deliberate. Reuse the existing island easing and duration tokens.
- `prefers-reduced-motion: reduce` and the manual Calm mode must remove non-essential travel and trail animation without removing access to any content.

## Controls

- Segmented controls use a persistent groove and one moving active capsule.
- Controls with different numbers of options may have different widths, but keep the same control height, inner padding, edge and active shadow.
- Keyboard behaviour follows the radio-group pattern: arrow keys move between options; Home and End jump to the first and last option.
- Every interactive element needs visible hover, focus-visible, active and selected states.
- Hit targets must remain usable at mobile sizes even when the visual element is small.

## State matrix

Every material or motion change is reviewed in this matrix:

| Viewport | State | Themes | Locales |
| --- | --- | --- | --- |
| Mobile | compact archipelago | light, dark | RU, EN, JA |
| Mobile | service capsule | light, dark | RU, EN, JA |
| Mobile | daylight and empathy widget | light, dark | RU, EN, JA |
| Mobile | expanded menu | light, dark | RU, EN, JA |
| Desktop | navigation field and service capsule | light, dark | RU, EN, JA |
| Desktop | footer and shared controls | light, dark | RU, EN, JA |

Review connected states on the same page background and at the same scale. Inspect both still frames and the full transition.
