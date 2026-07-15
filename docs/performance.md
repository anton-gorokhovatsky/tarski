# Performance budget

Tarski is a static site. Interaction richness must not turn into permanent work on an idle page.

## Current rules

- Critical local scripts and styles stay below 360 KB uncompressed in aggregate.
- Artist dossier media is not requested on initial load.
- The pointer trail creates no canvas and runs no animation loop until an eligible mouse interaction occurs.
- Touch input, Calm mode and `prefers-reduced-motion` never allocate the trail canvas.
- The canvas pixel ratio is capped at 1.6 to limit fill cost on high-DPR displays.
- Stop animation loops as soon as their visible work is complete.
- New widgets must not add a production framework or WebGL context without a measured benefit and a non-WebGL fallback.

## Verification

Run:

```text
pnpm exec playwright test tests/performance.spec.mjs
pnpm test:media
```

The performance test covers the critical byte budget, deferred dossier loading, idle canvas allocation, DPR cap, reduced motion and touch behaviour.

Before accepting a new animated surface, measure its idle CPU/GPU cost, interaction responsiveness and mobile behaviour. A visually subtle effect is not automatically computationally cheap.
