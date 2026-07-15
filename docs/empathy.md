# Empathy layer

The empathy layer creates a brief, optional moment of self-check-in. It is not a profiling or analytics system.

## Behaviour

- The daylight widget presents one deterministic question per local calendar day on mobile; desktop exposes the same check-in in the contextual "Today" block inside site settings.
- The question rotates through localized RU, EN and JA sets without a network request.
- Answers are Calm, Tired, Tense, Curious and Skip.
- Tired and Tense temporarily select Calm motion. Calm, Curious and Skip do not alter the interface rhythm.
- On mobile, theme selection remains visible while the daily question is active.
- Feedback always explains what changed. On mobile, the theme and motion controls remain visible directly below it; their selected states make the current result explicit without opening another panel.
- When Tired or Tense temporarily selects Calm motion, a separate Restore action is available next to the feedback. Answers that do not change settings show no redundant action.
- The question, feedback and inline controls occupy a stable reserved area so locale wrapping does not move controls outside the widget.
- Answer pills form a left-packed grid: the second row begins at the first column, while every label remains centered inside its own pill on both axes.
- Mobile daylight surfaces use the global `--space-7` edge inset (28px) for the content sides and the final control row at the bottom. Answer-row gaps use `--space-1-5` (6px); transitions between the question or feedback and a control row use `--space-3` (12px).

## Local storage and privacy

The only record is stored in `localStorage` under `tarski-empathy-v1`:

```json
{
  "date": "YYYY-MM-DD",
  "answer": "calm | tired | tense | curious | skip",
  "motionAdapted": true
}
```

- The record is valid only for the current local date.
- Malformed, stale or unknown values are removed.
- No answer is sent to analytics, a server or another device.
- The footer carries the persistent localized disclosure, and the desktop check-in repeats it next to the answers: the answer remains only on this device.
- Yandex clickmap and content capture are disabled for the empathy panel.

Any future personalisation requires a separate privacy review, an explicit explanation and user control before implementation.

## QA

Run `tests/empathy.spec.mjs` and then inspect every answer in RU, EN and JA on mobile and desktop. Check first visit, repeat visit, stale storage, malformed storage, calm-mode undo, equal answer geometry, centered labels, the left-packed second row, the shared 28px side/bottom inset and stable widget/settings bounds.
