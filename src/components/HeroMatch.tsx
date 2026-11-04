export function HeroMatch() {
  return (
    <div className="match-visual" aria-label="Совпадение бренда и покупателя">
      <div className="match-field">
        <div className="match-grid" aria-hidden="true" />
        <svg className="match-orbits" viewBox="0 0 460 480" fill="none" aria-hidden="true">
          <circle cx="230" cy="240" r="92" />
          <circle cx="230" cy="240" r="158" />
          <path d="M75 180 195 224M268 218l112-72M270 268l100 98M190 276 93 344" />
        </svg>
        <div className="match-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol-white.svg" alt="" width="258" height="246" />
          <span>здесь<br />совпало</span>
        </div>
        <span className="category-node node-brands">бренды</span>
        <span className="category-node node-prints">принты</span>
        <span className="category-node node-taste">ваш вкус</span>
        <span className="category-node node-choice">ваш выбор</span>
        <span className="category-node node-more">+ новые совпадения</span>
        <span className="field-index">КАТАЛОГ / 001—∞</span>
      </div>
      <div className="hero-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/symbol.svg" alt="" width="258" height="246" />
        <div><strong>∞</strong><span>пространство для открытий</span></div>
      </div>
      <div className="hero-note">место<br />нельзя купить</div>
      <div className="match-stamp" aria-hidden="true">выбираете<br />вы</div>
      <svg className="scribble" viewBox="0 0 180 70" fill="none" aria-hidden="true">
        <path d="M7 54c28 13 49 7 68-15 17-20 34-24 44-13 9 11-4 30-22 19-14-8 9-34 72-36" />
        <path d="m158 3 12 6-8 11" />
      </svg>
    </div>
  );
}
