import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

interface ContentPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function ContentPage({ eyebrow, title, description, children }: ContentPageProps) {
  return (
    <div className="site-frame">
      <div className="page-shell">
        <SiteHeader />
        <main>
          <header className="content-hero">
            <p className="hero-kicker"><span className="signal-dot" />{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
