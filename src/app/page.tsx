import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="TokenMeter home">
          <span className="brand-mark" aria-hidden="true" />
          <span>TokenMeter</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#calculator">Calculator</a>
          <Link href="/models">Models</Link>
          <Link href="/compare">Compare</Link>
        </nav>
      </header>

      <section className="intro" id="calculator">
        <p className="intro-kicker">AI API pricing, calibrated to your workload</p>
        <h1>Price your AI workload before it reaches production.</h1>
        <p>
          TokenMeter turns provider pricing into a comparable monthly estimate and keeps the
          official source and verification date attached to every rate.
        </p>
      </section>

      <section className="foundation-meter" aria-label="Calculator preview">
        <div>
          <span className="foundation-label">Calculator foundation</span>
          <strong>Workload controls and live pricing are next.</strong>
        </div>
        <span className="foundation-signal" aria-hidden="true" />
      </section>
    </main>
  );
}
