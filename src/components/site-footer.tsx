import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand brand-small" href="/">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          TokenMeter
        </Link>
        <p>Source-backed AI API pricing for workload planning. Estimates only.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/models">Models</Link>
        <Link href="/compare">Compare</Link>
        <Link href="/about">Methodology</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
      <span className="footer-year">© 2026</span>
    </footer>
  );
}
