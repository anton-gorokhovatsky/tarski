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

## Spacing system

Spacing is a global contract, not a value chosen separately for each screenshot. Use the `--space-*` scale in `styles.css` for every new or changed margin, padding, gap and inset.

- Structural spacing uses the 4px scale: 8, 12, 16, 20, 24, 28, 32, 40, 48 and 64px.
- The 2, 4, 6 and 10px half-steps are reserved for dense control internals, hairline compensation and compact row gaps. They are not page-layout values.
- A surface defines one semantic edge token and reuses it on all applicable sides. The mobile daylight surface uses `--daylight-panel-inset: var(--space-7)`; its last visible control row must finish at the same inset as its horizontal content.
- Internal labels may have optical type corrections, but container geometry remains on the spacing scale. Do not move the container to compensate for a font.
- A value outside the scale requires a nearby code comment explaining the source geometry, safe-area calculation or optical exception. Unexplained literals are a review failure.
- Review computed geometry, not only declarations: compare outer edges, sibling gaps and the final row against the semantic token at every changed breakpoint.

## Corner geometry and curvature

A radius describes size; it does not by itself guarantee a visually smooth join between a straight edge and a corner. For exposed panels and cards, follow the continuous-curvature principle described in Sergey Nikolaev's [article on smooth corner rounding](https://kefiijrw.medium.com/illustrator-corner-rounding-7c485e7fed67): curvature should build gradually instead of jumping from a straight line into a circular arc.

- Large exposed surfaces use the shared `--corner-*` radius tokens and `corner-shape: var(--corner-shape-continuous)` as a progressive enhancement. The ordinary `border-radius` contour remains the required fallback for browsers without `corner-shape` support.
- `--corner-card`, `--corner-panel-compact`, `--corner-panel-mobile`, `--corner-daylight`, `--corner-sheet-mobile`, `--corner-panel` and `--corner-dossier` are the available surface radii. Do not introduce another panel or card radius without adding a named geometric role here first.
- `50%` and `999px` are reserved for intentional circles and full capsules. A pill is a distinct control geometry, not a shortcut for making a panel feel smoother.
- When two rounded contours follow the same edge, keep them concentric: the inner radius is `max(outer radius - inset, 0)`. A full capsule may express this through the same `999px` sentinel because the browser clamps each contour to half its own height.
- Branded SVG contours and animated `clip-path` morphs are geometry sources in their own right. Judge their curvature visually and edit the shared contour when necessary; do not replace them with an approximate `border-radius` or add a second masking layer.
- Do not add `corner-shape` to zero-radius or visually absent geometry. Every declaration should affect a visible contour.
- Review both the enhanced contour in a supporting browser and the circular fallback in Safari/WebKit. A smooth corner must not change hit targets, focus rings, overflow, scroll clipping or the shared material.

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
- Motion should feel calm and deliberate. Match easing to the physical role instead of reusing one curve everywhere:
  - `--ease-enter` for content or controls arriving into view;
  - `--ease-exit` for content leaving the interface;
  - `--ease-move` for a surface, capsule or indicator travelling between two visible states.
- Durations describe distance and hierarchy; easing describes direction. Do not change both merely to make one transition feel different.
- `prefers-reduced-motion: reduce` removes transition travel almost entirely. Manual Calm remains a complete, pleasant motion profile: use gentle no-overshoot curves, readable durations and continuous surfaces, while reducing only distracting ambient motion. Never implement Calm as blanket sub-100 ms transitions.

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
