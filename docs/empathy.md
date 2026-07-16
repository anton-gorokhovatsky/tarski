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
- After a stored answer, the mobile and desktop check-ins show the localized disclosure that the answer remains only on this device.
- Yandex clickmap and content capture are disabled for the empathy panel.

Any future personalisation requires a separate privacy review, an explicit explanation and user control before implementation.

## Content registry

This is the editorial inventory for the daylight, weather and daily check-in surfaces. The runtime source of truth remains `i18n.js`; update this registry whenever any of these strings or display rules change.

### Daily questions

One question is selected deterministically for each local calendar day. The same question is used in the mobile daylight widget and the desktop “Today” settings block.

| Variant | RU | EN | JA |
| --- | --- | --- | --- |
| 1 | Как вы сегодня? | How are you today? | 今日はどんな調子ですか？ |
| 2 | Какой у вас сегодня внутренний ритм? | What is your inner rhythm today? | 今日の心のリズムはどんな感じですか？ |
| 3 | Что вы замечаете в своём состоянии сегодня? | What do you notice about how you feel today? | 今日の自分の状態に何を感じますか？ |

Accessible name for the answer group:

| RU | EN | JA |
| --- | --- | --- |
| Самочувствие сегодня | How you feel today | 今日の調子 |

### Answers and interface effect

| Key | RU | EN | JA | Effect |
| --- | --- | --- | --- | --- |
| `calm` | Спокойно | Calm | 穏やか | Keeps the usual motion rhythm. |
| `tired` | Усталость | Tired | 疲れている | Temporarily selects Calm motion and offers Restore. |
| `tense` | Напряжение | Tense | 緊張している | Temporarily selects Calm motion and offers Restore. |
| `curious` | Любопытно | Curious | 好奇心がある | Keeps the current motion setting. |
| `skip` | Пропустить | Skip | スキップ | Changes nothing and is not stored. |

### Feedback after an answer

| State | RU | EN | JA |
| --- | --- | --- | --- |
| `calm` | Спасибо. Оставляем обычный ритм. | Thank you. We will keep the usual rhythm. | ありがとうございます。いつものリズムを保ちます。 |
| `tired` | Спасибо. Сделали движение спокойнее. | Thank you. We made the motion calmer. | ありがとうございます。動きを穏やかにしました。 |
| `tense` | Спасибо. Сделали движение спокойнее. | Thank you. We made the motion calmer. | ありがとうございます。動きを穏やかにしました。 |
| `curious` | Спасибо. Исследуйте в своём ритме. | Thank you. Explore at your own pace. | ありがとうございます。ご自分のペースで探索してください。 |
| `skip` | Хорошо. Ничего не меняем. | All right. Nothing will change. | わかりました。何も変えません。 |
| `restored` | Вернули ваши прежние настройки. | Your previous settings are back. | 以前の設定に戻しました。 |

### Storage disclosure and recovery action

The storage disclosure appears only after a non-skip answer that was saved on the current device. It is not shown after Skip or Restore.

| Element | RU | EN | JA |
| --- | --- | --- | --- |
| Storage disclosure | Ответ сохранён только на этом устройстве. | Your answer is saved only on this device. | 回答はこの端末にのみ保存されました。 |
| Restore action | Вернуть | Restore | 元に戻す |

### Weather statuses

| Key | RU | EN | JA |
| --- | --- | --- | --- |
| `clear` | Ясно | Clear | 晴れ |
| `partlyCloudy` | Переменная облачность | Partly cloudy | 晴れ時々曇り |
| `cloudy` | Облачно | Cloudy | 曇り |
| `fog` | Туман | Fog | 霧 |
| `drizzle` | Морось | Drizzle | 霧雨 |
| `rain` | Дождь | Rain | 雨 |
| `showers` | Ливни | Showers | にわか雨 |
| `snow` | Снег | Snow | 雪 |
| `thunderstorm` | Гроза | Thunderstorm | 雷雨 |

While current weather is unavailable, the settings surface shows:

| RU | EN | JA |
| --- | --- | --- |
| Погода загружается… | Loading weather… | 天気を読み込んでいます… |

### Weather advice and display rules

Only one advice line is shown. Rules are evaluated from top to bottom, so an earlier match wins.

| Priority | Rule | Key | RU | EN | JA |
| --- | --- | --- | --- | --- | --- |
| 1 | Thunderstorm | `storm` | В грозу оставайтесь в помещении, вдали от окон. | Thunderstorm: stay indoors, away from windows. | 雷雨時は屋内に入り、窓から離れてください。 |
| 2 | Drizzle, rain or showers | `umbrella` | Если собираетесь выходить, зонт может пригодиться. | If you are heading out, an umbrella may come in handy. | 外出するなら、傘が役立ちそうです。 |
| 3 | Temperature is 27 °C or higher | `heat` | Вода, тень и SPF сегодня будут кстати. | Water, shade, and SPF may be useful today. | 今日は水分と日陰、日焼け止めが役立ちそうです。 |
| 4 | Temperature is 3 °C or lower | `warm` | Возможно, стоит одеться чуть теплее. | You may want to dress a little warmer. | 少し暖かい服装がよさそうです。 |
| 5 | Clear weather, when no earlier rule matched | `walk` | Хороший день, чтобы немного пройтись. | A good day for a short walk. | 少し歩くのによさそうな日です。 |

No advice is displayed for partly cloudy, cloudy or foggy weather when the temperature is between 3 °C and 27 °C. Snow receives only the temperature-based warm-clothing advice when it is 3 °C or colder.

### Related settings guidance

| Element | RU | EN | JA |
| --- | --- | --- | --- |
| Settings introduction | Выберите, как сайт будет отвечать вам. | Choose how the site responds to you. | サイトがどのように応答するかを選べます。 |
| Language note | Выбрать язык интерфейса. | Choose the interface language. | インターフェースの言語を選べます。 |
| Theme note | Следовать световому дню или выбрать вручную. | Follow daylight or choose a theme yourself. | 日照時間に合わせるか、手動で選べます。 |
| Motion note | Обычный ритм или более спокойные переходы. | The usual rhythm or calmer transitions. | 通常のリズム、または穏やかな切り替え。 |

### Storm-safety references

The storm message follows official guidance to move indoors and stay away from windows: [МЧС России](https://33.mchs.gov.ru/rekomendacii-naseleniyu/osnovnye-pravila-i-trebovaniya-bezopasnosti-pri-groze) and the [US National Weather Service](https://www.weather.gov/safety/thunderstorm).

## QA

Run `tests/empathy.spec.mjs` and then inspect every answer in RU, EN and JA on mobile and desktop. Check first visit, repeat visit, stale storage, malformed storage, calm-mode undo, equal answer geometry, centered labels, the left-packed second row, the shared 28px side/bottom inset and stable widget/settings bounds.
