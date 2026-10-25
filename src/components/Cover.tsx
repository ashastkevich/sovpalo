/**
 * Обложка-макет (FR-13): рисунок каталога из прототипа, а если его нет — силуэт футболки с условным «принтом»
 * цвета темы бренда. Не изображение бренда: без чужих принтов, персонажей и логотипов. После анкеты — фото бренда.
 */
import { COVER_INK } from "@/lib/covers";

const SHIRT = "M62 34 L84 24 Q100 38 116 24 L138 34 L170 56 L156 84 L140 76 L140 176 L60 176 L60 76 L44 84 L30 56 Z";

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Cover({ id, ink, dark, className }: { id: string; ink: string | null; dark: boolean; className?: string }) {
  const drawn = COVER_INK[id];
  if (drawn) {
    return (
      <div className={`cover tee ${className ?? ""}`} style={{ ["--ink" as string]: drawn }}>
        {/* SVG из public/: next/image для него не нужен. В alt и имени файла нет «футболка <бренд>» (FR-13) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/covers/${id}.svg`} alt="" width={200} height={200} loading="lazy" decoding="async" />
        <span className="illu-cap">Макет каталога, не модель бренда</span>
      </div>
    );
  }
  const h = hash(id);
  const color = ink ?? "#2A3CCF";
  const shirt = dark ? "#1C1D22" : "#F7F6F2";
  const circles = [0, 1, 2].map((i) => ({
    cx: 84 + ((h >> (i * 5)) % 32),
    cy: 70 + ((h >> (i * 7)) % 36),
    r: 8 + ((h >> (i * 3)) % 10),
  }));
  return (
    <div className={`cover tee ${className ?? ""}`} style={{ ["--ink" as string]: color }}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <path d={SHIRT} fill={shirt} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M84 24 Q100 43 116 24" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <clipPath id={`clip-${id}`}>
          <rect x="76" y="56" width="48" height="66" rx="2" />
        </clipPath>
        <g clipPath={`url(#clip-${id})`}>
          {circles.map((c, i) => (
            <circle key={i} {...c} fill={color} opacity={i === 1 ? 0.6 : 0.95} />
          ))}
        </g>
      </svg>
      <span className="illu-cap">Макет каталога, не модель бренда</span>
    </div>
  );
}
