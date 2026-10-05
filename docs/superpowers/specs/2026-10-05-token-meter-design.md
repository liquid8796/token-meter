# TokenMeter Design Specification

**Date:** 2026-10-05  
**Project:** TokenMeter

## Product intent
TokenMeter is a public AI model/API cost calculator and pricing intelligence site for developers, founders, and AI teams. The V1 must calculate workload cost, compare models, expose source-backed pricing pages, support SEO, and leave clean seams for pricing history, alerts, provider sync, and team features later.

## V1 scope
- Calculator for input/output/cached-input token volumes.
- Compare up to four models side by side.
- Search/filter model catalog by provider/status/context/modality.
- Canonical provider and model pages with official source URL and `last verified` timestamp.
- PostgreSQL-backed pricing records with a version-controlled fallback snapshot for read-only public pricing pages.
- Metadata, canonical URLs, sitemap, robots, truthful JSON-LD where applicable.
- Ads-ready reserved slots that never interrupt the primary calculator input/result relationship; disabled until configured.
- `/api/health` with safe process/DB readiness output.

Out of V1: auth, private API keys, provider usage ingestion, billing, team dashboards, unsupported benchmark claims, automated scraping as sole truth, Oracle Object Storage unless a real storage need appears, and all Docker/container tooling.

## Architecture
Use a **Next.js + TypeScript modular monolith**.

- `src/domain/pricing`: pure model/pricing types, quantity parsing, decimal-safe cost math, comparison logic. No React/Next/Postgres/env imports.
- `src/application`: use cases; depends on domain/repository interfaces.
- `src/infrastructure`: PostgreSQL repository, config, seed loader, fallback snapshot, future adapters.
- `src/features/*`: user-facing calculator/catalog/compare/detail modules.
- `src/app`: App Router routes, metadata, sitemap, robots, API endpoints.

Patterns: Repository, Adapter, dependency inversion, feature-oriented UI modules. Do not use microservices in V1.

## Data model
### Provider
`id`, unique `slug`, `name`, `websiteUrl`, `pricingUrl`, `isActive`, timestamps.

### Model
`id`, `providerId`, unique canonical `slug`, `name`, optional `family`, factual `description`, nullable `contextWindowTokens`, nullable `maxOutputTokens`, `modalities`, `status` (`active|legacy|preview|deprecated`), optional `releasedAt`, timestamps.

### ModelPricing
`id`, `modelId`, `currency` (USD in V1), `unitTokens` (default 1,000,000), nullable `inputPerUnit`, `outputPerUnit`, `cachedInputPerUnit`, `cacheWritePerUnit`, `batchInputPerUnit`, `batchOutputPerUnit`, `effectiveFrom`, nullable `effectiveTo`, `sourceUrl`, `verifiedAt`, optional `notes`.

Historic price records are retained rather than overwritten. Application/persistence prevents multiple open-ended current records for the same model/currency.

## Calculation contract
Use decimal-safe arithmetic for monetary values.

`inputCost = inputTokens / unitTokens * inputPerUnit`  
`outputCost = outputTokens / unitTokens * outputPerUnit`  
`cachedInputCost = cachedInputTokens / unitTokens * cachedInputPerUnit`  
`total = sum(supported selected billable dimensions)`

Rules:
- parse human quantities such as `250K`, `3M`, `1.5B`;
- reject negative/invalid values and enforce a safe upper bound;
- unsupported dimensions are omitted, not displayed as zero-priced features;
- retain internal precision and round only for presentation;
- never infer discounts absent from the pricing record;
- results identify the pricing verification date and are labeled estimates.

## Visual design contract
**Dials:** Variance 2 / Motion 2 / Density 2.

**Visual thesis:** “precision metering console” — a calibrated AI spend instrument with editorial clarity, not a generic AI SaaS landing page.

**Signature:** a live cost meter with a strong numeric total and proportional component rail that visibly rebalances input/output/cache cost as workload/model changes. Motion explains recalculation rather than decorating the page.

**Palette roles:** near-black petrol background; mineral blue-green surfaces; near-white primary text; cool gray-blue secondary text; steel borders; cyan/teal signal accent; restrained copper/amber monetary accent; separate semantic state colors.

**Typography:** deliberate grotesk/sans interface family; tabular numerals for costs/tokens; monospace only for technical identifiers; body lines under ~80 characters; no decorative all-caps eyebrow system.

**Desktop composition:** calculator-first first viewport with workload/model controls adjacent to the live cost meter, followed by a non-disruptive reserved ad slot and model comparison/catalog content.

**Mobile:** controls first, result immediately after; optional condensed/sticky total only when it does not hide content; deliberate stacked/horizontal comparison behavior; no page-level horizontal overflow.

**Motion:** one restrained first-viewport reveal plus interaction motion; reduced-motion support; no scroll-jacking, particle fields, WebGL, or animation on every card.

