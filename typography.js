(() => {
  const russianNoBreakWords = new Set([
    'а', 'без', 'бы', 'в', 'во', 'вы', 'да', 'до', 'для', 'его', 'ей', 'ему',
    'её', 'ее', 'же', 'за', 'и', 'из', 'или', 'им', 'их', 'к', 'как', 'ко',
    'кто', 'ли', 'мы', 'на', 'над', 'не', 'ни', 'но', 'о', 'об', 'обо', 'он',
    'она', 'они', 'оно', 'от', 'по', 'под', 'при', 'про', 'с', 'со', 'ты', 'у',
    'что', 'я'
  ]);
  const trailingWord = /([\p{L}]+)$/u;
  const startsWithWord = /^[^\p{L}\p{N}]*[\p{L}\p{N}]/u;
  const skippedAncestors = 'script, style, noscript, textarea, code, pre, svg, [data-no-typography]';

  const text = (value, language = 'ru') => {
    if (language !== 'ru' || typeof value !== 'string' || !value.includes(' ')) return value;

    const parts = value.split(/([ \t]+)/);
    for (let index = 0; index < parts.length - 2; index += 2) {
      const word = parts[index].match(trailingWord)?.[1]?.toLocaleLowerCase('ru-RU');
      if (
        word
        && russianNoBreakWords.has(word)
        && startsWithWord.test(parts[index + 2])
      ) {
        parts[index + 1] = '\u00a0';
      }
    }
    return parts.join('');
  };

  const value = (input, language = 'ru') => (
    Array.isArray(input)
      ? input.map((item) => text(item, language))
      : text(input, language)
  );

  const apply = (root = document.body, language = document.documentElement.lang) => {
    if (!root || language !== 'ru') return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      if (!node.nodeValue?.includes(' ') || node.parentElement?.closest(skippedAncestors)) return;
      node.nodeValue = text(node.nodeValue, language);
    });
  };

  window.tarskiTypography = Object.freeze({ apply, text, value });

  const applyDocument = () => apply(
    document.body,
    document.documentElement.dataset.language || document.documentElement.lang
  );
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDocument, { once: true });
  } else {
    applyDocument();
  }
})();
