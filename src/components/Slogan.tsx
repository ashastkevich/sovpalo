/** Слоган меняется при каждом открытии страницы, выбор нигде не сохраняется (FR-7) */
const SLOGANS: [string, string][] = [
  ["Все совпадения", "неслучайны."],
  ["О вкусах не спорят.", "Их фильтруют."],
  ["Это не судьба.", "Это фильтры."],
  ["Любовь с первого взгляда", "по заданным параметрам."],
  ["Мы не знаем, что вам понравится.", "Вы — знаете."],
];

/** index выбирает вызывающий код: при переходах по фильтрам строка не меняется */
export function Slogan({ index }: { index: number }) {
  const [a, b] = SLOGANS[index % SLOGANS.length];
  return (
    <>
      <h1 className="slogan">
        <span>{a}</span> <span>{b}</span>
      </h1>
      <p className="paysame">
        <i aria-hidden="true">=</i>Все бренды на одних условиях, совпадения — на ваших
      </p>
    </>
  );
}

export const SLOGAN_COUNT = SLOGANS.length;