**Anti-goals:** purple gradient AI template, nested card soup, fake proof/logos/metrics, marketing hero pushing the tool below the fold, badge clutter, oversized multi-line headlines, identical hover motion everywhere, pricing without source context.

## Routes
- `/` calculator-first home
- `/models`
- `/models/[modelSlug]`
- `/providers/[providerSlug]`
- `/compare` with URL-serializable selection state
- `/about`
- `/privacy`
- `/api/health`

Do not create thin programmatic “X vs Y” pages until each route has distinct useful content/data.

## Pricing content policy
Ship a curated set of relevant models from major providers (initially OpenAI, Anthropic, Google where official pricing is available). Every shipped price must be verified against official provider documentation during implementation and carry `sourceUrl` + `verifiedAt`. No stored price is treated as timeless truth.

## Resilience
- Inline calculator validation preserves the last valid result.
- Public pricing reads fall back to a bundled trusted snapshot if DB reads fail.
- If no trustworthy price exists, show unavailable rather than fabricated/stale cost.
- Unknown model/provider slugs return standard 404.
- Logs are useful but never contain credentials/secrets.
- Health distinguishes process liveness from DB readiness without leaking infrastructure details.

## Accessibility
Release baseline: semantic landmarks/headings, keyboard operation for all calculator/filter/compare actions, visible focus, associated labels/help text, WCAG AA target, touch-friendly controls, reduced-motion, restrained `aria-live` for result changes, and no color-only state communication.

## Performance
- Calculator math runs locally in the client after initial data is loaded.
- Server-render/cache public route data.
- Do not client-ship unrelated model data.
- Reserve ad/media dimensions to prevent CLS.
- Prefer transform/opacity motion.
- No heavyweight animation dependency unless visibly justified.

## Security/privacy
- Dedicated unprivileged Linux service user.
- PostgreSQL stays localhost-only.
- DB credentials live in protected server env files.
- No provider keys required for V1 public reads.
- Parameterized DB access and schema validation/bounds on public inputs.
- Calculator never requests user secrets.
- Analytics/ads load only when explicitly configured; privacy copy must match reality.

## Testing and QA
TDD covers quantity parsing, cost dimensions, invalid/extreme input, formatting, comparison ordering/deltas, repository current/historic reads, seed rules, health degraded state, fallback snapshot, calculator interaction, filters, compare URL state, and empty/error states.

Release uses **QA-3**. Required viewports: 1440×1000, 1280×800, 390×844, plus tablet if the layout materially changes. Critical journey: `home → set workload → select models → compare → model detail → return/deep-link comparison`. Verify real browser input, responsive rendering, keyboard/accessibility baseline, console/network health, production build, and performance smoke. Fix visible defects and rerun the same evidence path.

## Native OCI deployment
Observed target VM on 2026-10-05:
- Ubuntu 24.04 LTS
- Caddy 2.11.4
- Node.js 24.19.0 / npm 11.17.0
- PostgreSQL 17.11 bound to `127.0.0.1:5432`
- existing Next.js apps run natively under systemd
- Caddy vhosts live in `/etc/caddy/conf.d/*.caddy`
- apps conventionally live under `/opt/<app>`

TokenMeter follows that convention:

```text
/opt/token-meter/
  current -> releases/<release-id>
  releases/
  shared/
    .env
```

Deployment requirements:
- dedicated `token-meter` Linux user;
- native Node/Next runtime; **no Docker/Compose/Kubernetes**;
- `token-meter.service` under systemd;
- bind app to `127.0.0.1:<dedicated-port>`;
- `/etc/caddy/conf.d/token-meter.caddy` reverse-proxy + TLS;
- dedicated TokenMeter PostgreSQL database/user;
- release switch + health check + rollback on failed health;
- if no owned domain is supplied, use a `158.180.59.36.sslip.io` subdomain consistent with existing services and keep public origin configurable.

## Object Storage
Do not add OCI Object Storage in V1 without a concrete requirement. Introduce a blob-storage adapter later for large exports/media/artifacts if needed.

## Acceptance criteria
1. Automated tests pass.
2. Production `next build` passes.
3. Systemd service runs as dedicated user.
4. DB migration/seed succeeds without exposing credentials.
5. Caddy validates before reload.
6. Public HTTPS hostname renders TokenMeter.
7. `/api/health` behaves as specified.
8. Calculator critical journey passes through real browser input.
9. Desktop/mobile rendered QA has no blocking layout/accessibility defects.
10. No unexplained product/runtime console errors.
11. Every shipped pricing record has source + verification date.
12. `master` is clean and pushed using commit format `type(scope): message`.

## Future expansion seams
Pricing history/alerts, provider sync with human verification, image/audio/video calculators, batch/caching optimizers, prompt/token estimation, saved scenarios, public pricing API, authenticated team spend, Object Storage-backed artifacts, and affiliate modules are future seams, not V1 requirements.
