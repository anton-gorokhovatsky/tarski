# Empathy layer

The empathy layer creates a brief, optional moment of self-check-in. It is not a profiling or analytics system.

## Behaviour

- The daylight widget presents one deterministic question per local calendar day on mobile; desktop exposes the same check-in in the contextual "Today" block inside site settings.
- The question rotates through localized RU, EN and JA sets without a network request.
- Answers are Calm, Tired, Tense, Curious and Skip.
- Tired and Tense temporarily select Calm motion. Calm, Curious and Skip do not alter the interface rhythm.
- Feedback always explains what changed and offers a way to restore the rhythm or open settings.
- The question, feedback and controls occupy a stable reserved area so locale wrapping does not move the action row outside the widget.

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

Run `tests/empathy.spec.mjs` and then inspect every answer in RU, EN and JA on mobile and desktop. Check first visit, repeat visit, stale storage, malformed storage, calm-mode undo, equal answer geometry and stable widget/settings bounds.
