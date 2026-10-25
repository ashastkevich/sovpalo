import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap bp">
      <h1 className="slogan">
        <span>Такой страницы нет.</span> <span>Совпадений не нашлось.</span>
      </h1>
      <Link className="back" href="/">
        ← Все бренды
      </Link>
    </div>
  );
}
