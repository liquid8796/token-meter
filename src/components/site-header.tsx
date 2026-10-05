import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="TokenMeter home">
        <span className="brand-mark" aria-hidden="true"><i /></span>
        <span>TokenMeter</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/#calculator">Calculator</Link>
        <Link href="/models">Models</Link>
        <Link href="/compare">Compare</Link>
        <Link href="/budget">Budget</Link>
        <Link href="/changes">Changes</Link>
      </nav>
      <Link className="header-source" href="/about">
        Methodology <span aria-hidden="true">â†—</span>
      </Link>
    </header>
  );
}
